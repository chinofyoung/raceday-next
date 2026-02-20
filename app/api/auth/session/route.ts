import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
    try {
        const { idToken } = await req.json();

        // Verify the ID token first
        await adminAuth.verifyIdToken(idToken);

        // Create a session cookie (5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in ms
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json({ success: true });
        response.cookies.set("session", sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn / 1000, // in seconds
            path: "/",
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("session");
    return response;
}
