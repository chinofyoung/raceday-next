import { mutation, query, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
    args: {
        status: v.optional(v.string()),
        organizerId: v.optional(v.id("users")),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx: QueryCtx, args) => {
        let q = ctx.db.query("events");

        if (args.status && args.status !== "all") {
            const status = args.status as "draft" | "published" | "cancelled" | "completed";
            return await q.withIndex("by_status", (q) => q.eq("status", status))
                .order("desc")
                .paginate(args.paginationOpts);
        } else if (args.organizerId) {
            return await q.withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});

export const getById = query({
    args: { id: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("events"),
        status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const event = await ctx.db.get(args.id);
        if (!event) throw new Error("Event not found");

        // Simple auth check: only organizer or admin can update
        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user || (user._id !== event.organizerId && user.role !== "admin")) {
            throw new Error("Forbidden");
        }

        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now(),
        });
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        date: v.number(),
        location: v.object({
            name: v.string(),
            address: v.string(),
            coordinates: v.optional(v.object({
                lat: v.number(),
                lng: v.number(),
            })),
        }),
        featuredImage: v.string(),
        galleryImages: v.array(v.string()),
        vanityRaceNumber: v.object({
            enabled: v.boolean(),
            premiumPrice: v.number(),
            maxDigits: v.number(),
        }),
        earlyBird: v.optional(v.object({
            enabled: v.boolean(),
            startDate: v.number(),
            endDate: v.number(),
        })),
        registrationEndDate: v.number(),
        timeline: v.array(v.object({
            id: v.string(),
            activity: v.string(),
            description: v.optional(v.string()),
            time: v.string(),
            order: v.number(),
        })),
        categories: v.array(v.object({
            id: v.string(),
            name: v.string(),
            distance: v.number(),
            distanceUnit: v.union(v.literal("km"), v.literal("mi")),
            assemblyTime: v.string(),
            gunStartTime: v.string(),
            cutOffTime: v.string(),
            price: v.number(),
            earlyBirdPrice: v.optional(v.number()),
            categoryImage: v.optional(v.string()),
            routeMap: v.optional(v.object({
                gpxFileUrl: v.string(),
            })),
            stations: v.optional(v.array(v.object({
                id: v.string(),
                type: v.union(v.literal("water"), v.literal("aid"), v.literal("first_aid")),
                label: v.string(),
                coordinates: v.object({
                    lat: v.number(),
                    lng: v.number(),
                }),
            }))),
            inclusions: v.array(v.string()),
            raceNumberFormat: v.string(),
            maxParticipants: v.optional(v.number()),
            showMaxParticipants: v.boolean(),
            showRegisteredCount: v.boolean(),
            registeredCount: v.number(),
            bibAssignment: v.optional(v.object({
                enabled: v.boolean(),
                rangeStart: v.number(),
                rangeEnd: v.number(),
                currentSequential: v.number(),
            })),
        })),
        status: v.union(v.literal("draft"), v.literal("published")),
        featured: v.boolean(),
    },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user || (user.role !== "organizer" && user.role !== "admin")) {
            throw new Error("Unauthorized role");
        }

        return await ctx.db.insert("events", {
            ...args,
            organizerId: user._id,
            organizerName: user.displayName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("events"),
        // Allow patching any field
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        date: v.optional(v.number()),
        location: v.optional(v.object({
            name: v.string(),
            address: v.string(),
            coordinates: v.optional(v.object({
                lat: v.number(),
                lng: v.number(),
            })),
        })),
        featuredImage: v.optional(v.string()),
        galleryImages: v.optional(v.array(v.string())),
        vanityRaceNumber: v.optional(v.object({
            enabled: v.boolean(),
            premiumPrice: v.number(),
            maxDigits: v.number(),
        })),
        earlyBird: v.optional(v.object({
            enabled: v.boolean(),
            startDate: v.number(),
            endDate: v.number(),
        })),
        registrationEndDate: v.optional(v.number()),
        timeline: v.optional(v.array(v.object({
            id: v.string(),
            activity: v.string(),
            description: v.optional(v.string()),
            time: v.string(),
            order: v.number(),
        }))),
        categories: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            distance: v.number(),
            distanceUnit: v.union(v.literal("km"), v.literal("mi")),
            assemblyTime: v.string(),
            gunStartTime: v.string(),
            cutOffTime: v.string(),
            price: v.number(),
            earlyBirdPrice: v.optional(v.number()),
            categoryImage: v.optional(v.string()),
            routeMap: v.optional(v.object({
                gpxFileUrl: v.string(),
            })),
            stations: v.optional(v.array(v.object({
                id: v.string(),
                type: v.union(v.literal("water"), v.literal("aid"), v.literal("first_aid")),
                label: v.string(),
                coordinates: v.object({
                    lat: v.number(),
                    lng: v.number(),
                }),
            }))),
            inclusions: v.array(v.string()),
            raceNumberFormat: v.string(),
            maxParticipants: v.optional(v.number()),
            showMaxParticipants: v.boolean(),
            showRegisteredCount: v.boolean(),
            registeredCount: v.number(),
            bibAssignment: v.optional(v.object({
                enabled: v.boolean(),
                rangeStart: v.number(),
                rangeEnd: v.number(),
                currentSequential: v.number(),
            })),
        }))),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed"))),
        featured: v.optional(v.boolean()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const { id, ...updates } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const event = await ctx.db.get(id);
        if (!event) throw new Error("Event not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user || (user._id !== event.organizerId && user.role !== "admin")) {
            throw new Error("Forbidden");
        }

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("events") },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const event = await ctx.db.get(args.id);
        if (!event) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user || (user._id !== event.organizerId && user.role !== "admin")) {
            throw new Error("Forbidden");
        }

        await ctx.db.delete(args.id);
    },
});


