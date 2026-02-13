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
    deleteDoc
} from "firebase/firestore";
import { RaceEvent, EventStatus } from "@/types/event";

export interface GetEventsOptions {
    status?: EventStatus | "all";
    organizerId?: string;
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
    orderByField?: string;
    orderDirection?: "asc" | "desc";
}

export async function getEvents(options: GetEventsOptions = {}) {
    const {
        status = "published",
        organizerId,
        limitCount = 20,
        lastDoc,
        orderByField = "createdAt",
        orderDirection = "desc"
    } = options;

    try {
        let q = query(collection(db, "events"));

        if (status !== "all") {
            q = query(q, where("status", "==", status));
        }

        if (organizerId) {
            q = query(q, where("organizerId", "==", organizerId));
        }

        q = query(q, orderBy(orderByField, orderDirection));

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        q = query(q, limit(limitCount));

        const snap = await getDocs(q);
        return {
            items: snap.docs.map(d => ({ id: d.id, ...d.data() })) as RaceEvent[],
            lastDoc: snap.docs[snap.docs.length - 1]
        };
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
}

export async function getEventById(id: string): Promise<RaceEvent | null> {
    try {
        const snap = await getDoc(doc(db, "events", id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as RaceEvent;
    } catch (error) {
        console.error("Error fetching event by id:", error);
        throw error;
    }
}

export async function updateEventStatus(id: string, status: EventStatus) {
    return updateDoc(doc(db, "events", id), { status, updatedAt: new Date() });
}

export async function deleteEvent(id: string) {
    return deleteDoc(doc(db, "events", id));
}
