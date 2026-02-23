import { rtdb } from "@/lib/firebase/config";
import { ref, set, remove, onValue, serverTimestamp } from "firebase/database";

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
    const trackingRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}`);
    await set(trackingRef, {
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
    // In RTDB, update properties using set on specific paths or updating the whole object
    // For simplicity, we can update the specific fields or fetch/update
    // The easiest way to update a few fields in place is `update` or simply overwriting the specific node properties
    // Actually, RTDB has an `update` method, but let's just use `set` on the child paths to be safe, or import `update`
    // Alternatively, update the exact fields via generic set:
    const latRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}/lat`);
    const lngRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}/lng`);
    const timeRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}/lastUpdatedAt`);

    await Promise.all([
        set(latRef, lat),
        set(lngRef, lng),
        set(timeRef, serverTimestamp()),
    ]);
};

export const stopUserTracking = async (eventId: string, userId: string) => {
    const trackingRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}`);
    await remove(trackingRef);
};

export const subscribeToEventLocations = (eventId: string, onUpdate: (trackers: LiveTracker[]) => void) => {
    const participantsRef = ref(rtdb, `live_tracking/${eventId}/participants`);

    const unsubscribe = onValue(participantsRef, (snapshot) => {
        const trackers: LiveTracker[] = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.isActive) {
                    trackers.push({
                        userId: data.userId,
                        eventId: data.eventId,
                        categoryId: data.categoryId,
                        displayName: data.displayName || "Anonymous Runner",
                        lat: data.lat,
                        lng: data.lng,
                        // RTDB serverTimestamp() resolves to a number (milliseconds since epoch)
                        lastUpdatedAt: new Date(data.lastUpdatedAt),
                        isActive: data.isActive
                    });
                }
            });
        }
        onUpdate(trackers);
    });

    return unsubscribe;
};
