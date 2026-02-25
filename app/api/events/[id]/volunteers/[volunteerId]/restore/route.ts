import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { restoreVolunteer } from "@/lib/services/volunteerService";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string; volunteerId: string }> }
) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;
        const { id: eventId, volunteerId } = await context.params;

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

        await restoreVolunteer(eventId, volunteerId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error restoring volunteer access:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
