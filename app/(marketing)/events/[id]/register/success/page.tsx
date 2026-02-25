"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Download, QrCode, ArrowRight, Share2, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function RegistrationSuccessPage() {
    const { id: eventId } = useParams();
    const searchParams = useSearchParams();
    const registrationId = searchParams.get("id");

    const [registration, setRegistration] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (registrationId) fetchRegistration();
    }, [registrationId]);

    const fetchRegistration = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "registrations", registrationId!);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setRegistration(data);

                // Fetch event details
                if (data.eventId) {
                    const eventSnap = await getDoc(doc(db, "events", data.eventId));
                    if (eventSnap.exists()) {
                        setEvent(eventSnap.data());
                    }
                }

                // If pending, sync immediately
                if (data.status === "pending") {
                    const syncRes = await fetch(`/api/payments/sync/${registrationId}`);
                    const syncData = await syncRes.json();
                    if (syncData.status === "paid") {
                        const updatedSnap = await getDoc(docRef);
                        setRegistration(updatedSnap.data());
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching registration:", error);
        } finally {
            setLoading(false);
        }
    };

    const categoryName = event?.categories?.find((c: any) => c.id === registration?.categoryId)?.name || registration?.categoryId;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <PageWrapper className="pt-12 pb-24 max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-cta/10 rounded-full flex items-center justify-center mx-auto text-cta animate-bounce shadow-2xl shadow-cta/20">
                    <CheckCircle2 size={46} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
                        Race <span className="text-cta">Confirmed</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium italic">
                        You&apos;re officially on the starting list! Check your details below.
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-10 max-w-2xl mx-auto w-full px-4">
                {/* ── MAIN TICKET CONTAINER ─────────────────────────── */}
                <div className="w-full relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {/* Decorative Blur Backgrounds */}
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-cta/10 rounded-full blur-[100px] -z-10" />
                    <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />

                    <div className="flex flex-col w-full bg-[#0A0D10]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">

                        {/* 1. Header Section: Event & Status */}
                        <div className="p-8 md:p-10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-20 bg-cta/5 rounded-full blur-3xl -mr-20 -mt-20" />

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cta/10 border border-cta/20 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cta italic">Official Entry confirmed</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-[0.9] max-w-md">
                                        {event?.name}
                                    </h2>
                                </div>

                                <div className="flex flex-col md:items-end gap-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Payment Status</p>
                                    <Badge
                                        className={cn(
                                            "uppercase font-black text-xs px-4 py-1.5 skew-x-[-12deg] border-none shadow-lg shadow-emerald-500/20",
                                            registration?.status === "paid" ? "bg-emerald-500 text-black" : "bg-amber-500 text-black"
                                        )}
                                    >
                                        <span className="skew-x-[12deg]">
                                            {registration?.status === "paid" ? "PAID / VERIFIED" : "PENDING"}
                                        </span>
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                        <Calendar size={10} className="text-cta" /> Date
                                    </p>
                                    <p className="text-sm font-bold text-white uppercase italic truncate">
                                        {event?.date ? format(event.date.toDate(), "MMM dd, yyyy") : "TBD"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                        <MapPin size={10} className="text-cta" /> Location
                                    </p>
                                    <p className="text-sm font-bold text-white uppercase italic truncate">
                                        {event?.location?.name || "TBD"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                        <QrCode size={10} className="text-cta" /> Category
                                    </p>
                                    <p className="text-sm font-bold text-white uppercase italic truncate">{categoryName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">Time</p>
                                    <p className="text-sm font-bold text-white uppercase italic truncate">
                                        {event?.startTime || "05:00 AM"}
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
                                <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] blur-2xl group-hover:bg-white/20 transition-all duration-500 scale-90" />
                                <div className="relative p-6 bg-white rounded-[2.5rem] shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)] transition-all duration-500 group-hover:scale-105 ring-1 ring-white/10">
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
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cta to-transparent animate-[scan_3s_ease-in-out_infinite] opacity-50 shadow-[0_0_10px_#00E5FF]" />
                                        </div>
                                    ) : (
                                        <div className="w-[220px] h-[220px] bg-white flex flex-col items-center justify-center text-cta gap-3">
                                            <QrCode size={64} className="animate-pulse" />
                                            <p className="text-[10px] font-black uppercase tracking-widest italic text-center px-4 leading-normal">
                                                Allocating Bib Number...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bib & Participant Info */}
                            <div className="flex-1 space-y-8 w-full">
                                <div className="space-y-3">
                                    <div className="inline-block px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-xl skew-x-[-12deg]">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic skew-x-[12deg] block">RACE NUMBER</span>
                                    </div>
                                    <h3 className="text-6xl md:text-6xl font-black italic text-white uppercase tracking-tightest leading-none">
                                        {registration?.status === "paid" ? registration?.raceNumber : "---"}
                                    </h3>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic mb-1">Athlete</p>
                                        <h4 className="text-2xl font-black italic text-white uppercase tracking-tight">{registration?.participantInfo.name}</h4>
                                        <p className="text-xs text-text-muted font-bold italic opacity-70">{registration?.participantInfo.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Footer Section: Action */}
                        <div className="p-8 md:p-10 bg-white/[0.02] border-t border-white/5 space-y-4 text-center">
                            <Button
                                variant="outline"
                                className="w-full h-16 gap-3 font-black italic uppercase text-white hover:bg-white/5 border-white/10 rounded-2xl group relative overflow-hidden active:scale-[0.98] transition-all"
                                onClick={() => window.print()}
                                disabled={registration?.status !== "paid"}
                            >
                                <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                {registration?.status === "paid" ? "Download Race Pass" : "Confirming Payment Status..."}
                            </Button>
                            <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-wider">
                                Required for race kit collection & mandatory equipment checking
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Bragging Rights Card ─────────────────────────── */}
                <Card className="w-full p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20 flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-all ring-1 ring-primary/20">
                            <Share2 size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black italic uppercase text-white tracking-tight">Athlete Shoutout</h4>
                            <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-wider">Broadcast your entry to the community</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary font-black italic uppercase hover:bg-primary/10 rounded-xl">
                        Share <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Card>
            </div>

            {/* ── FOOTER NAVIGATION ───────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-4 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 max-w-2xl mx-auto w-full">
                <Button className="flex-1 h-16 bg-cta hover:bg-cta-hover border-none font-black italic uppercase tracking-[0.1em] shadow-2xl shadow-cta/30 group rounded-2xl active:scale-[0.98] transition-all" asChild>
                    <Link href="/dashboard">
                        Go to Athlete Dashboard <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
                <Button variant="outline" className="flex-1 h-16 font-black italic uppercase tracking-[0.1em] border-white/10 text-white rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all" asChild>
                    <Link href={`/events/${eventId}`}>Event Details Page</Link>
                </Button>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
                .tracking-tightest { letter-spacing: -0.05em; }
            `}</style>
        </PageWrapper>
    );
}