export const checkAccess = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { hasAccess: false, permissions: [] };

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) return { hasAccess: false, permissions: [] };
        if (user.role === "admin") return { hasAccess: true, role: "admin", permissions: ["all"] };

        const event = await ctx.db.get(args.eventId);
        if (!event) return { hasAccess: false, permissions: [] };

        if (event.organizerId === user._id) return { hasAccess: true, role: "organizer", permissions: ["all"] };

        // Check volunteers
        const volunteer = await ctx.db
            .query("volunteers")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.and(
                q.eq(q.field("userId"), user._id),
                q.eq(q.field("status"), "accepted")
            ))
            .first();

        if (volunteer) {
            return {
                hasAccess: true,
                role: "volunteer",
                permissions: volunteer.permissions
            };
        }

        return { hasAccess: false, permissions: [] };
    },
});
export const getByIds = query({
    args: { ids: v.array(v.id("events")) },
    handler: async (ctx: QueryCtx, args) => {
        const events = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
        return events.filter(Boolean);
    },
});

export const getByIdInternal = internalQuery({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const clone = mutation({
    args: { id: v.id("events") },
    handler: async (ctx: MutationCtx, args) => {
        const event = await ctx.db.get(args.id);
        if (!event) throw new Error("Event not found");

        const { _id, _creationTime, ...data } = event;
        return await ctx.db.insert("events", {
            ...data,
            name: `${data.name} (Copy)`,
            status: "draft",
            date: 0,
            registrationEndDate: 0,
            earlyBird: data.earlyBird ? {
                ...data.earlyBird,
                startDate: 0,
                endDate: 0
            } : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            categories: (data.categories || []).map((cat: any) => ({
                ...cat,
                registeredCount: 0,
                id: Math.random().toString(36).substring(2, 9),
                bibAssignment: cat.bibAssignment ? {
                    ...cat.bibAssignment,
                    currentSequential: cat.bibAssignment.rangeStart
                } : undefined
            }))
        });
    },
});
