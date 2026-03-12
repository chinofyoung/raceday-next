import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { generateBibAndQR } from "@/lib/bibUtils";
import { auth as clerkAuth } from "@clerk/nextjs/server";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function GET(
    req: Request,
    { params }: { params: Promise<{ regId: string }> }
) {
    try {
        const { userId } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { regId: registrationId } = await params;
        const regData = await fetchQuery(api.registrations.getById, { id: registrationId as Id<"registrations"> });

        if (!regData) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        if (regData.status === "paid") {
            return NextResponse.json({ status: "paid", raceNumber: regData.raceNumber });
        }

        const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");
        const response = await fetch(`https://api.xendit.co/v2/invoices?external_id=${registrationId}`, {
            headers: { "Authorization": `Basic ${auth}` },
        });

        const invoices = await response.json();

        if (!response.ok || !Array.isArray(invoices) || invoices.length === 0) {
            return NextResponse.json({ status: "pending", message: "No invoice found yet" });
        }

        const invoice = invoices[0];

        if (invoice.status === "PAID" || invoice.status === "SETTLED") {
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

            await fetchMutation(api.registrations.markAsPaid, {
                id: registrationId as Id<"registrations">,
                paymentStatus: "paid",
                raceNumber,
                qrCodeUrl,
            });

            return NextResponse.json({ status: "paid", raceNumber });
        }

        return NextResponse.json({ status: invoice.status.toLowerCase() });
    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
