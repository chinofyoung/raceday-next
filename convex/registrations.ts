import { mutation, query, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const getCount = query({
    args: { eventId: v.id("events"), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const status = args.status || "paid";
        // Convex has no native COUNT — collect() is required to get a row count.
        // We cap at 10 000 to prevent unbounded reads for extremely large events;
        // real-world race events are unlikely to exceed this limit.
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event_status", (q) =>
                q.eq("eventId", args.eventId).eq("status", status as "paid" | "pending" | "cancelled")
            )
            .take(10000);
        return registrations.length;
    },
});

export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        const uniqueEventIds = [...new Set(registrations.map((r) => r.eventId))];
        const fetchedEvents = await Promise.all(uniqueEventIds.map((id) => ctx.db.get(id)));
        const eventMap = new Map(
            fetchedEvents
                .filter(Boolean)
                .map((e) => [e!._id, e!])
        );

        return registrations.map((reg) => {
            const event = eventMap.get(reg.eventId);
            return {
                ...reg,
                event: event ? { ...event, id: event._id } : null,
            };
        });
    },
});

export const list = query({
    args: {
        userId: v.optional(v.id("users")),
        eventId: v.optional(v.id("events")),
        organizerId: v.optional(v.id("users")),
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        let q: any = ctx.db.query("registrations");
        let statusHandled = false;

        if (args.userId) {
            q = q.withIndex("by_user", (q: any) => q.eq("userId", args.userId));
        } else if (args.organizerId && args.status && args.status !== "all") {
            // Use composite index when both organizerId and status are provided
            q = q.withIndex("by_organizer_status", (q: any) =>
                q.eq("organizerId", args.organizerId).eq("status", args.status)
            );
            statusHandled = true;
        } else if (args.organizerId) {
            q = q.withIndex("by_organizer", (q: any) => q.eq("organizerId", args.organizerId));
        } else if (args.eventId) {
            q = q.withIndex("by_event", (q: any) => q.eq("eventId", args.eventId));
        }

        if (!statusHandled && args.status && args.status !== "all") {
            q = q.filter((q: any) => q.eq(q.field("status"), args.status));
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});

export const getCategoryCounts = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        // Single query on by_event index, filter non-cancelled in memory
        // Replaces 2 separate indexed queries + 2 collects
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            if (r.status === "paid" || r.status === "pending") {
                counts[r.categoryId] = (counts[r.categoryId] || 0) + 1;
            }
        });
        return counts;
    },
});

export const checkExisting = query({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
        categoryId: v.string(),
    },
    handler: async (ctx: QueryCtx, args) => {
        // Only block if user already has a PAID registration for this category.
        // Pending registrations should not block retries — user may have abandoned checkout.
        const existing = await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.and(
                q.eq(q.field("eventId"), args.eventId),
                q.eq(q.field("categoryId"), args.categoryId),
                q.eq(q.field("status"), "paid"),
                q.eq(q.field("isProxy"), false)
            ))
            .first();
        return !!existing;
    },
});

