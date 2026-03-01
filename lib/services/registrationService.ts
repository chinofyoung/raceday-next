import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { Registration } from "@/types/registration";

export interface GetRegistrationsOptions {
    userId?: string;
    eventId?: string;
    organizerId?: string;
    status?: string | "all";
    limitCount?: number;
    cursor?: string | null;
}

export async function getRegistrations(options: GetRegistrationsOptions = {}) {
    const { userId, eventId, organizerId, status = "all", limitCount = 20, cursor = null } = options;

    try {
        const result = await fetchQuery(api.registrations.list, {
            userId: userId as Id<"users"> | undefined,
            eventId: eventId as Id<"events"> | undefined,
            organizerId: organizerId as Id<"users"> | undefined,
            status,
            paginationOpts: {
                numItems: limitCount,
                cursor,
            },
        });

        return {
            items: result.page.map((d: any) => ({
                ...d,
                id: d._id,
                ...((d as any).registrationData || {})
            })) as unknown as Registration[],
            lastDoc: result.continueCursor || null
        };
    } catch (error) {
        console.error("Error fetching registrations:", error);
        throw error;
    }
}

export async function getRegistrationsWithEvents(options: GetRegistrationsOptions = {}) {
    const { items: registrations, lastDoc } = await getRegistrations(options);

    if (registrations.length === 0) return { items: [], lastDoc };

    // In Convex, we can't easily do a batch "in" query for multiple tables
    // without a custom query. For now, let's fetch events one by one or improve later.
    // Actually, we should probably add a getByIds query to convex/events.ts

    const enrichedRegistrations = await Promise.all(registrations.map(async (reg) => {
        const event = await fetchQuery(api.events.getById, { id: reg.eventId as Id<"events"> });
        return {
            ...reg,
            event: event ? { ...event, id: event._id } : null
        };
    }));

    return { items: enrichedRegistrations, lastDoc };
}

export async function getUserRegistrations(userId: string) {
    try {
        const registrations = await fetchQuery(api.registrations.getByUserId, {
            userId: userId as Id<"users">
        });
        return registrations.map(d => ({
            ...d,
            id: d._id,
            ...((d as any).registrationData || {})
        })) as unknown as Registration[];
    } catch (error) {
        console.error("Error fetching user registrations:", error);
        return [];
    }
}

export async function getCategoryCounts(eventId: string) {
    try {
        return await fetchQuery(api.registrations.getCategoryCounts, {
            eventId: eventId as Id<"events">
        });
    } catch (error) {
        console.error("Error fetching category counts:", error);
        return {};
    }
}

export async function getOrganizerStats(organizerId: string) {
    try {
        return await fetchQuery(api.registrations.getStats, {
            organizerId: organizerId as Id<"users">
        });
    } catch (error) {
        console.error("Error fetching organizer stats:", error);
        return { totalRevenue: 0, totalRegistrations: 0, claimedKits: 0 };
    }
}
