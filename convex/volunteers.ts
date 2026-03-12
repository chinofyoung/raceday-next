/**
 * Volunteer management queries and mutations.
 */
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const listByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        // Only organizer or admin can list all volunteers for an event
        if (user.role !== "admin") {
            const event = await ctx.db.get(args.eventId);
            if (!event || event.organizerId !== user._id) {
                throw new Error("Forbidden");
            }
        }

        return await ctx.db
            .query("volunteers")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
    },
});

export const getByEmail = query({
    args: { eventId: v.id("events"), email: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db
            .query("volunteers")
            .withIndex("by_email_event", (q) =>
                q.eq("email", args.email.toLowerCase()).eq("eventId", args.eventId)
            )
            .first();
    },
});

export const getById = query({
    args: { id: v.id("volunteers") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Verify the accepting user owns this identity
        if (user.uid !== identity.subject) {
            throw new Error("Forbidden: can only accept invitations for yourself");
        }

        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) throw new Error("Invitation not found");

        // Verify the invitation email matches the user's email
        if (volunteer.email !== user.email.toLowerCase()) {
            throw new Error("Forbidden: invitation email does not match your account");
        }

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) return;

        const event = await ctx.db.get(volunteer.eventId);
        if (!event) return;
        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) return;

        const event = await ctx.db.get(volunteer.eventId);
        if (!event) return;
        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const volunteer = await ctx.db.get(args.id);
        if (!volunteer) return;

        const event = await ctx.db.get(volunteer.eventId);
        if (!event) return;
        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db
            .query("volunteers")
            .withIndex("by_event_user", (q) =>
                q.eq("eventId", args.eventId).eq("userId", args.userId)
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .unique();
    },
});

export const getMyVolunteerEvents = query({
    args: { email: v.string(), userId: v.optional(v.id("users")) },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

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

        // 3. Resolve event details for each — deduplicate fetches when multiple volunteer
        //    records point to the same event
        const uniqueEventIds = [...new Set(allVolunteering.map(v => v.eventId))];
        const events = await Promise.all(uniqueEventIds.map(id => ctx.db.get(id)));
        const eventMap = new Map(
            events.filter(Boolean).map(e => [e!._id, e!])
        );

        const results = allVolunteering.map((v) => {
            const event = eventMap.get(v.eventId);
            if (!event) return null;
            return {
                id: event._id,
                name: (event as any).name,
                date: (event as any).date,
                featuredImage: (event as any).featuredImage,
                location: (event as any).location,
                eventStatus: (event as any).status as string,
                permissions: v.permissions,
                volunteerId: v._id,
                status: v.status as "accepted" | "pending",
            };
        });

        return results.filter((r) => r !== null);
    },
});

export const getInviteDetails = query({
    args: { id: v.id("volunteers"), eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

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
