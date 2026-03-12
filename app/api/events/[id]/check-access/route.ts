import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { getVolunteerPermissions } from "@/lib/volunteerAccess";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId, getToken } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const token = await getToken({ template: "convex" });

        const { id: eventId } = await context.params;

        // Safety check for valid Convex ID
        if (!eventId || eventId === "undefined" || eventId.length < 10) {
            return new NextResponse("Invalid Event ID", { status: 400 });
        }

        // Get user from Convex
        const user = await fetchQuery(api.users.getByUid, { uid: clerkId }, { token: token ?? undefined });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Get event from Convex
        const event = await fetchQuery(api.events.getById, { id: eventId as Id<"events"> });
        if (!event) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const isOrganizer = event.organizerId === user._id;
        const isAdmin = user.role === "admin";

        const volunteerPermissions = await getVolunteerPermissions(user._id, eventId);

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
