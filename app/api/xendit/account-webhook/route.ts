import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";

const XENDIT_CALLBACK_TOKEN = process.env.XENDIT_CALLBACK_TOKEN;

export async function POST(req: Request) {
    try {
        const callbackToken = req.headers.get("x-callback-token");

        if (callbackToken !== XENDIT_CALLBACK_TOKEN) {
            return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
        }

        const body = await req.json();
        const { event, data } = body;

        console.log(`Received Xendit account webhook [${event}]:`, JSON.stringify(data, null, 2));

        // We are interested in account status changes
        if (event === "account.status_changed" || event === "account.updated") {
            const xenditAccountId = data.id;
            const newStatus = data.status; // LIVE, INVITED, etc.

            // Xendit accounts v2 status can be LIVE, INVITED, etc.
            // KYC status is often specific to the profile
            const isLive = newStatus === "LIVE";

            // 1. Update the Organizer Application
            const appQuery = query(
                collection(db, "organizerApplications"),
                where("xenditAccountId", "==", xenditAccountId)
            );
            const appSnap = await getDocs(appQuery);

            if (!appSnap.empty) {
                const appDoc = appSnap.docs[0];
                await updateDoc(doc(db, "organizerApplications", appDoc.id), {
                    xenditKycStatus: isLive ? "verified" : "pending",
                    updatedAt: serverTimestamp(),
                });

                // 2. Update the User profile
                const userId = appDoc.data().userId;
                if (userId) {
                    const userRef = doc(db, "users", userId);
                    await updateDoc(userRef, {
                        "organizer.kycVerified": isLive,
                        "organizer.xenditStatus": newStatus,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Xendit Account Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
