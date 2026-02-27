import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const start = mutation({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
        categoryId: v.optional(v.string()),
        displayName: v.string(),
        lat: v.number(),
        lng: v.number(),
        bearing: v.optional(v.number()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const existing = await ctx.db
            .query("tracking")
            .withIndex("by_user_event", (q) => q.eq("userId", args.userId).eq("eventId", args.eventId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                lastUpdatedAt: Date.now(),
                isActive: true,
            });
            return existing._id;
        } else {
            return await ctx.db.insert("tracking", {
                ...args,
                lastUpdatedAt: Date.now(),
                isActive: true,
            });
        }
    },
});

export const update = mutation({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
        lat: v.number(),
        lng: v.number(),
        bearing: v.optional(v.number()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const existing = await ctx.db
            .query("tracking")
            .withIndex("by_user_event", (q) => q.eq("userId", args.userId).eq("eventId", args.eventId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                lat: args.lat,
                lng: args.lng,
                bearing: args.bearing ?? existing.bearing,
                lastUpdatedAt: Date.now(),
            });
        }
    },
});

export const stop = mutation({
    args: {
        userId: v.id("users"),
        eventId: v.id("events"),
    },
    handler: async (ctx: MutationCtx, args) => {
        const existing = await ctx.db
            .query("tracking")
            .withIndex("by_user_event", (q) => q.eq("userId", args.userId).eq("eventId", args.eventId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                isActive: false,
                lastUpdatedAt: Date.now(),
            });
        }
    },
});

export const listByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("tracking")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});
