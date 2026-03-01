import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { generateQRCode } from "@/lib/qr";

export async function isBibTaken(
    eventId: string,
    raceNumber: string
): Promise<boolean> {
    return fetchQuery(api.bibs.isTaken, {
        eventId: eventId as Id<"events">,
        bibNumber: raceNumber
    });
}

export async function generateBibNumber(
    eventId: string,
    categoryId: string,
    vanityNumber?: string | null
): Promise<string> {
    return fetchMutation(api.bibs.generate, {
        eventId: eventId as Id<"events">,
        categoryId,
        vanityNumber: vanityNumber || undefined,
    });
}

export async function generateBibAndQR(
    registrationId: string,
    eventId: string,
    categoryId: string,
    runnerName: string,
    vanityNumber?: string | null
): Promise<{ raceNumber: string; qrCodeUrl: string }> {
    const raceNumber = await generateBibNumber(eventId, categoryId, vanityNumber);

    const qrData = JSON.stringify({
        registrationId,
        eventId,
        runnerName,
        raceNumber,
    });
    const qrCodeUrl = await generateQRCode(qrData);

    return { raceNumber, qrCodeUrl };
}


export async function getRaceNumberFormat(
    eventId: string,
    categoryId: string
): Promise<string> {
    const event = await fetchQuery(api.events.getById, { id: eventId as Id<"events"> });
    const category = event?.categories?.find(
        (c: any) => (c.id || "0") === categoryId
    );
    return category?.raceNumberFormat || "{number}";
}

export function formatBibNumber(format: string, number: string): string {
    return format.replace("{number}", number);
}
