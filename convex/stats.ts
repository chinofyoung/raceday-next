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

        // Count users by role using the by_role index (avoids full table scan)
        const [runners, organizers, admins] = await Promise.all([
            ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "runner")).take(50000),
            ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "organizer")).take(50000),
            ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).take(50000),
        ]);

        // Count events by status using the by_status index
        const [publishedEvents, draftEvents, cancelledEvents, completedEvents] = await Promise.all([
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "published")).take(50000),
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "draft")).take(50000),
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "cancelled")).take(50000),
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "completed")).take(50000),
        ]);

        // Paid registrations — uses the by_status index to avoid a full table scan
        const paidRegistrations = await ctx.db
            .query("registrations")
            .withIndex("by_status", (q) => q.eq("status", "paid"))
            .take(50000);

        const pendingApps = await ctx.db
            .query("organizerApplications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .take(10000);

        const totalRevenue = paidRegistrations.reduce((sum, r) => sum + r.totalPrice, 0);

        return {
            totalUsers: runners.length + organizers.length + admins.length,
            totalEvents: publishedEvents.length + draftEvents.length + cancelledEvents.length + completedEvents.length,
            totalRegistrations: paidRegistrations.length,
            totalRevenue,
            pendingApplications: pendingApps.length,
            usersByRole: {
                runner: runners.length,
                organizer: organizers.length,
                admin: admins.length,
            },
        };
    },
});
