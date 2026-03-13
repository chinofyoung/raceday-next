import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { userId, getToken } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });
        const announcements = await fetchQuery(
            api.announcements.listForParticipant,
            {},
            { token: token ?? undefined }
        );

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching participant announcements:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
