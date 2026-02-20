import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadEnvConfig } from '@next/env';
import * as path from 'path';

loadEnvConfig(path.resolve(__dirname, '..'));

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error("Missing FIREBASE Admin credentials in .env.local");
    process.exit(1);
}

const adminApp = getApps().length === 0
    ? initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    })
    : getApps()[0];

const db = getFirestore(adminApp);

async function diagnose() {
    console.log("--- Diagnostics ---");

    // 1. Check registrations count
    const regsSnap = await db.collection("registrations").get();
    console.log(`Total registrations: ${regsSnap.size}`);

    // 2. Sample a few registrations to see fields
    if (regsSnap.size > 0) {
        console.log("\nSample Registration (first one):");
        const first = regsSnap.docs[0].data();
        console.log(JSON.stringify({
            id: regsSnap.docs[0].id,
            eventId: first.eventId,
            organizerId: first.organizerId,
            status: first.status,
            totalPrice: first.totalPrice
        }, null, 2));
    }

    // 3. Count by organizerId
    const organizerIds: Record<string, number> = {};
    const statuses: Record<string, number> = {};

    regsSnap.docs.forEach(doc => {
        const data = doc.data();
        const orgId = data.organizerId || "MISSING";
        organizerIds[orgId] = (organizerIds[orgId] || 0) + 1;

        const status = data.status || "MISSING";
        statuses[status] = (statuses[status] || 0) + 1;
    });

    console.log("\nRegistrations by Organizer ID:");
    console.table(organizerIds);

    console.log("\nRegistrations by Status:");
    console.table(statuses);

    // 4. Check events for one organizer if found
    const firstOrgIdWithRegs = Object.keys(organizerIds).find(k => k !== "MISSING");
    if (firstOrgIdWithRegs) {
        const eventsSnap = await db.collection("events").where("organizerId", "==", firstOrgIdWithRegs).get();
        console.log(`\nEvents for organizer ${firstOrgIdWithRegs}: ${eventsSnap.size}`);
    }
}

diagnose().catch(console.error);
