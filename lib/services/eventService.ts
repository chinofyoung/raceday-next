import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { RaceEvent, EventStatus } from "@/types/event";

export interface GetEventsOptions {
    status?: EventStatus | "all";
    organizerId?: string;
    limitCount?: number;
    cursor?: string | null;
}

export async function getEvents(options: GetEventsOptions = {}) {
    const {
        status = "published",
        organizerId,
        limitCount = 20,
        cursor = null,
    } = options;

    try {
        const result = await fetchQuery(api.events.list, {
            status,
            organizerId: organizerId as Id<"users"> | undefined,
            paginationOpts: {
                numItems: limitCount,
                cursor,
            },
        });

        return {
            items: result.page.map(e => ({ ...e, id: e._id })) as RaceEvent[],
            lastDoc: result.continueCursor || null,
        };
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
}

function isValidConvexId(id: string): boolean {
    return typeof id === "string" && id.length > 20;
}

export async function getEventById(id: string): Promise<RaceEvent | null> {
    if (!isValidConvexId(id)) return null;
    try {
        const event = await fetchQuery(api.events.getById, { id: id as Id<"events"> });
        if (!event) return null;
        return { ...event, id: event._id } as RaceEvent;
    } catch (error) {
        console.error("Error fetching event by id:", error);
        return null;
    }
}

export async function updateEventStatus(id: string, status: EventStatus) {
    return fetchMutation(api.events.updateStatus, {
        id: id as Id<"events">,
        status: status as "draft" | "published" | "cancelled" | "completed",
    });
}

export async function updateEvent(id: string, updates: Partial<RaceEvent>) {
    return fetchMutation(api.events.update, {
        id: id as Id<"events">,
        ...updates as any,
    });
}

export async function deleteEvent(id: string) {
    return fetchMutation(api.events.remove, { id: id as Id<"events"> });
}
