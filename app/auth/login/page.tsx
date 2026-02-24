"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { LogIn, ChevronRight, Zap, Trophy, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { isNewUser } = await signInWithGoogle();
            const idToken = await auth.currentUser?.getIdToken();

            if (idToken) {
                const res = await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });

                if (!res.ok) {
                    console.error("Failed to create session:", await res.text());
                }
            }

            await refreshUser();

            const redirectTo = searchParams.get("redirect");
            if (isNewUser) {
                router.push("/dashboard/settings?setup=true");
            } else {
                router.push(redirectTo || "/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex bg-background overflow-hidden">
            {/* ── Left Hero Panel ── */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />

                {/* Diagonal racing stripes */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(135deg, transparent, transparent 40px, #f97316 40px, #f97316 42px)",
                    }}
                />

                {/* Large checkered flag accent — top-right corner */}
                <div className="absolute -top-20 -right-20 w-80 h-80 opacity-[0.06] rotate-12">
                    <svg viewBox="0 0 8 8" className="w-full h-full">
                        {[...Array(64)].map((_, i) => {
                            const x = i % 8;
                            const y = Math.floor(i / 8);
                            return (x + y) % 2 === 0 ? (
                                <rect key={i} x={x} y={y} width="1" height="1" fill="white" />
                            ) : null;
                        })}
                    </svg>
                </div>

                {/* Speed lines — emanating from center-left */}
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute left-0 h-[2px] bg-gradient-to-r from-primary/30 to-transparent animate-pulse"
                            style={{
                                top: `${25 + i * 10}%`,
                                width: `${50 + i * 8}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: `${2 + i * 0.5}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Glowing orb — bottom-left */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

                {/* Diagonal cut edge — right side */}
                <div
                    className="absolute top-0 right-0 w-32 h-full bg-background"
                    style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%, 60% 0)" }}
                />

                {/* Content overlay */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    {/* Top — Logo */}
                    <div>
                        <Image
                            src="/logo.png"
                            alt="RaceDay"
                            width={200}
                            height={50}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>

                    {/* Center — Hero text */}
                    <div className="space-y-6 max-w-lg">
                        <div className="flex items-center gap-2 text-primary">
                            <div className="w-8 h-[2px] bg-primary" />
                            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                                Race Management Platform
                            </span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-black italic uppercase leading-[0.95] tracking-tight text-text">
                            Every Second
                            <br />
                            <span className="text-primary">Counts</span>
                        </h1>
                        <p className="text-text-muted text-lg leading-relaxed max-w-sm">
                            Organize events, track results, and manage registrations — all from one command center.
                        </p>
                    </div>

                    {/* Bottom — Stats row */}
                    <div className="flex gap-10">
                        {[
                            { icon: Trophy, label: "Events Managed", value: "500+" },
                            { icon: Timer, label: "Avg Setup Time", value: "< 5 min" },
                            { icon: Zap, label: "Live Results", value: "Real-time" },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="space-y-1">
                                <div className="flex items-center gap-2 text-primary">
                                    <Icon size={14} strokeWidth={2.5} />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {label}
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-text">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Login Panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                {/* Subtle noise texture */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Corner accent — top-right */}
                <div className="absolute top-0 right-0 w-40 h-40 overflow-hidden opacity-10">
                    <div className="absolute top-6 right-6 w-[1px] h-20 bg-gradient-to-b from-primary to-transparent" />
                    <div className="absolute top-6 right-6 w-20 h-[1px] bg-gradient-to-l from-primary to-transparent" />
                </div>

                <div className="w-full max-w-sm relative z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <Image
                            src="/logo.png"
                            alt="RaceDay"
                            width={200}
                            height={50}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>

                    {/* Login card */}
                    <Card hover={false} className="p-8 sm:p-10 space-y-8 border-white/[0.06] bg-surface/40 backdrop-blur-md shadow-2xl">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary mb-4">
                                <div className="w-5 h-[2px] bg-primary" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary/80">
                                    Sign In
                                </span>
                            </div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tight text-text">
                                Welcome Back!
                            </h2>
                            <p className="text-text-muted text-sm leading-relaxed">
                                Sign in to manage your races and registrations.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>

                        {/* Google sign-in button */}
                        <div className="space-y-4">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full h-14 text-base font-bold uppercase italic tracking-wider gap-3 group"
                                onClick={handleLogin}
                                isLoading={loading}
                            >
                                {!loading && (
                                    <>
                                        <LogIn size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                                        <span className="flex-1 text-center text-sm">Continue with Google</span>
                                        <ChevronRight size={16} className="opacity-50 transition-transform duration-200 group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Legal text */}
                        <p className="text-center text-[11px] text-text-muted/60 leading-relaxed">
                            By continuing, you agree to our{" "}
                            <span className="text-text-muted hover:text-primary transition-colors cursor-pointer">
                                Terms of Service
                            </span>{" "}
                            and{" "}
                            <span className="text-text-muted hover:text-primary transition-colors cursor-pointer">
                                Privacy Policy
                            </span>
                            .
                        </p>
                    </Card>

                    {/* Bottom tagline */}
                    <p className="text-center text-[11px] text-text-muted/40 mt-8 uppercase tracking-[0.3em] font-medium">
                        Built for speed
                    </p>
                </div>
            </div>
        </div>
    );
}
