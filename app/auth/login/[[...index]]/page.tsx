"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogIn, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const { isLoaded: isSignInLoaded, signIn } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/dashboard";

    const handleGoogleLogin = async () => {
        if (!isSignInLoaded || !isSignUpLoaded) return;
        setIsLoading(true);
        try {
            // Clerk's authenticateWithRedirect handles both sign-in and sign-up with the same strategy
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/dashboard", // Fallback if redirectUrlComplete fails
                redirectUrlComplete: redirectTo,
            });
        } catch (err) {
            console.error("Error signing in:", err);
            setIsLoading(true); // Keep it true or handle error UI
            setTimeout(() => setIsLoading(false), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f141a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accent - subtle depth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#0f141a]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[480px] relative z-10 flex flex-col items-center">
                {/* Main Card */}
                <div className="w-full bg-[#1e252e] rounded-[48px] p-10 sm:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/5">
                    {/* Section Header: Line + SIGN IN */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-[3px] bg-[#f97316] rounded-full" />
                        <span className="text-[#f97316] text-[14px] font-black tracking-[0.3em] uppercase">
                            Sign In
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-white text-2xl md:text-4xl font-black italic uppercase tracking-tight mb-4 leading-[0.85] font-heading">
                        Welcome Back!
                    </h1>

                    {/* Subtitle */}
                    <p className="text-slate-400 text-xl mb-14 font-medium leading-tight max-w-[320px]">
                        Sign in to manage your races and registrations.
                    </p>

                    {/* Google Action Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-20 bg-[#22c55e] hover:bg-[#1eb054] active:scale-[0.98] transition-all duration-300 rounded-[20px] flex items-center justify-between px-8 group disabled:opacity-70 cursor-pointer shadow-[0_12px_40px_rgb(34,197,94,0.25)] hover:shadow-[0_16px_48px_rgb(34,197,94,0.35)]"
                    >
                        <div className="flex items-center gap-5">
                            <LogIn className="text-white w-8 h-8" strokeWidth={2.5} />
                            <span className="text-white text-lg md:text-2xl font-black italic uppercase tracking-tight font-heading">
                                Continue with Google
                            </span>
                        </div>
                        {isLoading ? (
                            <Loader2 className="text-white/40 w-8 h-8 animate-spin" strokeWidth={3} />
                        ) : (
                            <ChevronRight className="text-white/40 w-8 h-8 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                        )}
                    </button>
                </div>

                {/* Privacy Footer */}
                <div className="mt-10 px-6 max-w-[400px]">
                    <p className="text-center text-[#94a3b8]/50 text-[14px] leading-relaxed font-medium">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="text-slate-200 hover:text-white transition-colors font-bold">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-slate-200 hover:text-white transition-colors font-bold">Privacy Policy</Link>.
                    </p>
                </div>

                {/* Built for Speed Tagline */}
                <div className="mt-16 text-slate-700 text-[13px] font-black tracking-[0.5em] uppercase pointer-events-none font-body">
                    Built for Speed
                </div>
            </div>
        </div>
    );
}
