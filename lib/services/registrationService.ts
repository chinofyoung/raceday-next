import { db } from "@/lib/firebase/config";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    orderBy,
    limit,
    startAfter,
    DocumentSnapshot,
    updateDoc,
    documentId
} from "firebase/firestore";
import { Registration } from "@/types/registration";

export interface GetRegistrationsOptions {
    userId?: string;
    eventId?: string;
    status?: string | "all";
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
}

export async function getRegistrations(options: GetRegistrationsOptions = {}) {
    const { userId, eventId, status = "all", limitCount = 20, lastDoc } = options;

    try {
        let q = query(collection(db, "registrations"));

        if (userId) q = query(q, where("userId", "==", userId));
        if (eventId) q = query(q, where("eventId", "==", eventId));
        if (status !== "all") q = query(q, where("status", "==", status));

        q = query(q, orderBy("createdAt", "desc"));
        if (lastDoc) q = query(q, startAfter(lastDoc));
        q = query(q, limit(limitCount));

        const snap = await getDocs(q);
        const registrations = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Registration[];

        return {
            items: registrations,
            lastDoc: snap.docs[snap.docs.length - 1]
        };
    } catch (error) {
        console.error("Error fetching registrations:", error);
        throw error;
    }
}

/**
 * Optimized many-to-one join to avoid N+1 queries.
 * Fetches unique events for a list of registrations in a single batch.
 */
export async function getRegistrationsWithEvents(options: GetRegistrationsOptions = {}) {
    const { items: registrations, lastDoc } = await getRegistrations(options);

    if (registrations.length === 0) return { items: [], lastDoc };

    // Collect unique event IDs
    const eventIds = [...new Set(registrations.map(r => r.eventId))];

    // Fetch all required events in one batch (Firestore supports up to 30 IDs in 'in' query)
    // If more than 30, we'd need to batch the batches.
    const eventsMap = new Map();

    // Firestore "in" limit is 30.
    const batches = [];
    for (let i = 0; i < eventIds.length; i += 30) {
        batches.push(eventIds.slice(i, i + 30));
    }

    await Promise.all(batches.map(async (batch) => {
        const eventsSnap = await getDocs(query(
            collection(db, "events"),
            where(documentId(), "in", batch)
        ));
        eventsSnap.docs.forEach(d => eventsMap.set(d.id, { id: d.id, ...d.data() }));
    }));

    // Attach event data to registrations
    const enrichedRegistrations = registrations.map(reg => ({
        ...reg,
        event: eventsMap.get(reg.eventId) || null
    }));

    return { items: enrichedRegistrations, lastDoc };
}
