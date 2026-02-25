import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get("eventId");
        const volunteerId = searchParams.get("volunteerId");

        if (!eventId || !volunteerId) {
            return new NextResponse("Missing parameters", { status: 400 });
        }

        const volunteerDoc = await adminDb
            .collection("events")
            .doc(eventId)
            .collection("volunteers")
            .doc(volunteerId)
            .get();

        if (!volunteerDoc.exists) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        const volunteerData = volunteerDoc.data();
        if (volunteerData?.status !== "pending") {
            return NextResponse.json({ status: volunteerData?.status });
        }

        const eventDoc = await adminDb.collection("events").doc(eventId).get();
        const eventData = eventDoc.data();

        return NextResponse.json({
            email: volunteerData.email,
            permissions: volunteerData.permissions,
            eventName: eventData?.name,
            organizerName: eventData?.organizerName,
            featuredImage: eventData?.featuredImage,
        });
    } catch (error) {
        console.error("Error fetching invite details:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
