import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { registrationData, eventName, categoryName } = body;

        // 1. Create registration doc in Firestore (pending status)
        const regRef = await addDoc(collection(db, "registrations"), {
            ...registrationData,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // 2. Prepare Xendit Invoice Request
        const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");

        const invoiceData = {
            external_id: regRef.id,
            amount: registrationData.totalPrice,
            description: `Registration for ${eventName} - ${categoryName}`,
            invoice_duration: 86400, // 24 hours
            currency: "PHP",
            reminder_time: 1,
            success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${registrationData.eventId}/register/success?id=${regRef.id}`,
            failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${registrationData.eventId}/register/failed?id=${regRef.id}`,
            customer: {
                given_names: registrationData.participantInfo.name,
                email: registrationData.participantInfo.email,
                mobile_number: registrationData.participantInfo.phone,
            },
            items: [
                {
                    name: `Base Fee: ${categoryName}`,
                    quantity: 1,
                    price: registrationData.basePrice,
                    category: "Registration",
                },
                ...(registrationData.vanityPremium > 0 ? [{
                    name: `Vanity Number: ${registrationData.vanityNumber}`,
                    quantity: 1,
                    price: registrationData.vanityPremium,
                    category: "Vanity Fee",
                }] : [])
            ],
            fees: []
        };

        const response = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(invoiceData),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Xendit Error:", result);
            throw new Error(result.message || "Failed to create Xendit invoice");
        }

        return NextResponse.json({
            checkoutUrl: result.invoice_url,
            registrationId: regRef.id,
        });

    } catch (error: any) {
        console.error("Payment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
