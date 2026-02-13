import { db } from "@/lib/firebase/config";
import {
    collection,
    query,
    where,
    getCountFromServer,
    getDocs,
    doc,
    getDoc
} from "firebase/firestore";

export interface PlatformStats {
    totalUsers: number;
    totalEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
    pendingApplications: number;
    usersByRole: {
        runner: number;
        organizer: number;
        admin: number;
    };
}

/**
 * Optimized stats fetching using getCountFromServer (1 read per count)
 * vs getDocs (N reads per collection)
 */
export async function getPlatformStats(): Promise<PlatformStats> {
    try {
        // Run counts in parallel for performance
        const [
            usersCount,
            eventsCount,
            regsCount,
            appsCount,
            runnersCount,
            organizersCount,
            adminsCount
        ] = await Promise.all([
            getCountFromServer(collection(db, "users")),
            getCountFromServer(collection(db, "events")),
            getCountFromServer(query(collection(db, "registrations"), where("status", "==", "paid"))),
            getCountFromServer(query(collection(db, "organizerApplications"), where("status", "==", "pending"))),
            getCountFromServer(query(collection(db, "users"), where("role", "==", "runner"))),
            getCountFromServer(query(collection(db, "users"), where("role", "==", "organizer"))),
            getCountFromServer(query(collection(db, "users"), where("role", "==", "admin")))
        ]);

        // Revenue still requires a query for now until we have a meta document
        // But we can optimize it by only fetching the totalPrice field if supported
        // Or using a separate aggregation document as planned in 1.2
        const regsSnap = await getDocs(query(collection(db, "registrations"), where("status", "==", "paid")));
        const totalRevenue = regsSnap.docs.reduce((sum, doc) => sum + (doc.data().totalPrice || 0), 0);

        return {
            totalUsers: usersCount.data().count,
            totalEvents: eventsCount.data().count,
            totalRegistrations: regsCount.data().count,
            totalRevenue,
            pendingApplications: appsCount.data().count,
            usersByRole: {
                runner: runnersCount.data().count,
                organizer: organizersCount.data().count,
                admin: adminsCount.data().count
            }
        };
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        throw error;
    }
}
