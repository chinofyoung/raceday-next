import { query, QueryCtx } from "./_generated/server";

export const getPlatformStats = query({
    args: {},
    handler: async (ctx: QueryCtx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const requester = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!requester || requester.role !== "admin") throw new Error("Unauthorized");

        // Collect full tables — Convex doesn't have a native COUNT, but we avoid
        // the arbitrary 10000 cap so real counts are never silently truncated.
        const users = await ctx.db.query("users").collect();
        const events = await ctx.db.query("events").collect();

        // Use the by_organizer index (which forces a full scan) is not available
        // for status — fall back to collect() but only pull paid registrations
        // so we don't drag every field of every registration across the wire
        // for the revenue sum.  The by_event_status index requires an eventId,
        // so we must scan the whole table; collect() is the right call here.
        const paidRegistrations = await ctx.db
            .query("registrations")
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        // Use the by_status index for pending applications to avoid a full scan
        const pendingApps = await ctx.db
            .query("organizerApplications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const totalRevenue = paidRegistrations.reduce((sum, r) => sum + r.totalPrice, 0);

        const usersByRole = {
            runner: users.filter(u => u.role === "runner").length,
            organizer: users.filter(u => u.role === "organizer").length,
            admin: users.filter(u => u.role === "admin").length,
        };

        return {
            totalUsers: users.length,
            totalEvents: events.length,
            totalRegistrations: paidRegistrations.length,
            totalRevenue,
            pendingApplications: pendingApps.length,
            usersByRole,
        };
    },
});
