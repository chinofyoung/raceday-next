// Run with: npx ts-node --compilerOptions '{"module":"CommonJS"}' scripts/seed-bib-counters.ts
// Seeds bibCounter documents from existing paid registrations

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadEnvConfig } from '@next/env';
import * as path from 'path';

// Load env vars from .env.local
loadEnvConfig(path.resolve(__dirname, '..'));

// Verify env vars exist
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

async function seedBibCounters() {
    const regsSnap = await db.collection("registrations")
        .where("status", "==", "paid")
        .get();

    const counters = new Map<string, number>();

    regsSnap.docs.forEach(d => {
        const { eventId, categoryId } = d.data();
        if (eventId && categoryId) {
            const key = `${eventId}_${categoryId}`;
            counters.set(key, (counters.get(key) || 0) + 1);
        }
    });

    let count = 0;
    for (const [key, value] of Array.from(counters.entries())) {
        await db.collection("bibCounters").doc(key).set({ count: value });
        console.log(`Set ${key} → ${value}`);
        count++;
    }

    console.log(`Seeded ${count} counter documents.`);
}

seedBibCounters().catch(console.error);
