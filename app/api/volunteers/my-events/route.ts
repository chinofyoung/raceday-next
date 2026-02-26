import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { getVolunteerEventsByUid, getVolunteerEventsByEmail } from "@/lib/services/volunteerService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = getAuth(request);
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get user from Convex
        const user = await fetchQuery(api.users.getByUid, { uid: clerkId });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const acceptedRecords = await getVolunteerEventsByUid(user._id);
        const pendingRecords = await getVolunteerEventsByEmail(user.email);

        // Combine both accepted and pending
        const allRecords = [
            ...acceptedRecords.map(r => ({ ...r, status: "accepted" })),
            ...pendingRecords.map(r => ({ ...r, status: "pending" }))
        ];

        // Fetch event details for each records
        const eventsWithPermissions = await Promise.all(
            allRecords.map(async (record) => {
                const event = await fetchQuery(api.events.getById, {
                    id: record.eventId as Id<"events">
                });

                return {
                    id: record.eventId,
                    name: event?.name || "Unknown Event",
                    date: event?.date,
                    featuredImage: event?.featuredImage,
                    location: event?.location,
                    permissions: record.permissions,
                    volunteerId: record.id,
                    status: record.status
                };
            })
        );

        return NextResponse.json(eventsWithPermissions);
    } catch (error: any) {
        console.error("Error fetching volunteer events:", error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
