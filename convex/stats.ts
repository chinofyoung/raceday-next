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
            ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "runner")).collect(),
            ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "organizer")).collect(),
            ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).collect(),
        ]);

        // Count events by status using the by_status index
        const [publishedEvents, draftEvents, cancelledEvents, completedEvents] = await Promise.all([
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "published")).collect(),
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "draft")).collect(),
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "cancelled")).collect(),
            ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "completed")).collect(),
        ]);

        // Paid registrations — still requires table scan since no status-only index exists,
        // but users and events tables are now indexed
        const paidRegistrations = await ctx.db
            .query("registrations")
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        const pendingApps = await ctx.db
            .query("organizerApplications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

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
