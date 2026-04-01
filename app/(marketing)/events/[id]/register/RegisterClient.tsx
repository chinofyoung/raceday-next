"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { RegistrationEvent } from "@/types/event";
import { RegistrationForm } from "@/components/forms/registration/RegistrationForm";
import { ArrowLeft, Info, LogIn, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { isRegistrationClosed } from "@/lib/earlyBirdUtils";

function RegistrationFormSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="bg-surface/30 border border-white/5 rounded-2xl p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                </div>
                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                </div>
                <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-11 w-full rounded-xl" /></div>
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}

function LoginGate({ eventName }: { eventName: string }) {
    const { openSignIn } = useClerk();
    const pathname = usePathname();

    const handleLogin = () => {
        openSignIn({
            afterSignInUrl: pathname,
            afterSignUpUrl: pathname,
        });
    };

    return (
        <div className="flex items-center justify-center py-16">
            <Card className="max-w-md w-full p-10 space-y-8 bg-surface/50 border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShieldCheck size={32} className="text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Sign in to <span className="text-primary">register</span>
                    </h2>
                    <p className="text-sm text-text-muted font-medium leading-relaxed">
                        Please sign in or create an account to register for <span className="text-white font-semibold">{eventName}</span>. Your profile information will be used to pre-fill the registration form.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-14 text-lg font-bold tracking-wider gap-3 bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20"
                    onClick={handleLogin}
                >
                    <LogIn size={20} />
                    Sign in to continue
                </Button>

                <p className="text-center text-xs text-text-muted font-semibold uppercase tracking-wider">
                    New here? You can create an account during sign in
                </p>
            </Card>
        </div>
    );
}

interface RegisterClientProps {
    event: RegistrationEvent;
    initialCategoryId: string | null;
}

export function RegisterClient({ event, initialCategoryId }: RegisterClientProps) {
    const { user, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <PageWrapper className="pt-8 space-y-12">
                <RegistrationFormSkeleton />
            </PageWrapper>
        );
    }

    if (isRegistrationClosed(event)) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-bold text-red-500 tracking-tight">Registration Closed</h1>
                        <p className="text-lg text-text-muted font-medium">Sorry, registration for this event has ended.</p>
                    </div>
                    <div>
                        <Link href={`/events/${event.id}`} className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-full text-white font-semibold tracking-wider transition-all border border-white/5 hover:border-white/20 hover:scale-105">
                            <ArrowLeft size={16} /> Back to Event Details
                        </Link>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 space-y-12">
            <div className="w-full mx-auto space-y-8">
                <div className="flex flex-col gap-4">
                    <Link href={`/events/${event.id}`} className="text-text-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors">
                        <ArrowLeft size={14} /> Back to Event Details
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                            Race <span className="text-primary">Registration</span>.
                        </h1>
                        <p className="text-lg text-text-muted font-medium">You are registering for: <span className="text-white font-bold">{event.name}</span></p>
                    </div>
                </div>

                <div className="space-y-12">
                    {!user ? (
                        <LoginGate eventName={event.name} />
                    ) : (
                        <RegistrationForm event={event} initialCategoryId={initialCategoryId} />
                    )}

                    {/* Why Register Box Below */}
                    <Card className="p-8 bg-surface/30 border-white/5 space-y-8 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                            <h3 className="text-xl font-bold tracking-wider text-white">Why register now?</h3>
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 max-w-sm">
                                <Info className="text-primary shrink-0" size={16} />
                                <p className="text-xs text-text-muted font-semibold leading-relaxed uppercase tracking-wider">
                                    Your personal information is secured and will only be used for event-related communications.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-cta shrink-0 font-bold transition-colors group-hover:bg-cta group-hover:text-white">01</div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-primary tracking-wider">Limited Slots</p>
                                    <p className="text-xs text-text-muted font-medium leading-relaxed">Secure your preferred category before slots run out.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-cta shrink-0 font-bold transition-colors group-hover:bg-cta group-hover:text-white">02</div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-primary tracking-wider">Exclusives</p>
                                    <p className="text-xs text-text-muted font-medium leading-relaxed">Get exclusive race kits and finisher tokens.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-cta shrink-0 font-bold transition-colors group-hover:bg-cta group-hover:text-white">03</div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-primary tracking-wider">Leaderboards</p>
                                    <p className="text-xs text-text-muted font-medium leading-relaxed">Join the official leaderboard on race day.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PageWrapper>
    );
}
