"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/_LegacyBadge";
import { Button } from "@/components/ui/button";
import { QrCode, Calendar, MapPin, Download, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RacePassPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const regId = searchParams.get("regId");

    const event = useQuery(api.events.getById, {
        id: id as Id<"events">
    });

    const registration = useQuery(api.registrations.getById, {
        id: regId as Id<"registrations">
    });

    const loading = event === undefined || registration === undefined;

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </PageWrapper>
        );
    }

    if (!event || !registration) {
        return (
            <PageWrapper className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h1 className="text-2xl font-black uppercase italic text-white">Pass Not Found</h1>
                <p className="text-text-muted italic">We couldn&apos;t find the entry pass you were looking for.</p>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </PageWrapper>
        );
    }

    const category = event.categories?.find(c => c.id === registration.categoryId);
    const participantInfo = registration.registrationData?.participantInfo || (registration as any).participantInfo;

    return (
        <PageWrapper className="w-full max-w-xl mx-auto pt-8 pb-24 px-4 space-y-10">
            <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                    Race <span className="text-cta">Pass</span>
                </h1>
                <p className="text-text-muted italic font-medium">Show this QR code at the event for kit collection.</p>
            </div>

            <div className="relative group overflow-hidden sm:overflow-visible">
                {/* Decorative backgrounds */}
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-cta/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />

                <div className="bg-[#0A0D10]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-8 pb-6 space-y-6">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black italic text-white uppercase tracking-tight leading-none">
                                    {event.name}
                                </h2>
                                <Badge variant="success" className="font-black italic uppercase px-3 text-[10px]">
                                    Confirmed Entry
                                </Badge>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic mb-1">Race Number</p>
                                <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
                                    {registration.raceNumber || "---"}
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                    <Calendar size={10} className="text-cta" /> Date
                                </p>
                                <p className="text-sm font-bold text-white uppercase italic truncate">
                                    {format(event.date, "MMM dd, yyyy")}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                    <MapPin size={10} className="text-cta" /> Location
                                </p>
                                <p className="text-sm font-bold text-white uppercase italic truncate">
                                    {event.location?.name || "TBD"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                    <QrCode size={10} className="text-cta" /> Category
                                </p>
                                <p className="text-sm font-bold text-white uppercase italic truncate">{category?.name || registration.categoryId}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                    <Package size={10} className="text-cta" /> Gun Time
                                </p>
                                <p className="text-sm font-bold text-white uppercase italic truncate">
                                    {category?.gunStartTime || "TBD"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative h-px w-full">
                        <div className="absolute left-[-16px] top-[-16px] w-8 h-8 rounded-full bg-background border-r border-white/10 z-20" />
                        <div className="absolute right-[-16px] top-[-16px] w-8 h-8 rounded-full bg-background border-l border-white/10 z-20" />
                        <div className="w-full h-full border-t border-dashed border-white/20 relative z-10" />
                    </div>

                    {/* QR Section */}
                    <div className="p-8 md:p-12 flex flex-col items-center gap-8">
                        <div className="relative group shrink-0">
                            <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] blur-2xl group-hover:bg-white/20 transition-all duration-500 scale-90" />
                            <div className="relative p-6 bg-white rounded-[2.5rem] shadow-xl transition-all duration-500 group-hover:scale-105">
                                {registration.qrCodeUrl ? (
                                    <div className="relative overflow-hidden rounded-2xl">
                                        <Image
                                            src={registration.qrCodeUrl}
                                            alt="Race QR Code"
                                            width={220}
                                            height={220}
                                            className="rounded-2xl"
                                        />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cta to-transparent animate-[scan_3s_ease-in-out_infinite] opacity-50 shadow-[0_0_10px_#00E5FF]" />
                                    </div>
                                ) : (
                                    <div className="w-[220px] h-[220px] bg-white flex flex-col items-center justify-center text-cta gap-3">
                                        <QrCode size={64} className="animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-widest italic text-center px-4 leading-normal">
                                            Loading Pass...
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Athlete Info</p>
                            <h4 className="text-2xl font-black italic text-white uppercase tracking-tight">{participantInfo?.name}</h4>
                            <p className="text-xs text-text-muted font-bold italic opacity-70">{participantInfo?.email}</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-white/[0.02] border-t border-white/5 space-y-4">
                        <Button
                            variant="outline"
                            className="w-full h-14 gap-3 font-black italic uppercase text-white hover:bg-white/5 border-white/10 rounded-2xl group transition-all"
                            onClick={() => window.print()}
                        >
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                            Download Race Pass
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-cta/5 border border-cta/20 rounded-2xl flex gap-4">
                <QrCode className="text-cta shrink-0" size={24} />
                <p className="text-[10px] text-text-muted leading-relaxed font-bold italic uppercase tracking-wider">
                    IMPORTANT: Do not share your QR code. This is your official entry pass and can only be scanned once for kit collection.
                </p>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
            `}</style>
        </PageWrapper>
    );
}
