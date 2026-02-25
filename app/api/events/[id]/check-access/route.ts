import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getVolunteerPermissions } from "@/lib/volunteerAccess";

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

        const eventDoc = await adminDb.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const eventData = eventDoc.data();
        const isOrganizer = eventData?.organizerId === uid;
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const isAdmin = userDoc.data()?.role === "admin";

        const volunteerPermissions = await getVolunteerPermissions(uid, eventId);

        return NextResponse.json({
            isOrganizer,
            isAdmin,
            permissions: volunteerPermissions,
        });
    } catch (error) {
        console.error("Error checking access:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
