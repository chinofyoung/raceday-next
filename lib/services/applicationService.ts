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
    Timestamp
} from "firebase/firestore";
import { OrganizerApplication } from "@/types/user";

export interface GetApplicationsOptions {
    status?: "all" | "pending" | "approved" | "rejected";
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

export async function reviewApplication(id: string, status: "approved" | "rejected", reason?: string) {
    const data: any = {
        status,
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    if (reason) data.rejectionReason = reason;

    return updateDoc(doc(db, "organizerApplications", id), data);
}
