import { cache } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { VolunteerPermission } from "@/types/volunteer";

/**
 * Server-side check if a user is an active volunteer for a specific event.
 * Uses React.cache to deduplicate calls within a single request.
 */
export const getVolunteerRecord = cache(async (userId: string, eventId: string) => {
    return await fetchQuery(api.volunteers.getByUserIdAndEvent, {
        userId: userId as Id<"users">,
        eventId: eventId as Id<"events">,
    });
});

export const isEventVolunteer = async (userId: string, eventId: string) => {
    const record = await getVolunteerRecord(userId, eventId);
    return !!record;
};

export const hasVolunteerPermission = async (
    userId: string,
    eventId: string,
    permission: VolunteerPermission
) => {
    const record = await getVolunteerRecord(userId, eventId);
    if (!record) return false;

    const permissions = record.permissions as VolunteerPermission[];
    return permissions.includes(permission);
};

export const getVolunteerPermissions = async (userId: string, eventId: string) => {
    const record = await getVolunteerRecord(userId, eventId);
    if (!record) return [];
    return record.permissions as VolunteerPermission[];
};
