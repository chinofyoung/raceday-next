import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { generateBibAndQR } from "@/lib/bibUtils";

export async function POST(req: Request) {
    try {
        const token = req.headers.get("x-callback-token");
        if (!token || token !== process.env.XENDIT_CALLBACK_TOKEN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (body.status === "PAID" || body.status === "SETTLED") {
            const registrationId = body.external_id;

            if (!registrationId || typeof registrationId !== "string") {
                return NextResponse.json({ error: "Invalid registration ID" }, { status: 400 });
            }

            // 1. Fetch the registration doc from Convex
            const regData = await fetchQuery(api.registrations.getById, { id: registrationId as Id<"registrations"> });

            if (regData) {
                // Idempotency: already processed
                if (regData.status === "paid") {
                    return NextResponse.json({ success: true });
                }

                // 2. Generate Race Number & QR Code
                let raceNumber: string;
                let qrCodeUrl: string;

                try {
                    const result = await generateBibAndQR(
                        registrationId,
                        regData.eventId,
                        regData.categoryId,
                        regData.registrationData?.participantInfo?.name || "Participant",
                        regData.registrationData?.vanityNumber
                    );
                    raceNumber = result.raceNumber;
                    qrCodeUrl = result.qrCodeUrl;
                } catch (bibError: any) {
                    // Fallback to sequential if vanity conflict
                    const result = await generateBibAndQR(
                        registrationId,
                        regData.eventId,
                        regData.categoryId,
                        regData.registrationData?.participantInfo?.name || "Participant",
                        null
                    );
                    raceNumber = result.raceNumber;
                    qrCodeUrl = result.qrCodeUrl;
                }

                // 4. Update Convex using the mutation we just enhanced
                // It now handles status update and event count increment
                await fetchMutation(api.registrations.markAsPaid, {
                    id: registrationId as Id<"registrations">,
                    paymentStatus: "paid",
                    raceNumber,
                    qrCodeUrl,
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
