import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { generateBibAndQR } from "@/lib/bibUtils";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId: clerkUserId, getToken } = await clerkAuth();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });
        const body = await req.json();
        const { registrationId } = body;

        if (!registrationId) {
            return NextResponse.json({ error: "Missing registrationId" }, { status: 400 });
        }

        // Fetch registration
        const reg = await fetchQuery(api.registrations.getById, {
            id: registrationId as Id<"registrations">,
        });

        if (!reg) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        if (reg.status === "paid") {
            return NextResponse.json({ success: true, alreadyPaid: true });
        }

        // Approve in Convex (sets status to paid, increments count)
        await fetchMutation(api.registrations.approveManualPayment, {
            id: registrationId as Id<"registrations">,
        }, { token: token ?? undefined });

        // Generate bib and QR
        const participantName = reg.registrationData?.participantInfo?.name || "Runner";
        const vanityNumber = reg.registrationData?.vanityNumber;

        const { raceNumber, qrCodeUrl } = await generateBibAndQR(
            registrationId,
            reg.eventId,
            reg.categoryId,
            participantName,
            vanityNumber,
        );

        // Update registration with bib + QR
        await fetchMutation(api.registrations.markAsPaid, {
            id: registrationId as Id<"registrations">,
            paymentStatus: "paid",
            raceNumber,
            qrCodeUrl,
        });

        return NextResponse.json({ success: true, raceNumber });
    } catch (error: any) {
        console.error("Manual approve error:", error);
        return NextResponse.json({ error: error?.message || "Failed to approve" }, { status: 500 });
    }
}
