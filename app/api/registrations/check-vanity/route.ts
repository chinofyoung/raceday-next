import { NextResponse } from "next/server";
import {
    formatBibNumber,
    isBibTaken,
} from "@/lib/bibUtils";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const categoryId = searchParams.get("categoryId");
        const vanityNumber = searchParams.get("vanityNumber");

        if (!eventId || !categoryId || !vanityNumber) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const eventData = await fetchQuery(api.events.getById, { id: eventId as Id<"events"> });
        const category = eventData?.categories?.find((c: any) => (c.id || "0") === categoryId);

        const format = category?.raceNumberFormat || "{number}";
        const maxDigits = eventData?.vanityRaceNumber?.maxDigits || 3;

        const paddedVanity = vanityNumber.padStart(maxDigits, "0");
        const formattedBib = formatBibNumber(format, paddedVanity);

        const taken = await isBibTaken(eventId, formattedBib);

        return NextResponse.json({ available: !taken, formattedBib });
    } catch (error: any) {
        console.error("Check vanity error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
