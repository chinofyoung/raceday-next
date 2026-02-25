import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { acceptInvitation } from "@/lib/services/volunteerService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;
        const userEmail = decodedToken.email?.toLowerCase();

        if (!userEmail) {
            return new NextResponse("User email not found", { status: 400 });
        }

        const body = await request.json();
        const { eventId, volunteerId } = body;

        if (!eventId || !volunteerId) {
            return new NextResponse("Missing eventId or volunteerId", { status: 400 });
        }

        // Verify invitation exists and matches the user's email
        const volunteerRef = adminDb.collection("events").doc(eventId).collection("volunteers").doc(volunteerId);
        const volunteerDoc = await volunteerRef.get();

        if (!volunteerDoc.exists) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        const volunteerData = volunteerDoc.data();
        if (volunteerData?.email !== userEmail) {
            return new NextResponse("Email mismatch. You can only accept invitations sent to your Gmail address.", { status: 403 });
        }

        if (volunteerData?.status !== 'pending') {
            return new NextResponse(`Invitation already ${volunteerData?.status}`, { status: 400 });
        }

        // Get user details for the volunteer record
        const user = await adminAuth.getUser(uid);

        await acceptInvitation(
            eventId,
            volunteerId,
            uid,
            user.displayName,
            user.photoURL
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error accepting volunteer invitation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
