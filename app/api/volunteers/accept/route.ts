import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { acceptInvitation, getEventVolunteers } from "@/lib/services/volunteerService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkId } = getAuth(request);
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get Convex user ID from Clerk ID
        const user = await fetchQuery(api.users.getByUid, { uid: clerkId });
        if (!user) {
            return new NextResponse("User not found in Convex", { status: 404 });
        }

        const body = await request.json();
        const { eventId, volunteerId } = body;

        if (!eventId || !volunteerId) {
            return new NextResponse("Missing eventId or volunteerId", { status: 400 });
        }

        // Verify invitation via service (which now uses Convex)
        const volunteer = await fetchQuery(api.volunteers.getById, {
            id: volunteerId as Id<"volunteers">
        });

        if (!volunteer) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        if (volunteer.email.toLowerCase() !== user.email.toLowerCase()) {
            return new NextResponse("Email mismatch. You can only accept invitations sent to your email address.", { status: 403 });
        }

        if (volunteer.status !== 'pending') {
            return new NextResponse(`Invitation already ${volunteer.status}`, { status: 400 });
        }

        await acceptInvitation(
            eventId,
            volunteerId,
            user._id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error accepting volunteer invitation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
