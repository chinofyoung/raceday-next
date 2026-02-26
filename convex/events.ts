import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
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
            q = q.withIndex("by_status", (q) => q.eq("status", args.status!));
        } else if (args.organizerId) {
            q = q.withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId!));
        }

        // Note: Complex filtering/sorting might require more indexes or manual logic if not supported directly.
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
        }),
        featuredImage: v.string(),
        status: v.union(v.literal("draft"), v.literal("published")),
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
            featured: false,
            galleryImages: [],
            vanityRaceNumber: {
                enabled: false,
                premiumPrice: 0,
                maxDigits: 4,
            },
            registrationEndDate: args.date, // Default
            timeline: [],
            categories: [],
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

export const migrateEvent = mutation({
    args: {
        legacyId: v.string(), // Firebase doc ID
        name: v.string(),
        description: v.string(),
        date: v.number(),
        location: v.object({
            name: v.string(),
            address: v.string(),
        }),
        featuredImage: v.string(),
        status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed")),
        organizerUid: v.string(), // Firebase UID of creator
        adminSecret: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const isMigration = args.adminSecret === process.env.CONVEX_ADMIN_SECRET;
        if (!isMigration) throw new Error("Unauthorized");

        // Try to find the organizer in Convex by their Firebase UID
        const organizer = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", args.organizerUid))
            .unique();

        let organizerId;
        let organizerName;

        if (organizer) {
            organizerId = organizer._id;
            organizerName = organizer.displayName;
        } else {
            // Fallback: If organizer doesn't exist yet, we can't easily link.
            // For migration, we might want a "System" organizer or skip.
            // Let's look for an admin user as fallback or just use a placeholder.
            const firstAdmin = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "admin")).first();
            if (firstAdmin) {
                organizerId = firstAdmin._id;
                organizerName = firstAdmin.displayName;
            } else {
                throw new Error(`Organizer with UID ${args.organizerUid} not found and no admin fallback available.`);
            }
        }

        const existing = await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("name"), args.name)) // Simple duplicate check by name for now
            .first();

        if (existing) {
            return existing._id;
        }

        return await ctx.db.insert("events", {
            name: args.name,
            description: args.description,
            date: args.date,
            location: args.location,
            featuredImage: args.featuredImage,
            status: args.status,
            organizerId,
            organizerName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            featured: false,
            galleryImages: [],
            vanityRaceNumber: {
                enabled: false,
                premiumPrice: 0,
                maxDigits: 4,
            },
            registrationEndDate: args.date,
            timeline: [],
            categories: [],
        });
    },
});
