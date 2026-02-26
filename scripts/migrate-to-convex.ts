/**
 * Migration Script: Firebase Firestore -> Convex
 * 
 * This script is intended to be run locally to sync existing data.
 * It uses Firebase Admin SDK and Convex Node Client.
 * 
 * Usage: 
 * 1. Set environment variables for Firebase and Convex.
 * 2. Run with: npx tsx scripts/migrate-to-convex.ts
 */

import admin from "firebase-admin";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs";
import path from "path";

// Manually load .env.local if needed (since tsx/node doesn't do it by default for standalone scripts)
// Manually load .env.local if needed
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    console.log("Loading .env.local...");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    let currentKey = "";
    let currentValue = "";
    let inQuotedValue = false;
    let quoteChar = "";

    for (let line of lines) {
        line = line.trim();
        if (!inQuotedValue) {
            if (!line || line.startsWith("#")) continue;
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();

                if ((value.startsWith("'") && !value.endsWith("'")) || (value.startsWith('"') && !value.endsWith('"'))) {
                    inQuotedValue = true;
                    quoteChar = value[0];
                    currentKey = key;
                    currentValue = value.substring(1) + "\n";
                } else {
                    // Handle values wrapped in quotes on a single line
                    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                        value = value.substring(1, value.length - 1);
                    }
                    if (!process.env[key]) process.env[key] = value;
                }
            }
        } else {
            if (line.endsWith(quoteChar)) {
                currentValue += line.substring(0, line.length - 1);
                if (!process.env[currentKey]) process.env[currentKey] = currentValue;
                inQuotedValue = false;
            } else {
                currentValue += line + "\n";
            }
        }
    }
}

// Initialize Firebase
if (!admin.apps.length) {
    let serviceAccount: any;

    console.log("Initializing Firebase Admin...");
    if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== "{}") {
        try {
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
            serviceAccount = JSON.parse(raw);
            console.log("- Loaded credential from FIREBASE_SERVICE_ACCOUNT");
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON, trying individual fields...");
        }
    }

    if (!serviceAccount && process.env.FIREBASE_PROJECT_ID) {
        console.log("- Using individual FIREBASE_* environment variables");
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        // Debug key format (without leaking sensitive parts)
        if (privateKey) {
            console.log(`- Private key length: ${privateKey.length}`);
            console.log(`- Private key starts with: ${privateKey.substring(0, 30)}...`);
            console.log(`- Private key ends with: ...${privateKey.substring(privateKey.length - 30)}`);
        } else {
            console.error("- FIREBASE_PRIVATE_KEY is missing!");
        }

        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        };
    }

    if (!serviceAccount || !serviceAccount.projectId) {
        console.error("Missing or invalid Firebase credentials.");
        process.exit(1);
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin initialized successfully.");
    } catch (e) {
        console.error("Firebase initialization failed:", e);
        process.exit(1);
    }
}

const db = admin.firestore();

// Note: Convex URL should be from env
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
if (!convexUrl) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable.");
    process.exit(1);
}
const client = new ConvexClient(convexUrl);

async function migrateUsers() {
    console.log("Migrating users...");
    const usersSnapshot = await db.collection("users").get();
    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        try {
            await client.mutation(api.users.syncUser, {
                uid: data.uid || data.id,
                email: data.email,
                displayName: data.displayName || "Unknown User",
                photoURL: data.photoURL,
                adminSecret: process.env.CONVEX_ADMIN_SECRET,
            });
            console.log(`- Migrated user: ${data.displayName}`);
        } catch (e) {
            console.error(`- Failed to migrate user ${data.email}:`, e);
        }
    }
}

async function migrateEvents() {
    console.log("Migrating events...");
    const eventsSnapshot = await db.collection("events").get();
    for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        try {
            const eventId = await client.mutation(api.events.migrateEvent, {
                legacyId: doc.id,
                name: data.name || "Untitled Event",
                description: data.description || "",
                date: data.date?.toMillis?.() || data.date || Date.now(),
                location: {
                    name: data.location?.name || "Unknown",
                    address: data.location?.formattedAddress || data.location?.address || "",
                },
                featuredImage: data.imageUrl || data.featuredImage || "",
                status: (data.status === "active" || data.status === "published") ? "published" : "draft",
                organizerUid: data.organizerId || data.createdBy || "",
                adminSecret: process.env.CONVEX_ADMIN_SECRET,
            });
            console.log(`- Migrated event: ${data.name} (ID: ${eventId})`);
        } catch (e) {
            console.error(`- Failed to migrate event ${data.name}:`, e);
        }
    }
}

async function run() {
    try {
        await migrateUsers();
        await migrateEvents();
        console.log("\nMigration script finished processing.");
        console.log("Next steps: Verify data in Convex Dashboard.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

run();
