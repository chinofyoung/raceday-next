import { rtdb } from "@/lib/firebase/config";
import { ref, set, remove, onValue, serverTimestamp } from "firebase/database";

export interface LiveTracker {
    userId: string;
    eventId: string;
    categoryId?: string;
    displayName: string;
    lat: number;
    lng: number;
    bearing?: number;
    lastUpdatedAt: Date;
    isActive: boolean;
}

export const startUserTracking = async (eventId: string, categoryId: string | undefined, userId: string, displayName: string, lat: number, lng: number, bearing?: number) => {
    const trackingRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}`);
    await set(trackingRef, {
        userId,
        eventId,
        categoryId: categoryId || null,
        displayName,
        lat,
        lng,
        bearing: bearing ?? 0,
        lastUpdatedAt: serverTimestamp(),
        isActive: true
    });
};

export const updateUserLocation = async (eventId: string, userId: string, lat: number, lng: number, bearing?: number) => {
    const updates: Record<string, any> = {
        lat,
        lng,
        lastUpdatedAt: serverTimestamp()
    };

    if (bearing !== undefined) {
        updates.bearing = bearing;
    }

    const participantRef = ref(rtdb, `live_tracking/${eventId}/participants/${userId}`);

    // Instead of set on individual paths, we can just use set on the properties we want to preserve
    // Or just set on individual paths as before but let's be more efficient
    const promises = [
        set(ref(rtdb, `live_tracking/${eventId}/participants/${userId}/lat`), lat),
        set(ref(rtdb, `live_tracking/${eventId}/participants/${userId}/lng`), lng),
        set(ref(rtdb, `live_tracking/${eventId}/participants/${userId}/lastUpdatedAt`), serverTimestamp()),
    ];

    if (bearing !== undefined) {
        promises.push(set(ref(rtdb, `live_tracking/${eventId}/participants/${userId}/bearing`), bearing));
    }

    await Promise.all(promises);
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
                        bearing: data.bearing || 0,
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
