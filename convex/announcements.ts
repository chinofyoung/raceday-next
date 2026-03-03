import { mutation, query, internalAction, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const listByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const announcements = await ctx.db
            .query("announcements")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .order("desc")
            .collect();

        return announcements.map(a => ({
            ...a,
            id: a._id
        }));
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
        const announcementId = await ctx.db.insert("announcements", {
            ...args,
            sentCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Get all registered users for this event
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        const userIds = registrations.map(r => r.userId);

        // We'll schedule an internal action to handle the push logic
        // We pass the announcement details and userIds
        await ctx.scheduler.runAfter(0, internal.announcements.sendAnnouncementPushes, {
            announcementId,
            userIds,
            title: args.title,
            body: args.message,
        });

        return announcementId;
    },
});

export const sendAnnouncementPushes = internalAction({
    args: {
        announcementId: v.id("announcements"),
        userIds: v.array(v.id("users")),
        title: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        // Fetch users in chunks to get tokens
        const tokens: string[] = [];
        for (const userId of args.userIds) {
            const user = await ctx.runQuery(internal.users.getInternal, { id: userId });
            if (user?.expoPushToken) {
                tokens.push(user.expoPushToken);
            }
        }

        if (tokens.length > 0) {
            await ctx.runAction(internal.notifications.sendPush, {
                tokens,
                title: args.title,
                body: args.body,
                data: { announcementId: args.announcementId },
            });

            // Update sent count
            await ctx.runMutation(internal.announcements.updateSentCount, {
                id: args.announcementId,
                count: tokens.length,
            });
        }
    },
});

export const updateSentCount = internalMutation({
    args: { id: v.id("announcements"), count: v.number() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { sentCount: args.count });
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
