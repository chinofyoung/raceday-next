# Stage 5 — Auth Guard & Next.js Middleware
**Priority:** 🟠 High
**Issues Fixed:** #8 (Client-only auth guard)
**Files Touched:** 3 (new `middleware.ts`, update `app/(app)/layout.tsx`, update `lib/firebase/admin.ts`)
**Risk:** Medium-High — touches every protected route. Test all auth flows: logged out, logged in, role-based.

**Vercel Rule References:** `server-auth-actions`, `rendering-hydration-no-flicker`

---

## Overview

Currently, route protection for `/dashboard/*` happens inside a `useEffect` in `app/(app)/layout.tsx`. This means:

1. The server renders the full layout (navbar + content structure)
2. React hydrates on the client
3. The `useEffect` fires and detects no auth
4. `router.push("/auth/login")` redirects

This causes a visible "flash" of the loading spinner and sends unnecessary HTML to unauthenticated users. Next.js Middleware runs at the Edge **before** the page renders — the correct place for auth checks.

> ⚠️ **Important limitation:** Firebase Auth uses client-side JWTs — there is no native HTTP cookie set automatically. The strategy below uses the Firebase ID token stored in a session cookie (set after login) to enable server-side checking. This requires a small change to the login flow.

---

## Implementation Strategy

### Two-Part Approach

1. **On login:** Exchange the Firebase ID token for a short-lived session cookie (or store the token in a cookie manually)
2. **In Middleware:** Read the cookie and verify the token using Firebase Admin SDK

---

## Step 1 — Set Session Cookie on Login
**File:** `app/auth/login/page.tsx` (or wherever `signInWithGoogle` is called)

After successful sign-in, store the Firebase ID token in a cookie so Middleware can read it:

```ts
import { auth } from "@/lib/firebase/config";

// After signInWithGoogle() succeeds:
const idToken = await auth.currentUser?.getIdToken();
if (idToken) {
    // Set a secure, httpOnly cookie via an API route
    await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
}
```

**Create `app/api/auth/session/route.ts`** (new file):

```ts
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
```

**Update `lib/firebase/auth.ts` — clear session cookie on sign-out:**

```ts
export const signOutUser = async () => {
    try {
        await signOut(auth);
        // Clear session cookie
        await fetch("/api/auth/session", { method: "DELETE" });
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};
```

---

## Step 2 — Create `middleware.ts`
**File:** `middleware.ts` (at project root, next to `next.config.ts`)

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard"];

// Routes that should redirect to dashboard if already logged in
const AUTH_PATHS = ["/auth/login"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session")?.value;

    const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
    const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));

    // No session cookie — redirect to login for protected paths
    if (isProtectedPath && !sessionCookie) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Has session cookie — redirect away from auth pages
    if (isAuthPath && sessionCookie) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match protected and auth paths, skip static files and API routes
        "/dashboard/:path*",
        "/auth/:path*",
    ],
};
```

> **Note:** For full token verification in middleware (not just cookie presence), use the Firebase Admin SDK in the Edge runtime. This requires `firebase-admin` to be compatible with the Edge — or use a lightweight JWT library (`jose`) to verify the token signature manually.

### Lightweight JWT Verification in Edge Middleware (Recommended)

Firebase session cookies are signed JWTs that can be verified without the full Admin SDK. Use `jose`:

```bash
npm install jose
```

```ts
// middleware.ts — with actual token verification
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const JWKS_URL = `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

async function verifySessionCookie(cookie: string): Promise<boolean> {
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

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session")?.value;

    const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));

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

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
```

---

## Step 3 — Simplify `app/(app)/layout.tsx`

Once middleware handles the redirect, the layout no longer needs the `useEffect` auth check. It still shows a loading state while Firebase Auth initializes on the client (needed for the `useAuth` context to populate).

```ts
"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    // Show minimal loading state while Firebase Auth SDK initializes client-side
    // (Middleware already blocked unauthenticated server requests)
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">Loading...</p>
                </div>
            </div>
        );
    }

    // No redirect useEffect needed — middleware handles it server-side
    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-white">
            <Navbar />
            <main className="flex-grow pt-24">
                {children}
            </main>
            <Footer />
        </div>
    );
}
```

---

## Acceptance Criteria

- [ ] Visiting `/dashboard` while logged out redirects to `/auth/login?redirect=/dashboard` **without** loading the dashboard HTML first
- [ ] Visiting `/auth/login` while logged in redirects to `/dashboard`
- [ ] Signing out clears the `session` cookie and redirects to home
- [ ] The loading spinner in `app/(app)/layout.tsx` is shorter (no auth check needed)
- [ ] Session cookie is `httpOnly`, `secure` (in production), and has a 5-day expiry
- [ ] An expired or tampered session cookie causes a redirect to login (not a crash)

---

## Testing Checklist

- [ ] Open incognito → navigate to `/dashboard/events` → redirects to login ✓
- [ ] Log in → cookie is set → navigate to `/dashboard` → works ✓
- [ ] Manually delete the `session` cookie in DevTools → refresh `/dashboard` → redirects to login ✓
- [ ] Sign out → cookie cleared → navigate to `/dashboard` → redirects to login ✓
- [ ] Log in → navigate to `/auth/login` → redirects to `/dashboard` ✓
