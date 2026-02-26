import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
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
        return await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", args.uid))
            .unique();
    },
});
