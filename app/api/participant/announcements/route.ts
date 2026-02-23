import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getParticipantAnnouncements } from "@/lib/services/announcementService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify session
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        const announcements = await getParticipantAnnouncements(uid, email);

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching participant announcements:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
