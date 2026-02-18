import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

async function createPendingRegistration() {
    try {
        const regRef = await addDoc(collection(db, "registrations"), {
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log("Created pending registration:", regRef.id);
    } catch (e) {
        console.error("Error creating registration:", e);
    }
}

createPendingRegistration();
