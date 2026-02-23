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

        // Format the vanity number using the category template
        const format = await getRaceNumberFormat(eventId, categoryId);
        const formattedBib = formatBibNumber(format, vanityNumber);

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
