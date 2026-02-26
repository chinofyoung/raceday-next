import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const getPlatformStats = query({
    args: {},
    handler: async (ctx: QueryCtx) => {
        const users = await ctx.db.query("users").collect();
        const events = await ctx.db.query("events").collect();
        const registrations = await ctx.db
            .query("registrations")
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        // Organizer applications might be in a separate table or just role
        // Let's assume there's a table for applications if it exists in schema
        // Checking schema... it has 'organizerApplications'
        const pendingApps = await ctx.db
            .query("organizerApplications")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

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
