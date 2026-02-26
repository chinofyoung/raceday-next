/**
 * Helper script to artificially approve KYC for an organizer in development.
 * 
 * Usage: npx tsx scripts/approve-kyc-local.ts <USER_ID> [XENDIT_ACCOUNT_ID]
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function approveKYC(uid: string, manualXenditId?: string) {
    if (!uid) {
        console.error("❌ Please provide a User ID.");
        console.log("Usage: npx tsx scripts/approve-kyc-local.ts <USER_ID> [XENDIT_ACCOUNT_ID]");
        process.exit(1);
    }

    console.log(`🚀 Starting artificial KYC approval for user: ${uid}`);

    try {
        // 1. Fetch Organizer Application Document to get bank details and Xendit ID
        const appQuery = query(
            collection(db, "organizerApplications"),
            where("userId", "==", uid)
        );
        const appSnap = await getDocs(appQuery);

        let bankDetails = null;
        let xenditAccountId = manualXenditId || null;
        let appId = null;

        if (!appSnap.empty) {
            const appDoc = appSnap.docs[0];
            const appData = appDoc.data();
            appId = appDoc.id;
            bankDetails = appData.bankDetails || null;
            if (!xenditAccountId) {
                xenditAccountId = appData.xenditAccountId || null;
            }
            console.log(`ℹ️ Found application ${appId}. Payout Details:`, bankDetails ? "✅ Found" : "❌ Missing");
        }

        // If no payout details found in application, or no application exists, use dummy data
        if (!bankDetails) {
            console.log("ℹ️ No bank details found. Using DUMMY bank details for testing.");
            bankDetails = {
                bankCode: "BPI",
                accountNumber: "1234567890",
                accountHolderName: "Test Organizer"
            };
        }

        if (!xenditAccountId) {
            console.log("ℹ️ No Xendit Account ID provided. Using DUMMY Xendit ID for testing.");
            xenditAccountId = `acc_dummy_${uid.substring(0, 8)}`;
        }

        console.log(`ℹ️ Using Xendit ID: ${xenditAccountId}`);

        // 2. Update User Document
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            "organizer.kycVerified": true,
            "organizer.xenditStatus": "LIVE",
            "organizer.approved": true,
            "organizer.approvedAt": Timestamp.now(),
            "organizer.bankDetails": bankDetails,
            "organizer.xenditAccountId": xenditAccountId,
            updatedAt: serverTimestamp(),
        });
        console.log("✅ User document updated with KYC, Payout details, and Xendit ID.");

        // 3. Update Organizer Application(s) if they exist
        if (!appSnap.empty) {
            for (const appDoc of appSnap.docs) {
                await updateDoc(doc(db, "organizerApplications", appDoc.id), {
                    status: "approved",
                    xenditKycStatus: "verified",
                    xenditAccountId: xenditAccountId, // Ensure ID is in application too
                    reviewedAt: Timestamp.now(),
                    updatedAt: serverTimestamp(),
                });
                console.log(`✅ Application ${appDoc.id} updated to approved/verified`);
            }
        }

        console.log("\n🎉 KYC & Payout setup artificially approved! Please refresh your dashboard.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error approving KYC:", error);
        process.exit(1);
    }
}

const userId = process.argv[2];
const xenditId = process.argv[3];
approveKYC(userId, xenditId);
