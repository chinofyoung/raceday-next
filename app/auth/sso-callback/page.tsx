"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SSOCallbackPage() {
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTimedOut(true), 10_000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0f141a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {timedOut ? (
                    <>
                        <p className="text-slate-400 font-medium uppercase tracking-widest text-xs text-center">
                            Sign in is taking longer than expected
                        </p>
                        <Link
                            href="/auth/login"
                            className="px-4 py-2 border border-[#22c55e] text-[#22c55e] rounded-md text-xs font-medium uppercase tracking-widest hover:bg-[#22c55e] hover:text-[#0f141a] transition-colors"
                        >
                            Try again
                        </Link>
                    </>
                ) : (
                    <>
                        <div
                            className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"
                            aria-hidden="true"
                        />
                        <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">
                            Completing sign in...
                        </p>
                    </>
                )}
                <div id="clerk-captcha" />
            </div>
            <AuthenticateWithRedirectCallback />
        </div>
    );
}
