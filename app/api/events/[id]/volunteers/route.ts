import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getEventVolunteers, inviteVolunteer, getVolunteerByEmail } from "@/lib/services/volunteerService";
import { volunteerInviteSchema } from "@/lib/validations/volunteer";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;
        const { id: eventId } = await context.params;

        // Verify the user is the organizer of the event
        const eventDoc = await adminDb.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const eventData = eventDoc.data();
        if (eventData?.organizerId !== uid) {
            // Also allow admins
            const userDoc = await adminDb.collection("users").doc(uid).get();
            if (userDoc.data()?.role !== "admin") {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        const volunteers = await getEventVolunteers(eventId);
        return NextResponse.json(volunteers);
    } catch (error) {
        console.error("Error fetching volunteers:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;
        const { id: eventId } = await context.params;

        // Verify the user is the organizer of the event
        const eventDoc = await adminDb.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const eventData = eventDoc.data();
        if (eventData?.organizerId !== uid) {
            const userDoc = await adminDb.collection("users").doc(uid).get();
            if (userDoc.data()?.role !== "admin") {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        const body = await request.json();
        const validatedData = volunteerInviteSchema.parse(body);

        // Check if duplicate invitation
        const existing = await getVolunteerByEmail(eventId, validatedData.email);
        if (existing && existing.status !== 'revoked') {
            return NextResponse.json({ message: "Volunteer already invited" }, { status: 400 });
        }

        const volunteer = await inviteVolunteer(
            eventId,
            validatedData.email,
            validatedData.permissions,
            uid
        );

        // Send invitation email via Resend
        try {
            const organizerName = eventData?.organizerName || eventData?.organizer?.name || "The Event Organizer";
            const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/volunteer/accept?eventId=${eventId}&volunteerId=${volunteer.id}`;

            const { sendVolunteerInvitation } = await import("@/lib/services/emailService");
            await sendVolunteerInvitation({
                to: validatedData.email,
                eventName: eventData?.name || "Event",
                organizerName,
                acceptUrl,
                permissions: validatedData.permissions,
            });
        } catch (emailError) {
            console.error("Failed to send volunteer invitation email:", emailError);
            // We don't fail the whole request if email fails, as the volunteer is already in DB
        }

        return NextResponse.json(volunteer);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ errors: error.errors }, { status: 400 });
        }
        console.error("Error inviting volunteer:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
