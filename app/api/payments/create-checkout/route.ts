import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, increment, query, where, getDocs } from "firebase/firestore";
import { generateBibAndQR, isBibTaken, getRaceNumberFormat, formatBibNumber } from "@/lib/bibUtils";
import { RaceEvent } from "@/types/event";
import { isRegistrationClosed, getEffectivePrice, isCategoryFull } from "@/lib/earlyBirdUtils";
import { getPlatformSettings } from "@/lib/services/settingsService";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { registrationData, eventName, categoryName } = body;

        // VERIFY EVENT & PRICE
        const eventRef = doc(db, "events", registrationData.eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const eventData = { id: eventSnap.id, ...eventSnap.data() } as RaceEvent;

        // 0. Check for duplicate "myself" registration
        if (!registrationData.isProxy && registrationData.userId) {
            const regsRef = collection(db, "registrations");
            const q = query(
                regsRef,
                where("userId", "==", registrationData.userId),
                where("eventId", "==", registrationData.eventId),
                where("categoryId", "==", registrationData.categoryId),
                where("isProxy", "==", false),
                where("status", "in", ["paid", "pending"])
            );
            const existingSnap = await getDocs(q);

            // Check if there's any OTHER registration (not the one we're currently updating)
            const otherRegs = existingSnap.docs.filter(d => d.id !== registrationData.registrationId);

            if (otherRegs.length > 0) {
                return NextResponse.json({
                    error: "You are already registered for this category in this event."
                }, { status: 400 });
            }
        }

        // 1. Check Registration Deadline
        if (isRegistrationClosed(eventData)) {
            return NextResponse.json({ error: "Registration is closed for this event." }, { status: 400 });
        }

        // 2. Validate Price
        const category = eventData.categories.find((c: any) => c.id === registrationData.categoryId);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 400 });
        }

        // 3. Check Capacity
        if (isCategoryFull(category)) {
            return NextResponse.json({
                error: `The category "${category.name}" is already sold out!`
            }, { status: 400 });
        }

        const expectedBasePrice = getEffectivePrice(eventData, category);
        const sentBasePrice = registrationData.basePrice;

        // Allow tiny floating point diff, though usually integers
        if (Math.abs(expectedBasePrice - sentBasePrice) > 1) {
            console.error(`Price Mismatch: Expected ${expectedBasePrice}, Got ${sentBasePrice}`);
            return NextResponse.json({
                error: "Price has changed or is invalid. Please refresh the page and try again."
            }, { status: 400 });
        }

        // Recalculate total just in case
        const totalAmount = Math.round(expectedBasePrice + (registrationData.vanityPremium || 0));

        // 3. Validate vanity number is still available (last line of defense)
        if (registrationData.vanityNumber) {
            const format = await getRaceNumberFormat(
                registrationData.eventId,
                registrationData.categoryId
            );
            const formattedVanity = formatBibNumber(format, registrationData.vanityNumber);
            const taken = await isBibTaken(registrationData.eventId, formattedVanity);

            if (taken) {
                return NextResponse.json({
                    error: `Vanity bib number "${registrationData.vanityNumber}" is no longer available. Please choose a different number.`
                }, { status: 409 });
            }
        }

        // Handle FREE registrations — skip Xendit entirely
        if (totalAmount <= 0) {
            // 1. Create or Update the registration document first (no QR yet)
            let regId = registrationData.registrationId;
            const regPayload = {
                ...registrationData,
                organizerId: eventData.organizerId,
                status: "paid",
                paymentStatus: "free",
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            delete regPayload.registrationId;

            if (regId) {
                await updateDoc(doc(db, "registrations", regId), regPayload);
            } else {
                const regRef = await addDoc(collection(db, "registrations"), {
                    ...regPayload,
                    createdAt: serverTimestamp(),
                });
                regId = regRef.id;
            }

            // 2. Generate bib + QR with the REAL document ID (one time only)
            const { raceNumber, qrCodeUrl } = await generateBibAndQR(
                regId,                          // ← real ID now
                registrationData.eventId,
                registrationData.categoryId,
                registrationData.participantInfo.name,
                registrationData.vanityNumber
            );

            // 3. Update with bib + QR in a single write
            await updateDoc(doc(db, "registrations", regId), {
                raceNumber,
                qrCodeUrl,
            });

            // 4. Increment registeredCount for the event category
            // Since categories are in an array on the event doc, we need to find the index and update that specific element
            const categoryIndex = eventData.categories.findIndex(c => c.id === registrationData.categoryId);
            if (categoryIndex !== -1) {
                const updatedCategories = [...eventData.categories];
                updatedCategories[categoryIndex] = {
                    ...updatedCategories[categoryIndex],
                    registeredCount: (updatedCategories[categoryIndex].registeredCount || 0) + 1
                };
                await updateDoc(eventRef, {
                    categories: updatedCategories
                });
            }

            return NextResponse.json({
                checkoutUrl: null,
                registrationId: regId,
                free: true,
            });
        }

        // 4. Calculate Platform Fee
        const settings = await getPlatformSettings();
        const platformFeePercent = settings.processingFeePercent;
        const processingFee = Math.round(totalAmount * (platformFeePercent / 100));
        const chargeAmount = totalAmount + processingFee;

        // 1. Create or Update registration doc in Firestore (pending status)
        let regId = registrationData.registrationId;

        const regPayload = {
            ...registrationData,
            organizerId: eventData.organizerId,
            status: "pending",
            paymentStatus: "unpaid",
            platformFeePercent,
            processingFee,
            organizerAmount: totalAmount,
            totalPaid: chargeAmount,
            updatedAt: serverTimestamp(),
        };

        // Remove registrationId from payload to avoid double-storing
        delete regPayload.registrationId;

        if (regId) {
            await updateDoc(doc(db, "registrations", regId), regPayload);
        } else {
            const regRef = await addDoc(collection(db, "registrations"), {
                ...regPayload,
                createdAt: serverTimestamp(),
            });
            regId = regRef.id;
        }

        const externalId = regId;

        // 2. Prepare Xendit Invoice Request
        const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "http://localhost:3000";

        const invoiceData: any = {
            external_id: externalId,
            amount: chargeAmount,
            description: `Registration for ${eventName} - ${categoryName}`,
            invoice_duration: 86400, // 24 hours
            currency: "PHP",
            reminder_time: 1,
            success_redirect_url: `${baseUrl}/events/${registrationData.eventId}/register/success?id=${externalId}`,
            failure_redirect_url: `${baseUrl}/events/${registrationData.eventId}/register/failed?id=${externalId}`,
            customer: {
                given_names: registrationData.participantInfo.name,
                email: registrationData.participantInfo.email,
            },
            items: [
                {
                    name: `Base Fee: ${categoryName}`,
                    quantity: 1,
                    price: Math.round(registrationData.basePrice),
                    category: "Registration",
                },
                ...(registrationData.vanityPremium > 0 ? [{
                    name: `Vanity Number: ${registrationData.vanityNumber}`,
                    quantity: 1,
                    price: Math.round(registrationData.vanityPremium),
                    category: "Vanity Fee",
                }] : []),
                {
                    name: `Processing Fee (${platformFeePercent}%)`,
                    quantity: 1,
                    price: processingFee,
                    category: "Platform Fee",
                }
            ]
        };

        // Add mobile number if it exists and isn't empty
        if (registrationData.participantInfo.phone && registrationData.participantInfo.phone.trim()) {
            invoiceData.customer.mobile_number = registrationData.participantInfo.phone;
        }

        if (process.env.NODE_ENV === "development") {
            console.log("Xendit Invoice Data:", JSON.stringify(invoiceData, null, 2));
        }

        const response = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(invoiceData),
        });

        const result = await response.json();
        if (process.env.NODE_ENV === "development") {
            console.log("Xendit API Raw Result:", JSON.stringify(result, null, 2));
        }

        if (!response.ok) {
            console.error("Xendit Error:", result);
            throw new Error(result.message || "Failed to create Xendit invoice");
        }

        // 3. Update registration with invoice details
        await updateDoc(doc(db, "registrations", externalId), {
            xenditInvoiceId: result.id,
            xenditInvoiceUrl: result.invoice_url,
            updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
            checkoutUrl: result.invoice_url,
            registrationId: externalId,
        });

    } catch (error: any) {
        console.error("Payment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
