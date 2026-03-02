import { mutation, query, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getCount = query({
    args: { eventId: v.id("events"), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const status = args.status || "paid";
        const registrations = await ctx.db
            .query("registrations")
            .filter((q) => q.and(
                q.eq(q.field("eventId"), args.eventId),
                q.eq(q.field("status"), status)
            ))
            .collect();
        return registrations.length;
    },
});

export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        const results = [];
        for (const reg of registrations) {
            const event = await ctx.db.get(reg.eventId);
            results.push({
                ...reg,
                event: event ? {
                    ...event,
                    id: event._id
                } : null
            });
        }
        return results;
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
        let q: any = ctx.db.query("registrations");

        if (args.userId) {
            q = q.withIndex("by_user", (q: any) => q.eq("userId", args.userId));
        } else if (args.eventId) {
            q = q.withIndex("by_event", (q: any) => q.eq("eventId", args.eventId));
        }

        if (args.organizerId) {
            q = q.filter((q: any) => q.eq(q.field("organizerId"), args.organizerId));
        }

        if (args.status && args.status !== "all") {
            q = q.filter((q: any) => q.eq(q.field("status"), args.status));
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});

export const getStats = query({
    args: { organizerId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .filter((q) => q.and(
                q.eq(q.field("organizerId"), args.organizerId),
                q.eq(q.field("status"), "paid")
            ))
            .collect();

        const totalRevenue = registrations.reduce((sum, r) => sum + r.totalPrice, 0);
        const claimedKits = registrations.filter(r => r.raceKitClaimed).length;

        return {
            totalRevenue,
            totalRegistrations: registrations.length,
            claimedKits
        };
    },
});

export const getCategoryCounts = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter(q => q.or(q.eq(q.field("status"), "paid"), q.eq(q.field("status"), "pending")))
            .collect();

        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            counts[r.categoryId] = (counts[r.categoryId] || 0) + 1;
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
        const existing = await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.and(
                q.eq(q.field("eventId"), args.eventId),
                q.eq(q.field("categoryId"), args.categoryId),
                q.or(
                    q.eq(q.field("status"), "paid"),
                    q.eq(q.field("status"), "pending")
                ),
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

export const updatePaymentInfo = mutation({
    args: {
        id: v.id("registrations"),
        xenditInvoiceId: v.string(),
        xenditInvoiceUrl: v.string(),
    },
    handler: async (ctx: MutationCtx, args) => {
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

        await ctx.db.patch(args.id, {
            status: "paid",
            paymentStatus: args.paymentStatus,
            raceNumber: args.raceNumber,
            qrCodeUrl: args.qrCodeUrl,
            paidAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Increment event category count
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
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        const total = registrations.length;
        const claimed = registrations.filter(r => r.raceKitClaimed).length;

        return { total, claimed };
    },
});

export const markAsClaimed = mutation({
    args: { id: v.id("registrations") },
    handler: async (ctx: MutationCtx, args) => {
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
        const term = args.query.trim().toLowerCase();
        if (!term) return [];

        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        return registrations.filter((r) =>
            (r.registrationData?.participantInfo?.name?.toLowerCase().includes(term)) ||
            (r.raceNumber?.toLowerCase().includes(term))
        );
    },
});

export const getById = query({
    args: { id: v.id("registrations") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getEmailsForEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.or(q.eq(q.field("status"), "paid"), q.eq(q.field("status"), "pending")))
            .collect();

        const emails = registrations
            .map(r => (r as any).registrationData?.participantInfo?.email)
            .filter(Boolean);

        return [...new Set(emails)];
    },
});

export const getEmailsForEventInternal = internalQuery({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.or(q.eq(q.field("status"), "paid"), q.eq(q.field("status"), "pending")))
            .collect();

        const emails = registrations
            .map(r => (r as any).registrationData?.participantInfo?.email)
            .filter(Boolean);

        return [...new Set(emails)] as string[];
    },
});
