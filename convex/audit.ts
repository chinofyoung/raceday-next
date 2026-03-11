import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLogs = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        return await ctx.db
            .query("auditLogs")
            .order("desc")
            .take(args.limit ?? 50);
    },
});

export const log = mutation({
    args: {
        adminId: v.string(),
        adminName: v.string(),
        action: v.string(),
        targetId: v.string(),
        targetName: v.string(),
        details: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("auditLogs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});
