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
    addDoc,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { OrganizerApplication } from "@/types/user";
import { OrganizerFormValues } from "@/lib/validations/organizer";

export interface GetApplicationsOptions {
    status?: "all" | "pending" | "approved" | "rejected" | "needs_info";
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
}

export async function getOrganizerApplications(options: GetApplicationsOptions = {}) {
    const { status = "pending", limitCount = 20, lastDoc } = options;

    try {
        let q = query(collection(db, "organizerApplications"));

        if (status !== "all") {
            q = query(q, where("status", "==", status));
        }

        q = query(q, orderBy("createdAt", "desc"));

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        q = query(q, limit(limitCount));

        const snap = await getDocs(q);
        return {
            items: snap.docs.map(d => ({ id: d.id, ...d.data() })) as OrganizerApplication[],
            lastDoc: snap.docs[snap.docs.length - 1]
        };
    } catch (error) {
        console.error("Error fetching applications:", error);
        throw error;
    }
}

export async function submitOrganizerApplication(
    userId: string,
    data: OrganizerFormValues
): Promise<string> {
    // 1. Create the application document
    const docRef = await addDoc(collection(db, "organizerApplications"), {
        userId,
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // 2. Update user profile with organizer info
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
        "organizer.name": data.organizerName,
        "organizer.contactEmail": data.contactEmail,
        "organizer.phone": data.phone,
        "organizer.organizerType": data.organizerType,
        "organizer.appliedAt": serverTimestamp(),
        "organizer.approved": false,
    });

    return docRef.id;
}

export async function checkExistingApplication(userId: string): Promise<OrganizerApplication | null> {
    const q = query(
        collection(db, "organizerApplications"),
        where("userId", "==", userId),
        where("status", "in", ["pending", "needs_info", "approved"]),
        limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as OrganizerApplication;
}

export async function reviewApplication(
    id: string,
    status: "approved" | "rejected" | "needs_info",
    options: { reason?: string; adminNotes?: string } = {}
) {
    const data: any = {
        status,
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    if (options.reason) data.rejectionReason = options.reason;
    if (options.adminNotes) data.adminNotes = options.adminNotes;

    return updateDoc(doc(db, "organizerApplications", id), data);
}
