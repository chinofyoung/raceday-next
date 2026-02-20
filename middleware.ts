import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, importX509, decodeProtectedHeader } from "jose";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const SESSION_COOKIE_CERT_URL = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";

// Cache the certificates to avoid fetching on every request
let cachedCerts: Record<string, string> | null = null;
let cacheExpiry = 0;

async function getSessionCookieCerts(): Promise<Record<string, string>> {
    const now = Date.now();
    if (cachedCerts && now < cacheExpiry) return cachedCerts;

    const res = await fetch(SESSION_COOKIE_CERT_URL);
    const certs = await res.json();

    // Cache for 1 hour (certs rotate infrequently)
    const cacheControl = res.headers.get("cache-control");
    const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
    cacheExpiry = now + (maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600000);
    cachedCerts = certs;

    return certs;
}

async function verifySessionCookie(cookie: string): Promise<boolean> {
    if (!FIREBASE_PROJECT_ID) return false;
    try {
        const header = decodeProtectedHeader(cookie);
        const kid = header.kid;
        if (!kid) return false;

        const certs = await getSessionCookieCerts();
        const cert = certs[kid];
        if (!cert) return false;

        const publicKey = await importX509(cert, "RS256");
        await jwtVerify(cookie, publicKey, {
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
