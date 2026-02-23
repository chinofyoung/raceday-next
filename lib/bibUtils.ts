import { db } from "@/lib/firebase/config";
import {
    doc,
    getDoc,
    runTransaction,
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { generateQRCode } from "@/lib/qr";

/**
 * Returns true if a formatted raceNumber is already in use for this event.
 * Checks both "paid" and "pending" registrations to prevent race conditions.
 */
export async function isBibTaken(
    eventId: string,
    raceNumber: string
): Promise<boolean> {
    const q = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        where("raceNumber", "==", raceNumber),
        where("status", "in", ["paid", "pending"])
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

/**
 * Resolves the raceNumberFormat for a given event + category.
 * Exported so other modules (e.g. check-vanity API) can reuse it.
 */
export async function getRaceNumberFormat(
    eventId: string,
    categoryId: string
): Promise<string> {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    const eventData = eventDoc.data();
    const category = eventData?.categories?.find(
        (c: any) => (c.id || "0") === categoryId
    );
    return category?.raceNumberFormat || "{number}";
}

/**
 * Formats a raw number string using the category's raceNumberFormat template.
 */
export function formatBibNumber(format: string, number: string): string {
    return format.replace("{number}", number);
}

/**
 * Generates a bib (race) number for a registration.
 *
 * - If the runner chose a vanity number it is used directly (throws if taken).
 * - Otherwise the next sequential number for the event + category is assigned,
 *   skipping any numbers already claimed by vanity registrations.
 * - The number is formatted using the category's `raceNumberFormat` template,
 *   e.g. "42K-{number}" → "42K-007".
 */
export async function generateBibNumber(
    eventId: string,
    categoryId: string,
    vanityNumber?: string | null
): Promise<string> {
    // 1. Fetch the category's raceNumberFormat
    const format = await getRaceNumberFormat(eventId, categoryId);

    // 2. If vanity number is chosen, validate it's still available
    if (vanityNumber) {
        const formatted = formatBibNumber(format, vanityNumber);
        const taken = await isBibTaken(eventId, formatted);
        if (taken) {
            throw new Error(
                `Vanity bib number "${vanityNumber}" is no longer available.`
            );
        }
        return formatted;
    }

    // 3. Atomically increment the counter, skipping numbers claimed by vanity
    const counterRef = doc(db, "bibCounters", `${eventId}_${categoryId}`);
    const MAX_SKIP_ATTEMPTS = 100;

    let finalNumber = "";

    for (let attempt = 0; attempt < MAX_SKIP_ATTEMPTS; attempt++) {
        const nextCount = await runTransaction(db, async (transaction) => {
            const counterSnap = await transaction.get(counterRef);

            if (!counterSnap.exists()) {
                transaction.set(counterRef, { count: 1 });
                return 1;
            }

            const newCount = (counterSnap.data().count || 0) + 1;
            transaction.update(counterRef, { count: newCount });
            return newCount;
        });

        const paddedNumber = String(nextCount).padStart(3, "0");
        const formatted = formatBibNumber(format, paddedNumber);

        // Check if this number was already claimed (e.g. by a vanity registration)
        const taken = await isBibTaken(eventId, formatted);
        if (!taken) {
            finalNumber = formatted;
            break;
        }

        // Number taken by vanity — loop will increment counter again
        console.warn(
            `Bib ${formatted} already claimed (vanity), skipping to next…`
        );
    }

    if (!finalNumber) {
        throw new Error(
            "Unable to assign a bib number after maximum attempts. Please contact support."
        );
    }

    return finalNumber;
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
