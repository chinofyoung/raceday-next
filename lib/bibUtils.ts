import { db } from "@/lib/firebase/config";
import {
    doc,
    getDoc,
    runTransaction,
} from "firebase/firestore";
import { generateQRCode } from "@/lib/qr";

/**
 * Generates a bib (race) number for a registration.
 *
 * - If the runner chose a vanity number it is used directly.
 * - Otherwise the next sequential number for the event + category is assigned.
 * - The number is formatted using the category's `raceNumberFormat` template,
 *   e.g. "42K-{number}" → "42K-007".
 */
export async function generateBibNumber(
    eventId: string,
    categoryId: string,
    vanityNumber?: string | null
): Promise<string> {
    // 1. Fetch event to read the category's raceNumberFormat
    const eventDoc = await getDoc(doc(db, "events", eventId));
    const eventData = eventDoc.data();
    const category = eventData?.categories?.find(
        (c: any) => (c.id || "0") === categoryId
    );
    const format = category?.raceNumberFormat || "{number}";

    // 2. If vanity number is chosen, skip counter entirely
    if (vanityNumber) {
        return format.replace("{number}", vanityNumber);
    }

    // 3. Atomically increment the counter document
    const counterRef = doc(db, "bibCounters", `${eventId}_${categoryId}`);

    const nextCount = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);

        if (!counterSnap.exists()) {
            // First registration for this event+category — initialize at 1
            transaction.set(counterRef, { count: 1 });
            return 1;
        }

        const newCount = (counterSnap.data().count || 0) + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
    });

    // 4. Format using the category template
    const paddedNumber = String(nextCount).padStart(3, "0");
    return format.replace("{number}", paddedNumber);
}

/**
 * Generates bib number + QR code data for a registration.
 * Returns both so the caller can store them on the registration doc.
 */
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
