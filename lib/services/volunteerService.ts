import { adminDb } from "@/lib/firebase/admin";
import { EventVolunteer, VolunteerPermission, VolunteerStatus } from "@/types/volunteer";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function inviteVolunteer(
    eventId: string,
    email: string,
    permissions: VolunteerPermission[],
    invitedBy: string
): Promise<EventVolunteer> {
    const normalizedEmail = email.toLowerCase().trim();
    const ref = adminDb.collection("events").doc(eventId).collection("volunteers").doc();

    const volunteerData = {
        eventId,
        email: normalizedEmail,
        permissions,
        status: 'pending' as VolunteerStatus,
        invitedBy,
        invitedAt: FieldValue.serverTimestamp(),
    };

    await ref.set(volunteerData);

    return {
        id: ref.id,
        ...volunteerData,
        invitedAt: Timestamp.now(),
    } as unknown as EventVolunteer;
}

export async function getEventVolunteers(eventId: string): Promise<EventVolunteer[]> {
    const snap = await adminDb
        .collection("events")
        .doc(eventId)
        .collection("volunteers")
        .orderBy("invitedAt", "desc")
        .get();

    return snap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            invitedAt: data.invitedAt,
            acceptedAt: data.acceptedAt,
            revokedAt: data.revokedAt,
        };
    }) as EventVolunteer[];
}

export async function getVolunteerByEmail(eventId: string, email: string): Promise<EventVolunteer | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const snap = await adminDb
        .collection("events")
        .doc(eventId)
        .collection("volunteers")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
    } as EventVolunteer;
}

export async function acceptInvitation(
    eventId: string,
    volunteerId: string,
    uid: string,
    displayName?: string,
    photoURL?: string
): Promise<void> {
    const batch = adminDb.batch();

    // 1. Update volunteer doc
    const volunteerRef = adminDb.collection("events").doc(eventId).collection("volunteers").doc(volunteerId);
    batch.update(volunteerRef, {
        uid,
        displayName,
        photoURL,
        status: 'accepted' as VolunteerStatus,
        acceptedAt: FieldValue.serverTimestamp(),
    });

    // 2. Update user doc to track volunteer events
    const userRef = adminDb.collection("users").doc(uid);
    batch.update(userRef, {
        volunteerEvents: FieldValue.arrayUnion(eventId),
    });

    await batch.commit();
}

export async function revokeVolunteer(eventId: string, volunteerId: string): Promise<void> {
    const volunteerRef = adminDb.collection("events").doc(eventId).collection("volunteers").doc(volunteerId);
    const volunteerDoc = await volunteerRef.get();

    if (!volunteerDoc.exists) return;
    const data = volunteerDoc.data() as EventVolunteer;

    const batch = adminDb.batch();

    // Update status
    batch.update(volunteerRef, {
        status: 'revoked' as VolunteerStatus,
        revokedAt: FieldValue.serverTimestamp(),
    });

    // If already accepted, remove event from user's volunteerEvents
    if (data.uid) {
        const userRef = adminDb.collection("users").doc(data.uid);
        batch.update(userRef, {
            volunteerEvents: FieldValue.arrayRemove(eventId),
        });
    }

    await batch.commit();
}

export async function restoreVolunteer(eventId: string, volunteerId: string): Promise<void> {
    const volunteerRef = adminDb.collection("events").doc(eventId).collection("volunteers").doc(volunteerId);
    const volunteerDoc = await volunteerRef.get();

    if (!volunteerDoc.exists) return;
    const data = volunteerDoc.data() as EventVolunteer;

    if (data.status !== 'revoked') return;

    const batch = adminDb.batch();

    // Revert status to 'accepted' if uid exists, else 'pending'
    const newStatus: VolunteerStatus = data.uid ? 'accepted' : 'pending';

    batch.update(volunteerRef, {
        status: newStatus,
        revokedAt: FieldValue.delete(),
    });

    // If accepted previously and has a uid, restore event to user's volunteerEvents
    if (data.uid && newStatus === 'accepted') {
        const userRef = adminDb.collection("users").doc(data.uid);
        batch.update(userRef, {
            volunteerEvents: FieldValue.arrayUnion(eventId),
        });
    }

    await batch.commit();
}

export async function deleteVolunteer(eventId: string, volunteerId: string): Promise<void> {
    const volunteerRef = adminDb.collection("events").doc(eventId).collection("volunteers").doc(volunteerId);
    const volunteerDoc = await volunteerRef.get();

    if (!volunteerDoc.exists) return;
    const data = volunteerDoc.data() as EventVolunteer;

    const batch = adminDb.batch();

    batch.delete(volunteerRef);

    if (data.uid) {
        const userRef = adminDb.collection("users").doc(data.uid);
        batch.update(userRef, {
            volunteerEvents: FieldValue.arrayRemove(eventId),
        });
    }

    await batch.commit();
}

export async function updatePermissions(
    eventId: string,
    volunteerId: string,
    permissions: VolunteerPermission[]
): Promise<void> {
    const ref = adminDb.collection("events").doc(eventId).collection("volunteers").doc(volunteerId);
    await ref.update({
        permissions,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function getVolunteerEventsByEmail(email: string): Promise<EventVolunteer[]> {
    const normalizedEmail = email.toLowerCase().trim();
    // Using collectionGroup to find all volunteer docs across all events
    const snap = await adminDb
        .collectionGroup("volunteers")
        .where("email", "==", normalizedEmail)
        .where("status", "==", "pending")
        .get();

    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as EventVolunteer[];
}

export async function getVolunteerEventsByUid(uid: string): Promise<EventVolunteer[]> {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const volunteerEvents = userDoc.data()?.volunteerEvents as string[] || [];

    if (volunteerEvents.length === 0) return [];

    // Fetch the volunteer record for this user in each event
    const results = await Promise.all(
        volunteerEvents.map(async (eventId) => {
            const snap = await adminDb
                .collection("events")
                .doc(eventId)
                .collection("volunteers")
                .where("uid", "==", uid)
                .limit(1)
                .get();

            if (snap.empty) return null;
            const data = snap.docs[0].data();
            if (data.status !== "accepted") return null;

            return {
                id: snap.docs[0].id,
                ...data,
            } as EventVolunteer;
        })
    );

    return results.filter((v): v is EventVolunteer => v !== null);
}
