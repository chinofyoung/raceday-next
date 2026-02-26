import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export interface PlatformStats {
    totalUsers: number;
    totalEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
    pendingApplications: number;
    usersByRole: {
        runner: number;
        organizer: number;
        admin: number;
    };
}

export async function getPlatformStats(): Promise<PlatformStats> {
    try {
        return await fetchQuery(api.stats.getPlatformStats);
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        throw error;
    }
}
