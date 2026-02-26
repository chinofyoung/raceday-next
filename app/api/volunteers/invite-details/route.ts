import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get("eventId");
        const volunteerId = searchParams.get("volunteerId");

        if (!eventId || !volunteerId) {
            return new NextResponse("Missing parameters", { status: 400 });
        }

        const volunteer = await fetchQuery(api.volunteers.getById, {
            id: volunteerId as Id<"volunteers">
        });

        if (!volunteer) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        if (volunteer.status !== "pending") {
            return NextResponse.json({ status: volunteer.status });
        }

        const event = await fetchQuery(api.events.getById, {
            id: eventId as Id<"events">
        });

        return NextResponse.json({
            email: volunteer.email,
            permissions: volunteer.permissions,
            eventName: event?.name,
            organizerName: event?.organizerName, // Note: backend should probably fetch organizer name if not in event doc
            featuredImage: event?.featuredImage,
        });
    } catch (error) {
        console.error("Error fetching invite details:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
