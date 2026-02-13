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
    updateDoc
} from "firebase/firestore";
import { User, UserRole } from "@/types/user";

export interface GetUsersOptions {
    role?: UserRole | "all";
    searchTerm?: string;
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
}

export async function getUsers(options: GetUsersOptions = {}) {
    const { role = "all", searchTerm, limitCount = 25, lastDoc } = options;

    try {
        let q = query(collection(db, "users"));

        if (role !== "all") {
            q = query(q, where("role", "==", role));
        }

        q = query(q, orderBy("createdAt", "desc"));

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        // Note: SearchTerm handled client-side for now as Firestore doesn't support full-text search easily
        // but we limit read to avoid downloading the whole DB.
        q = query(q, limit(limitCount));

        const snap = await getDocs(q);
        return {
            items: snap.docs.map(d => ({ ...d.data() })) as User[],
            lastDoc: snap.docs[snap.docs.length - 1]
        };
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

export async function updateUserRole(uid: string, role: UserRole) {
    return updateDoc(doc(db, "users", uid), { role, updatedAt: new Date() });
}
