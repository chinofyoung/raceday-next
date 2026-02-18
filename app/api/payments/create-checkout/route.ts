import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { generateBibAndQR } from "@/lib/bibUtils";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { registrationData, eventName, categoryName } = body;

        const totalAmount = Math.round(registrationData.totalPrice || 0);

        // Handle FREE registrations — skip Xendit entirely
        if (totalAmount <= 0) {
            // Generate Bib & QR for free registration
            const { raceNumber, qrCodeUrl } = await generateBibAndQR(
                "temp-id", // will replace after adding doc
                registrationData.eventId,
                registrationData.categoryId,
                registrationData.participantInfo.name,
                registrationData.vanityNumber
            );

            const regRef = await addDoc(collection(db, "registrations"), {
                ...registrationData,
                status: "paid", // Free = Paid
                paymentStatus: "free",
                raceNumber,
                qrCodeUrl,
                paidAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Update QR code with real ID
            const { qrCodeUrl: realQr } = await generateBibAndQR(
                regRef.id,
                registrationData.eventId,
                registrationData.categoryId,
                registrationData.participantInfo.name,
                registrationData.vanityNumber
            );
            await updateDoc(doc(db, "registrations", regRef.id), { qrCodeUrl: realQr });

            return NextResponse.json({
                checkoutUrl: null,
                registrationId: regRef.id,
                free: true,
            });
        }

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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "http://localhost:3000";

        const invoiceData: any = {
            external_id: regRef.id,
            amount: totalAmount,
            description: `Registration for ${eventName} - ${categoryName}`,
            invoice_duration: 86400, // 24 hours
            currency: "PHP",
            reminder_time: 1,
            success_redirect_url: `${baseUrl}/events/${registrationData.eventId}/register/success?id=${regRef.id}`,
            failure_redirect_url: `${baseUrl}/events/${registrationData.eventId}/register/failed?id=${regRef.id}`,
            customer: {
                given_names: registrationData.participantInfo.name,
                email: registrationData.participantInfo.email,
            },
            items: [
                {
                    name: `Base Fee: ${categoryName}`,
                    quantity: 1,
                    price: Math.round(registrationData.basePrice),
                    category: "Registration",
                },
                ...(registrationData.vanityPremium > 0 ? [{
                    name: `Vanity Number: ${registrationData.vanityNumber}`,
                    quantity: 1,
                    price: Math.round(registrationData.vanityPremium),
                    category: "Vanity Fee",
                }] : [])
            ]
        };

        // Add mobile number if it exists and isn't empty
        if (registrationData.participantInfo.phone && registrationData.participantInfo.phone.trim()) {
            invoiceData.customer.mobile_number = registrationData.participantInfo.phone;
        }

        console.log("Xendit Invoice Data:", JSON.stringify(invoiceData, null, 2));

        const response = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(invoiceData),
        });

        const result = await response.json();
        console.log("Xendit API Raw Result:", JSON.stringify(result, null, 2));

        if (!response.ok) {
            console.error("Xendit Error:", result);
            throw new Error(result.message || "Failed to create Xendit invoice");
        }

        // 3. Update registration with invoice details
        await updateDoc(regRef, {
            xenditInvoiceId: result.id,
            xenditInvoiceUrl: result.invoice_url,
            updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
            checkoutUrl: result.invoice_url,
            registrationId: regRef.id,
        });

    } catch (error: any) {
        console.error("Payment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
