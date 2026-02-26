import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { getParticipantAnnouncements } from "@/lib/services/announcementService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkId } = getAuth(request);
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get user from Convex to get the proper internal ID
        const user = await fetchQuery(api.users.getByUid, { uid: clerkId });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const announcements = await getParticipantAnnouncements(user._id, user.email);

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching participant announcements:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
