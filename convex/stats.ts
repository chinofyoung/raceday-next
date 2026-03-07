import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const getPlatformStats = query({
    args: {},
    handler: async (ctx: QueryCtx) => {
        const users = await ctx.db.query("users").take(10000);
        const events = await ctx.db.query("events").take(10000);
        const registrations = await ctx.db
            .query("registrations")
            .filter((q) => q.eq(q.field("status"), "paid"))
            .take(10000);

        const pendingApps = await ctx.db
            .query("organizerApplications")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .take(10000);

        const totalRevenue = registrations.reduce((sum, r) => sum + r.totalPrice, 0);

        const usersByRole = {
            runner: users.filter(u => u.role === "runner").length,
            organizer: users.filter(u => u.role === "organizer").length,
            admin: users.filter(u => u.role === "admin").length,
        };

        return {
            totalUsers: users.length,
            totalEvents: events.length,
            totalRegistrations: registrations.length,
            totalRevenue,
            pendingApplications: pendingApps.length,
            usersByRole,
        };
    },
});
