import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { VolunteerPermission } from "@/types/volunteer";

/**
 * Server-side check if a user is an active volunteer for a specific event.
 * Uses React.cache to deduplicate calls within a single request.
 */
export const getVolunteerRecord = cache(async (uid: string, eventId: string) => {
    const snap = await adminDb
        .collection("events")
        .doc(eventId)
        .collection("volunteers")
        .where("uid", "==", uid)
        .where("status", "==", "accepted")
        .limit(1)
        .get();

    if (snap.empty) return null;
    return snap.docs[0].data();
});

export const isEventVolunteer = async (uid: string, eventId: string) => {
    const record = await getVolunteerRecord(uid, eventId);
    return !!record;
};

export const hasVolunteerPermission = async (
    uid: string,
    eventId: string,
    permission: VolunteerPermission
) => {
    const record = await getVolunteerRecord(uid, eventId);
    if (!record) return false;

    const permissions = record.permissions as VolunteerPermission[];
    return permissions.includes(permission);
};

export const getVolunteerPermissions = async (uid: string, eventId: string) => {
    const record = await getVolunteerRecord(uid, eventId);
    if (!record) return [];
    return record.permissions as VolunteerPermission[];
};
