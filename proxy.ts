import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    // Proxy is intentionally kept minimal.
    // Route-level authentication is handled client-side via the (app) layout,
    // which checks Firebase Auth state and redirects unauthenticated users.
    // API routes that need auth verify the session cookie themselves.
    return NextResponse.next();
}

export const config = {
    matcher: [],
};
