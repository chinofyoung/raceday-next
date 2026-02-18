import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { generateBibAndQR } from "@/lib/bibUtils";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function GET(
    req: Request,
    { params }: { params: Promise<{ regId: string }> }
) {
    try {
        const { regId: registrationId } = await params;
        const regRef = doc(db, "registrations", registrationId);
        const regSnap = await getDoc(regRef);

        if (!regSnap.exists()) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        const regData = regSnap.data();

        // If already paid, just return success
        if (regData.status === "paid") {
            return NextResponse.json({ status: "paid", raceNumber: regData.raceNumber });
        }

        // Otherwise, check Xendit directly
        // We need the Xendit Invoice ID or we can search by external_id
        // The most reliable is to fetch by external_id if we have the secret key
        const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");

        // Fetch invoices from Xendit filtered by external_id
        const response = await fetch(`https://api.xendit.co/v2/invoices?external_id=${registrationId}`, {
            headers: {
                "Authorization": `Basic ${auth}`,
            },
        });

        const invoices = await response.json();

        if (!response.ok || !Array.isArray(invoices) || invoices.length === 0) {
            return NextResponse.json({ status: "pending", message: "No invoice found yet" });
        }

        // Use the latest invoice
        const invoice = invoices[0];

        if (invoice.status === "PAID" || invoice.status === "SETTLED") {
            // Manual Sync: Update the registration if Xendit says it's paid
            const { raceNumber, qrCodeUrl } = await generateBibAndQR(
                registrationId,
                regData.eventId,
                regData.categoryId,
                regData.participantInfo.name,
                regData.vanityNumber
            );

            await updateDoc(regRef, {
                status: "paid",
                paymentStatus: "paid",
                raceNumber,
                qrCodeUrl,
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                xenditPaymentId: invoice.id,
                syncedManual: true
            });

            return NextResponse.json({ status: "paid", raceNumber });
        }

        return NextResponse.json({ status: invoice.status.toLowerCase() });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
