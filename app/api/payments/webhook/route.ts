import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { generateQRCode } from "@/lib/qr";
import { generateBibAndQR } from "@/lib/bibUtils";

export async function POST(req: Request) {
    try {
        const token = req.headers.get("x-callback-token");
        if (!token || token !== process.env.XENDIT_CALLBACK_TOKEN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Xendit might send different event types, for Invoice paid:
        // { id, external_id, status, amount, ... }
        const body = await req.json();

        if (process.env.NODE_ENV === "development") {
            console.log("Webhook received:", JSON.stringify(body, null, 2));
        }

        if (body.status === "PAID" || body.status === "SETTLED") {
            const registrationId = body.external_id;

            if (!registrationId || typeof registrationId !== "string") {
                console.error("Invalid registration ID:", registrationId);
                return NextResponse.json({ error: "Invalid registration ID" }, { status: 400 });
            }

            // 1. Fetch the registration doc
            const regRef = doc(db, "registrations", registrationId);
            const regSnap = await getDoc(regRef);

            if (regSnap.exists()) {
                const regData = regSnap.data();

                // Idempotency: already processed — return success without re-processing
                if (regData.status === "paid") {
                    console.log(`Webhook already processed for registration: ${registrationId}`);
                    return NextResponse.json({ success: true });
                }

                // 2. Generate Race Number & QR Code (Robust)
                const { raceNumber, qrCodeUrl } = await generateBibAndQR(
                    registrationId,
                    regData.eventId,
                    regData.categoryId,
                    regData.participantInfo.name,
                    regData.vanityNumber
                );

                // 4. Update Firestore
                await updateDoc(regRef, {
                    status: "paid",
                    paymentStatus: "paid",
                    raceNumber,
                    qrCodeUrl,
                    paidAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    xenditPaymentId: body.id,
                });

                console.log(`Payment confirmed for registration: ${registrationId}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
