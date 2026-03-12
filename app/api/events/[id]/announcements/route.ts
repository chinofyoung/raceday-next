import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: eventId } = await context.params;

        if (!eventId || eventId === "undefined" || eventId.length < 10) {
            return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
        }

        const announcements = await fetchQuery(api.announcements.listByEvent, {
            eventId: eventId as Id<"events">,
        });

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
