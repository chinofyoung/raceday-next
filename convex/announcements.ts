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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

        const announcementId = await ctx.db.insert("announcements", {
            ...args,
            sentCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Get all paid registrations using the composite index (avoids post-index filtering)
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event_status", (q) =>
                q.eq("eventId", args.eventId).eq("status", "paid")
            )
            .take(10000);

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
        // Single batch query instead of N individual queries
        const users = await ctx.runQuery(internal.users.getInternalBatch, { ids: args.userIds });
        const tokens: string[] = (users as any[])
            .filter(u => u?.expoPushToken)
            .map(u => u!.expoPushToken as string);

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
        title: v.optional(v.string()),
        message: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const announcement = await ctx.db.get(args.id);
        if (!announcement) throw new Error("Announcement not found");

        if (user._id !== announcement.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

        const { id, ...updates } = args;
        const patch: Record<string, any> = { updatedAt: Date.now() };
        if (updates.title !== undefined) patch.title = updates.title;
        if (updates.message !== undefined) patch.message = updates.message;
        if (updates.imageUrl !== undefined) patch.imageUrl = updates.imageUrl;

        await ctx.db.patch(args.id, patch);
    },
});

export const remove = mutation({
    args: { id: v.id("announcements") },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const announcement = await ctx.db.get(args.id);
        if (!announcement) throw new Error("Announcement not found");

        if (user._id !== announcement.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

        await ctx.db.delete(args.id);
    },
});
