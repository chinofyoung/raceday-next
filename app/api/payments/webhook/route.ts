import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { generateQRCode } from "@/lib/qr";

export async function POST(req: Request) {
    try {
        // Xendit might send different event types, for Invoice paid:
        // { id, external_id, status, amount, ... }
        const body = await req.json();

        // Optional: Verify callback token (from Xendit Dashboard)
        // const token = req.headers.get("x-callback-token");
        // if (token !== process.env.XENDIT_CALLBACK_TOKEN) { ... }

        if (body.status === "PAID" || body.status === "SETTLED") {
            const registrationId = body.external_id;

            // 1. Fetch the registration doc
            const regRef = doc(db, "registrations", registrationId);
            const regSnap = await getDoc(regRef);

            if (regSnap.exists()) {
                const regData = regSnap.data();

                // 2. Generate Race Number (Simple format: DISTANCE-SEQ)
                // In a production app, this would be more complex and checked for collisions
                const randomSeq = Math.floor(Math.random() * 9000) + 1000;
                const raceNumber = `${regData.categoryId.includes("5K") ? "5K" :
                    regData.categoryId.includes("10K") ? "10K" :
                        regData.categoryId.includes("21K") ? "21K" :
                            regData.categoryId.includes("42K") ? "42K" : "RB"}-${regData.vanityNumber || randomSeq}`;

                // 3. Generate QR Code
                const qrData = JSON.stringify({
                    registrationId,
                    eventId: regData.eventId,
                    runnerName: regData.participantInfo.name,
                    raceNumber
                });
                const qrCodeUrl = await generateQRCode(qrData);

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
