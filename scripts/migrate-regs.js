const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { loadEnvConfig } = require('@next/env');
const path = require('path');

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
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    })
    : getApps()[0];

const db = getFirestore(adminApp);

async function migrate() {
    console.log("--- Starting Migration: Backfill organizerId on registrations ---");

    try {
        const regsSnap = await db.collection("registrations").get();
        const regsToUpdate = regsSnap.docs.filter(doc => !doc.data().organizerId);

        console.log(`Found ${regsToUpdate.length} total registrations missing organizerId.`);

        if (regsToUpdate.length === 0) {
            console.log("No migration needed.");
            return;
        }

        const eventToOrganizer = new Map();
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const regDoc of regsToUpdate) {
            try {
                const regData = regDoc.data();
                const eventId = regData.eventId;

                if (!eventId) {
                    console.warn(`[SKIP] Registration ${regDoc.id} has no eventId.`);
                    skippedCount++;
                    continue;
                }

                let organizerId = eventToOrganizer.get(eventId);

                if (!organizerId) {
                    const eventDoc = await db.collection("events").doc(eventId).get();
                    if (eventDoc.exists) { // FIXED: exists is a property in admin SDK
                        organizerId = eventDoc.data().organizerId;
                        eventToOrganizer.set(eventId, organizerId);
                    } else {
                        console.warn(`[WARN] Event ${eventId} not found for registration ${regDoc.id}`);
                        eventToOrganizer.set(eventId, "NOT_FOUND");
                    }
                }

                if (organizerId && organizerId !== "NOT_FOUND") {
                    await db.collection("registrations").doc(regDoc.id).update({
                        organizerId: organizerId,
                        updatedAt: new Date()
                    });
                    updatedCount++;
                    console.log(`[OK] Updated registration ${regDoc.id} with organizerId ${organizerId}`);
                } else {
                    skippedCount++;
                }
            } catch (err) {
                console.error(`[ERROR] Failed to update registration ${regDoc.id}:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n--- Migration Summary ---`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount} (Event not found or no eventId)`);
        console.log(`Errors:  ${errorCount}`);
    } catch (globalErr) {
        console.error("Global migration error:", globalErr);
    }
}

migrate().catch(console.error);
