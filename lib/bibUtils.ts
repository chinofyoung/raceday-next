import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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

    // 2. Determine the raw number portion
    let bibNumber: string;

    if (vanityNumber) {
        bibNumber = vanityNumber;
    } else {
        // Count existing paid registrations for this event + category
        const existingSnap = await getDocs(
            query(
                collection(db, "registrations"),
                where("eventId", "==", eventId),
                where("categoryId", "==", categoryId),
                where("status", "==", "paid")
            )
        );
        bibNumber = String(existingSnap.size + 1).padStart(3, "0");
    }

    // 3. Format using the category template
    const raceNumber = format.replace("{number}", bibNumber);
    return raceNumber;
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
