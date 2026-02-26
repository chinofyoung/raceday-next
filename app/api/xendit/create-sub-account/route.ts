import { NextResponse } from "next/server";
import { xenditFetch } from "@/lib/xendit";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { OrganizerApplication } from "@/types/user";

export async function POST(req: Request) {
    try {
        const { applicationId } = await req.json();

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
        }

        // 1. Fetch the application
        const appRef = doc(db, "organizerApplications", applicationId);
        const appSnap = await getDoc(appRef);

        if (!appSnap.exists()) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const appData = appSnap.data() as OrganizerApplication;

        // 2. Create Xendit Managed Account
        // Reference: https://developers.xendit.co/api-reference/v2/accounts/#create-account
        const xenditAccount = await xenditFetch("/v2/accounts", {
            method: "POST",
            body: JSON.stringify({
                email: appData.contactEmail,
                type: "MANAGED",
                public_profile: {
                    business_name: appData.organizerName,
                },
            }),
        });

        const xenditAccountId = xenditAccount.id;

        // 3. Update application and user with Xendit Account ID
        await updateDoc(appRef, {
            xenditAccountId,
            xenditKycStatus: "pending",
        });

        const userRef = doc(db, "users", appData.userId);
        await updateDoc(userRef, {
            "organizer.xenditAccountId": xenditAccountId,
        });

        return NextResponse.json({
            success: true,
            xenditAccountId,
        });

    } catch (error: any) {
        console.error("Xendit Sub-account Creation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
