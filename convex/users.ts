import { mutation, query, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const syncUser = mutation({
    args: {
        uid: v.string(),
        email: v.string(),
        displayName: v.string(),
        photoURL: v.optional(v.string()),
        adminSecret: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: { uid: string; email: string; displayName: string; photoURL?: string; adminSecret?: string }) => {
        const identity = await ctx.auth.getUserIdentity();

        const isMigration = args.adminSecret === process.env.CONVEX_ADMIN_SECRET;

        if (!identity && !isMigration) {
            throw new Error("Called syncUser without authentication");
        }

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", args.uid))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                displayName: args.displayName,
                photoURL: args.photoURL,
                updatedAt: Date.now(),
            });
            return existingUser._id;
        } else {
            return await ctx.db.insert("users", {
                uid: args.uid,
                email: args.email,
                displayName: args.displayName,
                photoURL: args.photoURL,
                role: "runner",
                profileCompletion: 15,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                address: {
                    street: "",
                    city: "",
                    province: "",
                    zipCode: "",
                    country: "Philippines",
                },
            });
        }
    },
});

export const list = query({
    args: {
        role: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx: QueryCtx, args: { role?: string; paginationOpts: any }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Check if requester is admin
        const requester = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!requester || requester.role !== "admin") throw new Error("Forbidden");

        let q = ctx.db.query("users");
        if (args.role && args.role !== "all") {
            // Note: might need role index
            q = q.filter(q => q.eq(q.field("role"), args.role));
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});

export const updateRole = mutation({
    args: { id: v.id("users"), role: v.union(v.literal("runner"), v.literal("organizer"), v.literal("admin")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const requester = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!requester || requester.role !== "admin") throw new Error("Forbidden");

        await ctx.db.patch(args.id, { role: args.role, updatedAt: Date.now() });
    },
});

export const updateProfile = mutation({
    args: {
        displayName: v.string(),
        phone: v.optional(v.string()),
        gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal(""))),
        birthDate: v.optional(v.string()),
        medicalConditions: v.optional(v.string()),
        tShirtSize: v.optional(v.union(v.literal("XS"), v.literal("S"), v.literal("M"), v.literal("L"), v.literal("XL"), v.literal("2XL"), v.literal("3XL"), v.literal(""))),
        singletSize: v.optional(v.union(v.literal("XS"), v.literal("S"), v.literal("M"), v.literal("L"), v.literal("XL"), v.literal("2XL"), v.literal("3XL"), v.literal(""))),
        address: v.optional(v.object({
            street: v.string(),
            city: v.string(),
            province: v.string(),
            zipCode: v.string(),
            country: v.string(),
        })),
        emergencyContact: v.optional(v.object({
            name: v.string(),
            phone: v.string(),
            relationship: v.string(),
        })),
        profileCompletion: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

export const updateOrganizerProfile = mutation({
    args: {
        name: v.string(),
        contactEmail: v.string(),
        phone: v.string(),
        organizerType: v.union(v.literal("individual"), v.literal("sports_club"), v.literal("business"), v.literal("lgu"), v.literal("school"), v.literal("nonprofit")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");
        if (!user.organizer) throw new Error("Not an organizer");

        await ctx.db.patch(user._id, {
            organizer: {
                ...user.organizer,
                ...args,
            },
            updatedAt: Date.now(),
        });
    },
});

export const updatePhotoURL = mutation({
    args: { photoURL: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            photoURL: args.photoURL,
            updatedAt: Date.now(),
        });
    },
});

export const current = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
    },
});

export const getByUid = query({
    args: { uid: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", args.uid))
            .unique();
    },
});

export const updatePushToken = mutation({
    args: { expoPushToken: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            expoPushToken: args.expoPushToken,
            updatedAt: Date.now(),
        });
    },
});

export const getInternal = internalQuery({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getInternalBatch = internalQuery({
    args: { ids: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        return await Promise.all(args.ids.map(id => ctx.db.get(id)));
    },
});

export const updateDashboardLayout = mutation({
    args: {
        layout: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");
        if (user.role !== "organizer" && user.role !== "admin") throw new Error("Forbidden");

        const VALID_WIDGET_IDS = ["revenue-stats", "kit-fulfillment", "active-events", "registrations-feed"];
        const isValid =
            args.layout.length === VALID_WIDGET_IDS.length &&
            args.layout.every((id) => VALID_WIDGET_IDS.includes(id));
        if (!isValid) throw new Error("Invalid layout");

        await ctx.db.patch(user._id, {
            dashboardLayout: args.layout,
            updatedAt: Date.now(),
        });
    },
});
