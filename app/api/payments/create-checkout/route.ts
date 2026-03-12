import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { generateBibAndQR, isBibTaken } from "@/lib/bibUtils";
import { RaceEvent } from "@/types/event";
import { isRegistrationClosed, getEffectivePrice, isCategoryFull } from "@/lib/earlyBirdUtils";
import { auth as clerkAuth } from "@clerk/nextjs/server";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function POST(req: Request) {
    try {
        const { userId: clerkUserId } = await clerkAuth();
        const body = await req.json();
        const { registrationData, eventName, categoryName } = body;

        // 0. Get user ID from Convex
        const user = clerkUserId ? await fetchQuery(api.users.getByUid, { uid: clerkUserId }) : null;
        const userId = user?._id;

        // VERIFY EVENT & PRICE
        const eventData = await fetchQuery(api.events.getById, { id: registrationData.eventId as Id<"events"> }) as RaceEvent | null;

        if (!eventData) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 0. Check for duplicate "myself" registration
        if (!registrationData.isProxy && userId) {
            const exists = await fetchQuery(api.registrations.checkExisting, {
                userId: userId as Id<"users">,
                eventId: registrationData.eventId as Id<"events">,
                categoryId: registrationData.categoryId
            });
            if (exists) {
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

        if (Math.abs(expectedBasePrice - sentBasePrice) > 1) {
            return NextResponse.json({
                error: "Price has changed or is invalid. Please refresh the page and try again."
            }, { status: 400 });
        }

        // Validate vanity premium server-side to prevent price tampering
        let vanityPremium = 0;
        if (registrationData.vanityNumber && eventData.vanityRaceNumber?.enabled) {
            vanityPremium = eventData.vanityRaceNumber.premiumPrice || 0;
        }
        const totalAmount = Math.round(expectedBasePrice + vanityPremium);

        // Handle FREE registrations — skip Xendit entirely
        if (totalAmount <= 0) {
            const regId = await fetchMutation(api.registrations.create, {
                eventId: registrationData.eventId as Id<"events">,
                categoryId: registrationData.categoryId,
                userId: (userId || registrationData.userId) as Id<"users">,
                isProxy: registrationData.isProxy || false,
                registrationData: registrationData,
                totalPrice: 0,
            });

            const { raceNumber, qrCodeUrl } = await generateBibAndQR(
                regId,
                registrationData.eventId,
                registrationData.categoryId,
                registrationData.participantInfo.name,
                registrationData.vanityNumber
            );

            await fetchMutation(api.registrations.markAsPaid, {
                id: regId as Id<"registrations">,
                paymentStatus: "free",
                raceNumber,
                qrCodeUrl,
            });

            return NextResponse.json({
                checkoutUrl: null,
                registrationId: regId,
                free: true,
            });
        }

        // 1. Create registration in Convex (pending)
        const regId = await fetchMutation(api.registrations.create, {
            eventId: registrationData.eventId as Id<"events">,
            categoryId: registrationData.categoryId,
            userId: (userId || registrationData.userId) as Id<"users">,
            isProxy: registrationData.isProxy || false,
            registrationData: registrationData,
            totalPrice: totalAmount,
        });

        // 2. Prepare Xendit Invoice Request
        const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "http://localhost:3000";

        const invoiceData: any = {
            external_id: regId,
            amount: totalAmount,
            description: `Registration for ${eventName} - ${categoryName}`,
            invoice_duration: 86400,
            currency: "PHP",
            success_redirect_url: `${baseUrl}/events/${registrationData.eventId}/register/success?id=${regId}`,
            failure_redirect_url: `${baseUrl}/events/${registrationData.eventId}/register/failed?id=${regId}`,
            customer: {
                given_names: registrationData.participantInfo.name,
                email: registrationData.participantInfo.email,
            },
            items: [
                {
                    name: `Base Fee: ${categoryName}`,
                    quantity: 1,
                    price: Math.round(registrationData.basePrice),
                },
                ...(vanityPremium > 0 ? [{
                    name: `Vanity Number: ${registrationData.vanityNumber}`,
                    quantity: 1,
                    price: Math.round(vanityPremium),
                }] : [])
            ]
        };

        if (registrationData.participantInfo.phone?.trim()) {
            invoiceData.customer.mobile_number = registrationData.participantInfo.phone;
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

        if (!response.ok) {
            throw new Error(result.message || "Failed to create Xendit invoice");
        }

        // 3. Update registration with invoice details in Convex
        await fetchMutation(api.registrations.updatePaymentInfo, {
            id: regId as Id<"registrations">,
            xenditInvoiceId: result.id,
            xenditInvoiceUrl: result.invoice_url,
        });

        return NextResponse.json({
            checkoutUrl: result.invoice_url,
            registrationId: regId,
        });

    } catch (error: any) {
        console.error("Payment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
