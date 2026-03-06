import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest, ev: any) {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    return clerkMiddleware()(req, ev);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
