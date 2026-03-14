"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Download, QrCode, ArrowRight, MapPin, Calendar } from "lucide-react";

function RegistrationSuccessSkeleton() {
    return (
        <div className="flex flex-col items-center space-y-8">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2 text-center">
                <Skeleton className="h-9 w-64 mx-auto" />
                <Skeleton className="h-5 w-48 mx-auto" />
            </div>
            <div className="w-full max-w-lg rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-px flex-1" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                </div>
                <div className="p-6 flex gap-6 items-start">
                    <Skeleton className="w-[220px] h-[220px] rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
            <div className="w-full max-w-lg bg-surface/30 border border-white/5 rounded-2xl p-6 space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-10 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function RegistrationSuccessPage() {
    const { id: eventId } = useParams();
    const searchParams = useSearchParams();
    const registrationId = searchParams.get("id");

    const registration = useQuery(api.registrations.getById, {
        id: registrationId as Id<"registrations">
    });

    const event = useQuery(api.events.getById, {
        id: (registration?.eventId || eventId) as Id<"events">
    });

    const loading = registration === undefined || event === undefined;

    const [syncAttempts, setSyncAttempts] = useState(0);
    const MAX_SYNC_ATTEMPTS = 60; // 3 minutes at 3s intervals
    const SLOW_SYNC_THRESHOLD = 20; // ~60 seconds

    useEffect(() => {
        if (!registrationId || registration?.status !== "pending") return;

        const interval = setInterval(async () => {
            setSyncAttempts((prev) => {
                if (prev >= MAX_SYNC_ATTEMPTS) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
            await fetch(`/api/payments/sync/${registrationId}`);
        }, 3000);

        return () => clearInterval(interval);
    }, [registrationId, registration?.status]);

    const categoryName = (event?.categories as any[])?.find((c: any) => c.id === registration?.categoryId)?.name || registration?.categoryId;

    if (loading) {
        return (
            <PageWrapper className="pt-12 max-w-7xl mx-auto space-y-12">
                <RegistrationSuccessSkeleton />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-12 max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-cta/10 rounded-full flex items-center justify-center mx-auto text-cta animate-bounce">
                    <CheckCircle2 size={46} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                        Race <span className="text-cta">Confirmed</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium">
                        You&apos;re officially on the starting list! Check your details below.
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-10 max-w-2xl mx-auto w-full px-4">
                {/* ── MAIN TICKET CONTAINER ─────────────────────────── */}
                <div className="w-full relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {/* Decorative Blur Backgrounds */}
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-cta/8 rounded-full blur-[100px] -z-10" />
                    <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/8 rounded-full blur-[100px] -z-10" />

                    <div className="flex flex-col w-full bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">

                        {/* 1. Header Section: Event & Status */}
                        <div className="p-8 md:p-10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-20 bg-cta/5 rounded-full blur-3xl -mr-20 -mt-20" />

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cta/10 border border-cta/20 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-cta">Official Entry confirmed</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[0.9] max-w-md">
                                        {event?.name}
                                    </h2>
                                </div>

                                <div className="flex flex-col md:items-start gap-2 shrink-0">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Payment Status</p>
                                    <Badge
                                        className={cn(
                                            "uppercase font-semibold text-xs px-4 py-1.5 border-none shadow-lg shadow-cta/20",
                                            registration?.status === "paid" ? "bg-cta text-black" : "bg-amber-500 text-black"
                                        )}
                                    >
                                        {registration?.status === "paid" ? "PAID" : "PENDING"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                                        <Calendar size={14} className="text-cta" /> Date
                                    </p>
                                    <p className="text-sm font-bold text-white truncate">
                                        {event?.date ? format(event.date, "MMM dd, yyyy") : "TBD"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                                        <MapPin size={14} className="text-cta" /> Location
                                    </p>
                                    <p className="text-sm font-bold text-white truncate">
                                        {event?.location?.name || "TBD"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                                        <QrCode size={14} className="text-cta" /> Category
                                    </p>
                                    <p className="text-sm font-bold text-white truncate">{categoryName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Gun Time</p>
                                    <p className="text-sm font-bold text-white truncate">
                                        {(event?.categories as any[])?.find(c => c.id === registration?.categoryId)?.gunStartTime || "TBD"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Perforated Divider ────────────────────────── */}
                        <div className="relative h-px w-full">
                            <div className="absolute left-[-16px] top-[-16px] w-8 h-8 rounded-full bg-background border-r border-white/10 z-20" />
                            <div className="absolute right-[-16px] top-[-16px] w-8 h-8 rounded-full bg-background border-l border-white/10 z-20" />
                            <div className="w-full h-full border-t border-dashed border-white/20 relative z-10" />
                        </div>

                        {/* 2. Middle Section: The Main Pass */}
                        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">

                            {/* QR CODE Visual */}
                            <div className="relative group shrink-0">
                                <div className="absolute inset-0 bg-white/8 rounded-2xl blur-2xl transition-all duration-500 scale-90" />
                                <div className="relative p-6 bg-white rounded-2xl shadow-lg transition-all duration-500 ring-1 ring-white/10 group-hover:ring-white/20">
                                    {registration?.status === "paid" && registration?.qrCodeUrl ? (
                                        <div className="relative overflow-hidden rounded-2xl">
                                            <Image
                                                src={registration.qrCodeUrl}
                                                alt="Race QR Code"
                                                width={220}
                                                height={220}
                                                className="rounded-2xl"
                                            />
                                            {/* Scanning Line Animation */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cta to-transparent animate-[scan_3s_ease-in-out_infinite] opacity-50 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        </div>
                                    ) : (
                                        <div className="w-[220px] h-[220px] bg-white flex flex-col items-center justify-center text-cta gap-3">
                                            <QrCode size={64} className="animate-pulse" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-center px-4 leading-normal">
                                                Allocating Bib Number...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bib & Participant Info */}
                            <div className="flex-1 space-y-8 w-full">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/8 border border-primary/12 rounded-full">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Race number</span>
                                    </div>
                                    <h3 className="text-6xl md:text-6xl font-bold text-white tracking-tight leading-none">
                                        {registration?.status === "paid" ? registration?.raceNumber : "---"}
                                    </h3>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Athlete</p>
                                        <h4 className="text-2xl font-bold text-white tracking-tight">{registration?.registrationData?.participantInfo?.name}</h4>
                                        <p className="text-xs text-text-muted font-medium">{registration?.registrationData?.participantInfo?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Footer Section: Action */}
                        <div className="p-8 md:p-10 bg-white/[0.02] border-t border-white/5 space-y-4 text-center">
                            <Button
                                variant="outline"
                                className="w-full h-14 gap-3 font-semibold text-text hover:bg-white/3 border border-white/12 rounded-lg group relative overflow-hidden active:scale-[0.98] transition-all"
                                onClick={() => window.print()}
                                disabled={registration?.status !== "paid"}
                            >
                                <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                {registration?.status === "paid" ? "Download Race Pass" : "Confirming Payment Status..."}
                            </Button>
                            <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                                Required for race kit collection & mandatory equipment checking
                            </p>
                            {registration?.status === "pending" && syncAttempts >= SLOW_SYNC_THRESHOLD && (
                                <p className="text-xs text-amber-400 font-semibold mt-2">
                                    Payment verification is taking longer than expected. Please refresh the page.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* ── FOOTER NAVIGATION ───────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-4 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 max-w-2xl mx-auto w-full">
                <Button className="flex-1 h-14 bg-cta hover:bg-cta/90 border-none font-semibold px-8 py-3 rounded-lg group active:scale-[0.98] transition-all" asChild>
                    <Link href="/dashboard">
                        Go to athlete dashboard <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
                <Button variant="outline" className="flex-1 h-14 font-medium px-8 py-3 border border-white/12 text-text rounded-lg hover:bg-white/3 active:scale-[0.98] transition-all" asChild>
                    <Link href={`/events/${eventId}`}>Event details page</Link>
                </Button>
            </div>

        </PageWrapper>
    );
}
