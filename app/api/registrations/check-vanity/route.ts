import { NextResponse } from "next/server";
import {
    getRaceNumberFormat,
    formatBibNumber,
    isBibTaken,
} from "@/lib/bibUtils";

/**
 * GET /api/registrations/check-vanity?eventId=...&categoryId=...&vanityNumber=...
 *
 * Server-side check for vanity bib number availability.
 * Checks the formatted raceNumber against existing registrations (paid + pending).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const categoryId = searchParams.get("categoryId");
        const vanityNumber = searchParams.get("vanityNumber");

        if (!eventId || !categoryId || !vanityNumber) {
            return NextResponse.json(
                { error: "Missing required parameters: eventId, categoryId, vanityNumber" },
                { status: 400 }
            );
        }

        // Fetch the event and category to get format and maxDigits
        const { db } = await import("@/lib/firebase/config");
        const { getDoc, doc } = await import("firebase/firestore");
        const eventDoc = await getDoc(doc(db, "events", eventId));
        const eventData = eventDoc.data();
        const category = eventData?.categories?.find((c: any) => (c.id || "0") === categoryId);

        const format = category?.raceNumberFormat || "{number}";
        const maxDigits = eventData?.vanityRaceNumber?.maxDigits || 3;

        // Format the vanity number (pad with zeros) and use the category template
        const paddedVanity = vanityNumber.padStart(maxDigits, "0");
        const formattedBib = formatBibNumber(format, paddedVanity);

        // Check if it's already taken
        const taken = await isBibTaken(eventId, formattedBib);

        return NextResponse.json({ available: !taken, formattedBib });
    } catch (error: any) {
        console.error("Check vanity error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
