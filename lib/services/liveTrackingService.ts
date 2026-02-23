import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, where, Timestamp } from "firebase/firestore";

export interface LiveTracker {
    userId: string;
    eventId: string;
    categoryId?: string;
    displayName: string;
    lat: number;
    lng: number;
    lastUpdatedAt: Date;
    isActive: boolean;
}

export const startUserTracking = async (eventId: string, categoryId: string | undefined, userId: string, displayName: string, lat: number, lng: number) => {
    const docRef = doc(db, "live_tracking", eventId, "participants", userId);
    await setDoc(docRef, {
        userId,
        eventId,
        categoryId: categoryId || null,
        displayName,
        lat,
        lng,
        lastUpdatedAt: serverTimestamp(),
        isActive: true
    });
};

export const updateUserLocation = async (eventId: string, userId: string, lat: number, lng: number) => {
    const docRef = doc(db, "live_tracking", eventId, "participants", userId);
    await updateDoc(docRef, {
        lat,
        lng,
        lastUpdatedAt: serverTimestamp(),
        isActive: true
    });
};

export const stopUserTracking = async (eventId: string, userId: string) => {
    const docRef = doc(db, "live_tracking", eventId, "participants", userId);
    // Alternatively, update isActive to false, but delete keeps it clean
    await deleteDoc(docRef);
};

export const subscribeToEventLocations = (eventId: string, onUpdate: (trackers: LiveTracker[]) => void) => {
    const participantsRef = collection(db, "live_tracking", eventId, "participants");
    const q = query(participantsRef, where("isActive", "==", true));

    return onSnapshot(q, (snapshot) => {
        const trackers: LiveTracker[] = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            trackers.push({
                userId: data.userId,
                eventId: data.eventId,
                categoryId: data.categoryId,
                displayName: data.displayName || "Anonymous Runner",
                lat: data.lat,
                lng: data.lng,
                lastUpdatedAt: data.lastUpdatedAt instanceof Timestamp ? data.lastUpdatedAt.toDate() : new Date(),
                isActive: data.isActive
            });
        });
        onUpdate(trackers);
    });
};
