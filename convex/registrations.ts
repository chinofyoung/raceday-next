import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
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
        return await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
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

export const create = mutation({
    args: {
        eventId: v.id("events"),
        categoryId: v.string(),
        totalPrice: v.number(),
        registrationData: v.any(),
        isProxy: v.optional(v.boolean()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        return await ctx.db.insert("registrations", {
            ...args,
            userId: user._id,
            organizerId: event.organizerId,
            status: "pending",
            raceKitClaimed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});
