// Run with: npx ts-node --compilerOptions '{"module":"CommonJS"}' scripts/create-debug-reg.ts
// Creates a pending registration for testing webhook flow

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { loadEnvConfig } from '@next/env';
import * as path from 'path';

// Load env vars from .env.local
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

async function createPendingRegistration() {
    try {
        const regRef = await db.collection("registrations").add({
            eventId: "debug-event-123",
            userId: "debug-user-456",
            categoryId: "test-category",
            participantInfo: {
                name: "Debug Runner",
                email: "debug@example.com",
                phone: "09171234567",
                tShirtSize: "M",
                singletSize: "M",
                emergencyContact: {
                    name: "Emergency Contact",
                    phone: "09170000000",
                    relationship: "Friend"
                }
            },
            basePrice: 1000,
            vanityPremium: 0,
            totalPrice: 1000,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log("Created pending registration:", regRef.id);
    } catch (e) {
        console.error("Error creating registration:", e);
    }
}

createPendingRegistration();
