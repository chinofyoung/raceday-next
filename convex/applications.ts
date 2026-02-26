import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
    args: {
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx: QueryCtx, args) => {
        let q: any = ctx.db.query("organizerApplications");

        if (args.status && args.status !== "all") {
            q = q.withIndex("by_status", (q: any) => q.eq("status", args.status as any));
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});

export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("organizerApplications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.or(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("status"), "approved")
            ))
            .first();
    },
});

export const submit = mutation({
    args: {
        userId: v.id("users"),
        data: v.any(),
    },
    handler: async (ctx: MutationCtx, args) => {
        // 1. Create application
        const appId = await ctx.db.insert("organizerApplications", {
            userId: args.userId,
            status: "pending",
            data: args.data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 2. Update user profile
        await ctx.db.patch(args.userId, {
            organizer: {
                name: args.data.organizerName,
                contactEmail: args.data.contactEmail,
                phone: args.data.phone,
                organizerType: args.data.organizerType,
                approved: false,
                appliedAt: Date.now(),
            },
            updatedAt: Date.now(),
        });

        return appId;
    },
});

export const update = mutation({
    args: {
        id: v.id("organizerApplications"),
        userId: v.id("users"),
        data: v.any(),
    },
    handler: async (ctx: MutationCtx, args) => {
        await ctx.db.patch(args.id, {
            data: args.data,
            status: "pending",
            updatedAt: Date.now(),
        });

        await ctx.db.patch(args.userId, {
            organizer: {
                name: args.data.organizerName,
                contactEmail: args.data.contactEmail,
                phone: args.data.phone,
                organizerType: args.data.organizerType,
                approved: false,
                appliedAt: Date.now(),
            },
            updatedAt: Date.now(),
        });
    },
});

export const review = mutation({
    args: {
        id: v.id("organizerApplications"),
        status: v.union(v.literal("approved"), v.literal("rejected")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const app = await ctx.db.get(args.id);
        if (!app) throw new Error("Application not found");

        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now(),
        });

        if (args.status === "approved") {
            const user = await ctx.db.get(app.userId);
            if (user && user.organizer) {
                await ctx.db.patch(app.userId, {
                    role: "organizer",
                    organizer: {
                        ...user.organizer,
                        approved: true,
                        approvedAt: Date.now(),
                    },
                    updatedAt: Date.now(),
                });
            }
        }
    },
});
