"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RaceEvent } from "@/types/event";
import { RegistrationForm } from "@/components/forms/registration/RegistrationForm";
import { ArrowLeft, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Card } from "@/components/ui/card";

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
import { isRegistrationClosed } from "@/lib/earlyBirdUtils";

export default function RegisterPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCategoryId = searchParams.get("category");

    const eventData = useQuery(api.events.getById, { id: id as Id<"events"> });
    const loading = eventData === undefined;
    const event = eventData ? { id: eventData._id, ...eventData } as any as RaceEvent : null;

    if (loading) {
        return (
            <PageWrapper className="pt-8 pb-24 space-y-12">
                <RegistrationFormSkeleton />
            </PageWrapper>
        );
    }

    if (!event) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Event not found</h1>
                    <Link href="/events" className="text-primary hover:underline">Back to Events</Link>
                </div>
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
        <PageWrapper className="pt-8 pb-24 space-y-12">
            <div className="w-full mx-auto space-y-8">
                <div className="flex flex-col gap-4">
                    <Link href={`/events/${id}`} className="text-text-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors">
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
                    <RegistrationForm event={event} initialCategoryId={initialCategoryId} />

                    {/* Why Register Box Below */}
                    <Card className="p-8 bg-surface/30 border-white/5 space-y-8 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                            <h3 className="text-xl font-bold tracking-wider text-white">Why register now?</h3>
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 max-w-sm">
                                <Info className="text-primary shrink-0" size={16} />
                                <p className="text-xs text-text-muted font-bold leading-relaxed uppercase">
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
