// Run with: node scripts/list-pending.js
// Lists pending registrations for debugging

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { loadEnvConfig } = require('@next/env');
const path = require('path');

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
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    })
    : getApps()[0];

const db = getFirestore(adminApp);

async function listPendingRegistrations() {
    try {
        const snapshot = await db.collection('registrations')
            .where('status', '==', 'pending')
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log('No pending registrations found.');
            return;
        }

        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
        });
    } catch (error) {
        console.error('Error listing registrations:', error);
    }
}

listPendingRegistrations();
