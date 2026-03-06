"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
    return (
        <div className="min-h-screen bg-[#0f141a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div
                    className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                />
                <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">
                    Completing sign in...
                </p>
                <div id="clerk-captcha" />
            </div>
            <AuthenticateWithRedirectCallback />
        </div>
    );
}
