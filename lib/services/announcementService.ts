import { adminDb } from "@/lib/firebase/admin";
import { Announcement, CreateAnnouncementInput } from "@/types/announcement";
import { FieldValue } from "firebase-admin/firestore";

export async function getAnnouncementsByEventId(eventId: string): Promise<Announcement[]> {
    const eventDoc = await adminDb.collection("events").doc(eventId).get();
    const eventName = eventDoc.data()?.name || "Event";

    const snap = await adminDb
        .collection("events")
        .doc(eventId)
        .collection("announcements")
        .orderBy("createdAt", "desc")
        .get();

    return snap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            eventId: data.eventId,
            eventName,
            organizerId: data.organizerId,
            title: data.title,
            message: data.message,
            imageUrl: data.imageUrl,
            sendEmail: data.sendEmail,
            sentCount: data.sentCount,
            createdBy: data.createdBy,
            // Handle Firestore timestamps
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        };
    }) as Announcement[];
}

export async function createAnnouncement(data: CreateAnnouncementInput & { sentCount?: number }): Promise<Announcement> {
    const ref = adminDb.collection("events").doc(data.eventId).collection("announcements").doc();

    const announcementData = {
        ...data,
        createdAt: FieldValue.serverTimestamp(),
    };

    await ref.set(announcementData);

    return {
        id: ref.id,
        ...data,
        createdAt: new Date().toISOString() as any, // Return a standard Date/String for immediate UI use
    } as Announcement;
}

export async function updateAnnouncement(eventId: string, announcementId: string, data: Partial<Announcement>): Promise<void> {
    const ref = adminDb.collection("events").doc(eventId).collection("announcements").doc(announcementId);
    await ref.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteAnnouncement(eventId: string, announcementId: string): Promise<void> {
    const ref = adminDb.collection("events").doc(eventId).collection("announcements").doc(announcementId);
    await ref.delete();
}

export async function getParticipantAnnouncements(userId: string, email?: string): Promise<Announcement[]> {
    // 1. Fetch user's direct registered events
    const directRegistrationsSnap = await adminDb
        .collection("registrations")
        .where("userId", "==", userId)
        // Optionally filter by status: .where("status", "in", ["paid", "pending"])
        .get();

    // 2. Fetch user's proxy registered events (where current user registered others)
    const proxyRegistrationsSnap = await adminDb
        .collection("registrations")
        .where("registeredByUserId", "==", userId)
        .where("isProxy", "==", true)
        .get();

    // 3. Fetch registrations by email (where current user is the participant)
    let emailRegistrationsDocs: any[] = [];
    if (email) {
        const emailSnap = await adminDb
            .collection("registrations")
            .where("participantInfo.email", "==", email)
            .get();
        emailRegistrationsDocs = emailSnap.docs;
    }

    const allRegistrations = [
        ...directRegistrationsSnap.docs,
        ...proxyRegistrationsSnap.docs,
        ...emailRegistrationsDocs
    ];

    const eventIds = [...new Set(allRegistrations.map(d => d.data().eventId).filter(Boolean))];

    if (eventIds.length === 0) {
        return [];
    }

    // 2. We have a limitation: we can't do an 'in' array query across subcollections easily without a collection group index.
    // However, if we just do a collection group query for "announcements" where eventId "in" eventIds,
    // that requires a composite index.
    // For simplicity, we can fetch announcements for each event individually or in parallel.

    // Batch event IDs if necessary (though in practice a user usually has < 30 active events)
    // Firestore 'in' limitation is 30, but we're doing concurrent separate queries anyway to avoid requiring a collectionGroup index.
    const allAnnouncements: Announcement[] = [];

    await Promise.all(
        eventIds.map(async (eventId) => {
            const announcements = await getAnnouncementsByEventId(eventId);
            allAnnouncements.push(...announcements);
        })
    );

    // Sort by createdAt descending
    allAnnouncements.sort((a, b) => {
        const dateA = new Date(a.createdAt as any).getTime();
        const dateB = new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });

    return allAnnouncements;
}
