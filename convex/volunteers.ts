/**
 * Volunteer management queries and mutations.
 */
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const listByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
    },
});

export const getByEmail = query({
    args: { eventId: v.id("events"), email: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
            .filter((q) => q.eq(q.field("eventId"), args.eventId))
            .first();
    },
});

export const getById = query({
    args: { id: v.id("volunteers") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const invite = mutation({
    args: {
        eventId: v.id("events"),
        email: v.string(),
        permissions: v.array(v.string()),
        invitedBy: v.string(),
    },
    handler: async (ctx: MutationCtx, args) => {
        return await ctx.db.insert("volunteers", {
            ...args,
            email: args.email.toLowerCase().trim(),
            status: "pending",
            invitedAt: Date.now(),
        });
    },
});

export const accept = mutation({
    args: {
        id: v.id("volunteers"),
        userId: v.id("users"),
    },
    handler: async (ctx: MutationCtx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) throw new Error("Invitation not found");

        await ctx.db.patch(args.id, {
            userId: args.userId,
            displayName: user.displayName,
            photoURL: user.photoURL,
            status: "accepted",
            acceptedAt: Date.now(),
        });

        // Add to user's volunteerEvents
        const volunteerEvents = user.volunteerEvents || [];
        if (!volunteerEvents.includes(volunteer.eventId)) {
            await ctx.db.patch(args.userId, {
                volunteerEvents: [...volunteerEvents, volunteer.eventId],
            });
        }
    },
});

export const revoke = mutation({
    args: { id: v.id("volunteers") },
    handler: async (ctx: MutationCtx, args) => {
        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) return;

        await ctx.db.patch(args.id, {
            status: "revoked",
            revokedAt: Date.now(),
        });

        if (volunteer.userId) {
            const user = await ctx.db.get(volunteer.userId);
            if (user && user.volunteerEvents) {
                await ctx.db.patch(volunteer.userId, {
                    volunteerEvents: user.volunteerEvents.filter(id => id !== volunteer.eventId),
                });
            }
        }
    },
});

export const restore = mutation({
    args: { id: v.id("volunteers") },
    handler: async (ctx: MutationCtx, args) => {
        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) return;

        await ctx.db.patch(args.id, {
            status: volunteer.userId ? "accepted" : "pending",
            revokedAt: undefined,
        });

        if (volunteer.userId) {
            const user = await ctx.db.get(volunteer.userId);
            if (user) {
                const volunteerEvents = user.volunteerEvents || [];
                if (!volunteerEvents.includes(volunteer.eventId)) {
                    await ctx.db.patch(volunteer.userId, {
                        volunteerEvents: [...volunteerEvents, volunteer.eventId],
                    });
                }
            }
        }
    },
});

export const remove = mutation({
    args: { id: v.id("volunteers") },
    handler: async (ctx: MutationCtx, args) => {
        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) return;

        if (volunteer.userId) {
            const user = await ctx.db.get(volunteer.userId);
            if (user && user.volunteerEvents) {
                await ctx.db.patch(volunteer.userId, {
                    volunteerEvents: user.volunteerEvents.filter(id => id !== volunteer.eventId),
                });
            }
        }

        await ctx.db.delete(args.id);
    },
});

export const getPendingByEmail = query({
    args: { email: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
});

export const listByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();
    },
});

export const getByUserIdAndEvent = query({
    args: { userId: v.id("users"), eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("eventId"), args.eventId))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .unique();
    },
});

export const getMyVolunteerEvents = query({
    args: { email: v.string(), userId: v.optional(v.id("users")) },
    handler: async (ctx: QueryCtx, args) => {
        // 1. Get pending invitations by email
        const pending = await ctx.db
            .query("volunteers")
            .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        // 2. Get accepted assignments by userId
        let accepted: any[] = [];
        if (args.userId) {
            accepted = await ctx.db
                .query("volunteers")
                .withIndex("by_user", (q) => q.eq("userId", args.userId!))
                .filter((q) => q.eq(q.field("status"), "accepted"))
                .collect();
        }

        const allVolunteering = [...pending, ...accepted];

        // 3. Resolve event details for each
        const results = await Promise.all(
            allVolunteering.map(async (v) => {
                const event = await ctx.db.get(v.eventId);
                if (!event) return null;
                const e = event as any;
                return {
                    id: e._id,
                    name: e.name,
                    date: e.date,
                    featuredImage: e.featuredImage,
                    location: e.location,
                    permissions: v.permissions,
                    volunteerId: v._id,
                    status: v.status as "accepted" | "pending",
                };
            })
        );

        return results.filter((r) => r !== null);
    },
});

export const getInviteDetails = query({
    args: { id: v.id("volunteers"), eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const volunteer = await ctx.db.get(args.id);
        if (!volunteer || volunteer.eventId !== args.eventId) {
            return null;
        }

        const event = await ctx.db.get(args.eventId);
        if (!event) return null;

        return {
            ...volunteer,
            eventName: event.name,
            organizerName: event.organizerName,
            featuredImage: event.featuredImage,
        };
    },
});
