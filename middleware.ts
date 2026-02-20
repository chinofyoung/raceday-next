import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const JWKS_URL = `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`;
const JWKS = FIREBASE_PROJECT_ID ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

async function verifySessionCookie(cookie: string): Promise<boolean> {
    if (!JWKS || !FIREBASE_PROJECT_ID) return false;
    try {
        await jwtVerify(cookie, JWKS, {
            issuer: `https://session.firebase.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
        });
        return true;
    } catch {
        return false;
    }
}

const PROTECTED_PATHS = ["/dashboard"];
const AUTH_PATHS = ["/auth/login"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session")?.value;

    const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
    const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));

    if (isProtectedPath) {
        if (!sessionCookie) {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        const isValid = await verifySessionCookie(sessionCookie);
        if (!isValid) {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete("session"); // Clear invalid cookie
            return response;
        }
    }

    // Has session cookie — redirect away from auth pages
    if (isAuthPath && sessionCookie) {
        // Technically we should verify it here too, but just the presence is usually fine for UX
        const isValid = await verifySessionCookie(sessionCookie);
        if (isValid) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/auth/:path*",
    ],
};
