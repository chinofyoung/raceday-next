"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    const { isLoaded: isSignInLoaded, signIn } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawRedirect = searchParams.get("redirect") || "/dashboard";

    // Prevent open redirect: only allow relative paths starting with /,
    // block protocol-relative URLs and absolute URLs
    const redirectTo =
        rawRedirect.startsWith("/") &&
        !rawRedirect.startsWith("//") &&
        !rawRedirect.includes("://")
            ? rawRedirect
            : "/dashboard";

    const handleGoogleLogin = async () => {
        if (!isSignInLoaded || !isSignUpLoaded) return;
        setIsLoading(true);
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: redirectTo,
            });
        } catch (err) {
            console.error("Error signing in:", err);
            setTimeout(() => setIsLoading(false), 3000);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Full-bleed background image */}
            <Image
                src="/assets/ultra.png"
                alt="Ultra marathon runners on trail"
                fill
                className="object-cover"
                priority
                quality={85}
            />

            {/* Dark overlay (~70% opacity) */}
            <div className="absolute inset-0 bg-[#111827]/70" aria-hidden="true" />

            {/* Centered content column */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">

                {/* Frosted glass card */}
                <div className="w-full bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 sm:p-10">

                    {/* Logo */}
                    <div className="mb-8 pb-6 border-b border-white/[0.06]">
                        <Image
                            src="/logo.png"
                            alt="RaceDay"
                            width={160}
                            height={40}
                            className="h-8 w-auto"
                        />
                    </div>

                    {/* Section label */}
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                        Sign in
                    </p>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold tracking-tight text-text mb-2 leading-tight">
                        Welcome back
                    </h1>

                    {/* Subtitle */}
                    <p className="text-text-muted leading-relaxed mb-8">
                        Sign in to manage your races and registrations.
                    </p>

                    {/* Google CTA button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between gap-3 bg-cta hover:bg-cta/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150 text-white font-semibold px-5 py-3.5 rounded-lg cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            {/* Google multi-color "G" icon */}
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                className="shrink-0"
                            >
                                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                            <span>Continue with Google</span>
                        </div>

                        {isLoading ? (
                            <Loader2 size={18} className="shrink-0 animate-spin opacity-70" />
                        ) : (
                            <ChevronRight
                                size={18}
                                className="shrink-0 opacity-60 transition-transform duration-150 group-hover:translate-x-0.5"
                            />
                        )}
                    </button>

                    {/* Clerk CAPTCHA container */}
                    <div id="clerk-captcha" className="mt-4" />

                    {/* Terms / Privacy */}
                    <p className="mt-6 text-center text-xs text-text-muted/60 leading-relaxed">
                        By continuing, you agree to our{" "}
                        <Link
                            href="/terms"
                            className="text-text-muted hover:text-text transition-colors underline underline-offset-2"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/privacy"
                            className="text-text-muted hover:text-text transition-colors underline underline-offset-2"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>

                {/* Below-card tagline */}
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted/40 pointer-events-none select-none">
                    Built for speed
                </p>
            </div>
        </div>
    );
}