export const create = mutation({
    args: {
        eventId: v.id("events"),
        categoryId: v.string(),
        userId: v.id("users"),
        isProxy: v.boolean(),
        registrationData: v.any(),
        totalPrice: v.number(),
    },
    handler: async (ctx: MutationCtx, args) => {
        // Auth is handled by the API route (Clerk) before calling this mutation
        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        return await ctx.db.insert("registrations", {
            ...args,
            organizerId: event.organizerId,
            status: "pending",
            raceKitClaimed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Called from server-side API routes only (create-checkout).
// Auth is enforced at the API route layer via Clerk; Convex fetchMutation
// does not forward the user's identity token, so ctx.auth is unavailable here.
export const updatePaymentInfo = mutation({
    args: {
        id: v.id("registrations"),
        xenditInvoiceId: v.string(),
        xenditInvoiceUrl: v.string(),
    },
    handler: async (ctx: MutationCtx, args) => {
        const reg = await ctx.db.get(args.id);
        if (!reg) throw new Error("Registration not found");
        // Only allow updating payment info on pending registrations
        if (reg.status !== "pending") throw new Error("Registration is not pending");

        await ctx.db.patch(args.id, {
            xenditInvoiceId: args.xenditInvoiceId,
            xenditInvoiceUrl: args.xenditInvoiceUrl,
            updatedAt: Date.now(),
        });
    },
});

export const markAsPaid = mutation({
    args: {
        id: v.id("registrations"),
        paymentStatus: v.string(),
        raceNumber: v.optional(v.string()),
        qrCodeUrl: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const reg = await ctx.db.get(args.id);
        if (!reg) throw new Error("Registration not found");

        // State guard: prevent marking as paid unless payment was properly initiated.
        // Free registrations (totalPrice=0) are allowed; paid registrations must have
        // a xenditInvoiceId set by updatePaymentInfo (which requires auth).
        if (reg.totalPrice > 0 && !reg.xenditInvoiceId) {
            throw new Error("Cannot mark as paid: no payment invoice found");
        }
        if (reg.status === "paid") {
            return; // Idempotent — already paid
        }

        await ctx.db.patch(args.id, {
            status: "paid",
            paymentStatus: args.paymentStatus,
            raceNumber: args.raceNumber,
            qrCodeUrl: args.qrCodeUrl,
            paidAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Increment the denormalized registeredCount on the event category.
        // NOTE: There is currently no cancellation/refund mutation, so this
        // counter is only ever incremented — never decremented. If a
        // cancellation flow is added in the future, it must patch the
        // corresponding category's registeredCount by -1 to keep it in sync.
        // The authoritative count is always ctx.db.query("registrations") with
        // by_event_status; registeredCount is a display-only cache.
        const event = await ctx.db.get(reg.eventId);
        if (event && event.categories) {
            const catIndex = event.categories.findIndex(c => (c.id || "0") === reg.categoryId);
            if (catIndex !== -1) {
                const newCategories = [...event.categories];
                newCategories[catIndex] = {
                    ...newCategories[catIndex],
                    registeredCount: (newCategories[catIndex].registeredCount || 0) + 1
                };
                await ctx.db.patch(reg.eventId, {
                    categories: newCategories,
                    updatedAt: Date.now(),
                });
            }
        }
    },
});

export const getEventFulfillmentStats = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Convex has no native COUNT — collect() is required to iterate rows.
        // We cap at 10 000 to prevent unbounded reads; real-world race events
        // are unlikely to exceed this limit.
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event_status", (q) =>
                q.eq("eventId", args.eventId).eq("status", "paid")
            )
            .take(10000);

        const total = registrations.length;
        const claimed = registrations.filter(r => r.raceKitClaimed).length;

        return { total, claimed };
    },
});

export const markAsClaimed = mutation({
    args: { id: v.id("registrations") },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        // Only organizers, admins, or volunteers can claim kits
        const reg = await ctx.db.get(args.id);
        if (!reg) throw new Error("Registration not found");

        if (user.role !== "admin") {
            const event = await ctx.db.get(reg.eventId);
            if (!event) throw new Error("Event not found");

            const isOrganizer = event.organizerId === user._id;
            const isVolunteer = await ctx.db
                .query("volunteers")
                .withIndex("by_event_user", (q) =>
                    q.eq("eventId", reg.eventId).eq("userId", user._id)
                )
                .filter((q) => q.eq(q.field("status"), "accepted"))
                .first();

            if (!isOrganizer && !isVolunteer) {
                throw new Error("Forbidden: only event staff can claim kits");
            }
        }

        await ctx.db.patch(args.id, {
            raceKitClaimed: true,
            raceKitClaimedAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const search = query({
    args: {
        eventId: v.id("events"),
        query: v.string()
    },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const term = args.query.trim().toLowerCase();
        if (!term) return [];

        // Use by_event_status index to fetch only paid registrations efficiently
        // Capped at 5000 to prevent unbounded reads for massive events
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event_status", (q) =>
                q.eq("eventId", args.eventId).eq("status", "paid")
            )
            .take(5000);

        // Filter in-memory and cap results to avoid sending large payloads
        const matched = registrations.filter((r) =>
            (r.registrationData?.participantInfo?.name?.toLowerCase().includes(term)) ||
            (r.raceNumber?.toLowerCase().includes(term))
        );

        return matched.slice(0, 50);
    },
});

export const getById = query({
    args: { id: v.id("registrations") },
    handler: async (ctx: QueryCtx, args) => {
        const reg = await ctx.db.get(args.id);
        if (!reg) return null;

        // Server-to-server calls (webhook, sync) don't carry a user identity token.
        // Auth for those paths is enforced at the API route layer (callback token / Clerk).
        // fetchQuery from convex/nextjs is server-side only, so no-identity == trusted server call.
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return reg;

        // Client calls: verify caller is owner, organizer, admin, or accepted volunteer
        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        if (user.role === "admin" || reg.userId === user._id) {
            return reg;
        }

        const event = await ctx.db.get(reg.eventId);
        if (event && event.organizerId === user._id) {
            return reg;
        }

        const volunteer = await ctx.db
            .query("volunteers")
            .withIndex("by_event_user", (q) =>
                q.eq("eventId", reg.eventId).eq("userId", user._id)
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .first();
        if (volunteer) {
            return reg;
        }

        throw new Error("Forbidden");
    },
});

export const getByUserAndEvent = query({
    args: { userId: v.id("users"), eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db
            .query("registrations")
            .withIndex("by_user_event", (q) =>
                q.eq("userId", args.userId).eq("eventId", args.eventId)
            )
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "paid"),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();
    },
});

// Shared helper: returns unique participant emails for an event (paid + pending)
async function fetchEmailsForEvent(ctx: QueryCtx, eventId: Id<"events">): Promise<string[]> {
    const paid = await ctx.db
        .query("registrations")
        .withIndex("by_event_status", (q) =>
            q.eq("eventId", eventId).eq("status", "paid")
        )
        .collect();

    const pending = await ctx.db
        .query("registrations")
        .withIndex("by_event_status", (q) =>
            q.eq("eventId", eventId).eq("status", "pending")
        )
        .collect();

    const emails = [...paid, ...pending]
        .map(r => (r as any).registrationData?.participantInfo?.email)
        .filter(Boolean);

    return [...new Set(emails)] as string[];
}

export const getEmailsForEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        if (user.role !== "admin") {
            const event = await ctx.db.get(args.eventId);
            if (!event || event.organizerId !== user._id) {
                throw new Error("Forbidden");
            }
        }

        return fetchEmailsForEvent(ctx, args.eventId);
    },
});

// Internal version used by emails.ts action — delegates to shared logic
export const getEmailsForEventInternal = internalQuery({
    args: { eventId: v.id("events") },
    handler: async (ctx, args): Promise<string[]> => {
        return fetchEmailsForEvent(ctx, args.eventId);
    },
});

export const getOrganizerDashboardStats = query({
    args: { organizerId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Fetch only PAID registrations using composite index — no post-filter
        const paid = await ctx.db
            .query("registrations")
            .withIndex("by_organizer_status", (q) =>
                q.eq("organizerId", args.organizerId).eq("status", "paid")
            )
            .take(10000);

        const totalRevenue = paid.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        const claimedKits = paid.filter(r => r.raceKitClaimed).length;

        // Group stats by eventId
        const eventStats: Record<string, { total: number; claimed: number; revenue: number }> = {};
        paid.forEach(r => {
            const eid = r.eventId;
            if (!eventStats[eid]) eventStats[eid] = { total: 0, claimed: 0, revenue: 0 };
            eventStats[eid].total++;
            if (r.raceKitClaimed) eventStats[eid].claimed++;
            eventStats[eid].revenue += r.totalPrice || 0;
        });

        // Group stats by event+category
        const categoryStats: Record<string, { count: number; revenue: number; eventId: string; categoryId: string }> = {};
        paid.forEach(r => {
            const key = `${r.eventId}:${r.categoryId}`;
            if (!categoryStats[key]) {
                categoryStats[key] = { count: 0, revenue: 0, eventId: r.eventId, categoryId: r.categoryId };
            }
            categoryStats[key].count++;
            categoryStats[key].revenue += r.totalPrice || 0;
        });

        // Most recent 10 registrations — bounded query on by_organizer index
        const recent = await ctx.db
            .query("registrations")
            .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
            .order("desc")
            .take(10);

        return {
            totalRegistrations: paid.length,
            totalRevenue,
            claimedKits,
            claimPercentage: paid.length > 0 ? Math.round((claimedKits / paid.length) * 100) : 0,
            eventStats,
            categoryStats,
            recentRegistrations: recent,
        };
    },
});
