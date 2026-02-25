import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getVolunteerEventsByUid, getVolunteerEventsByEmail } from "@/lib/services/volunteerService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    let uid = "unknown";
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        uid = decodedToken.uid;
        const email = decodedToken.email;

        const volunteerRecords = await getVolunteerEventsByUid(uid);
        let pendingRecords: any[] = [];

        if (email) {
            pendingRecords = await getVolunteerEventsByEmail(email);
        }

        // Combine both accepted and pending
        const allRecords = [
            ...volunteerRecords.map(r => ({ ...r, status: "accepted" })),
            ...pendingRecords.map(r => ({ ...r, status: "pending" }))
        ];

        // Fetch event details for each records
        const eventsWithPermissions = await Promise.all(
            allRecords.map(async (record) => {
                const eventDoc = await adminDb.collection("events").doc(record.eventId).get();
                const eventData = eventDoc.data();

                return {
                    id: record.eventId,
                    name: eventData?.name || "Unknown Event",
                    date: eventData?.date,
                    featuredImage: eventData?.featuredImage,
                    location: eventData?.location,
                    permissions: record.permissions,
                    volunteerId: record.id,
                    status: record.status
                };
            })
        );

        return NextResponse.json(eventsWithPermissions);
    } catch (error: any) {
        console.error("Error fetching volunteer events:", {
            message: error.message,
            stack: error.stack,
            uid
        });
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
