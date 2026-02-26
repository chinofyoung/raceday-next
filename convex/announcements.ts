import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const listByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("announcements")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        eventId: v.id("events"),
        organizerId: v.id("users"),
        title: v.string(),
        message: v.string(),
        imageUrl: v.optional(v.string()),
        sendEmail: v.boolean(),
        createdBy: v.string(),
    },
    handler: async (ctx: MutationCtx, args) => {
        return await ctx.db.insert("announcements", {
            ...args,
            sentCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("announcements"),
        data: v.any(),
    },
    handler: async (ctx: MutationCtx, args) => {
        await ctx.db.patch(args.id, {
            ...args.data,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("announcements") },
    handler: async (ctx: MutationCtx, args) => {
        await ctx.db.delete(args.id);
    },
});
