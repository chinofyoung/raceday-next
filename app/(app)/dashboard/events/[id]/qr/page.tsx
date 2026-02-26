"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Download, QrCode, MapPin, Calendar, Clock, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RunnerQRPage() {
    const { id: eventId } = useParams();
    const searchParams = useSearchParams();
    const regId = searchParams.get("regId");
    const { user } = useAuth();
    const router = useRouter();

    const [registration, setRegistration] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && eventId) {
            fetchData();
        }
    }, [user, eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let registrationData: any = null;

            if (regId) {
                // If regId is provided, fetch specifically that registration
                const regRef = doc(db, "registrations", regId);
                const regSnap = await getDoc(regRef);
                if (regSnap.exists()) {
                    const data = regSnap.data();
                    // Basic security check: ensure it belongs to the user and is for the correct event
                    if (data.userId === user?.uid && data.eventId === eventId && data.status === "paid") {
                        registrationData = { id: regSnap.id, ...data };
                    }
                }
            }

            if (!registrationData) {
                // Fallback to existing logic: Fetch first paid registration for this user/event
                const q = query(
                    collection(db, "registrations"),
                    where("eventId", "==", eventId),
                    where("userId", "==", user?.uid),
                    where("status", "==", "paid")
                );
                const regSnap = await getDocs(q);

                if (!regSnap.empty) {
                    const reg = regSnap.docs[0].data();
                    registrationData = { id: regSnap.docs[0].id, ...reg };
                }
            }

            if (registrationData) {
                setRegistration(registrationData);

                // 2. Fetch Event Details
                const eventRef = doc(db, "events", eventId as string);
                const eventSnap = await getDoc(eventRef);
                if (eventSnap.exists()) {
                    setEvent(eventSnap.data());
                }
            } else {
                // No paid registration found
                router.push("/dashboard");
            }
        } catch (e) {
            console.error("Error fetching QR data:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const parsedDate = event?.date ? (typeof event.date.toDate === 'function' ? event.date.toDate() : new Date(event.date as string | number | Date)) : null;
    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
    const categoryName = event?.categories?.find((c: any) => (c.id || "0") === registration?.categoryId)?.name || registration?.categoryId;

    return (
        <PageWrapper className="pt-8 pb-24 max-w-2xl mx-auto space-y-12">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-4 text-xs font-black uppercase tracking-widest italic transition-colors">
                <ArrowLeft size={16} /> Dashboard
            </Link>

            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Your <span className="text-primary">Race Pass</span>.</h1>
                <p className="text-text-muted font-medium italic text-sm">Present this QR code during race kit collection on event day.</p>
            </div>

            {/* MAIN TICKET CONTAINER (Mirrored from Success Page) */}
            <div className="w-full relative animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cta italic">Event Pass</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-[0.9] max-w-md">
                                    {event?.name}
                                </h2>
                            </div>

                            <div className="flex flex-col md:items-end gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Bib Number</p>
                                <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
                                    {registration?.raceNumber || "---"}
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                    <Calendar size={10} className="text-cta" /> Date
                                </p>
                                <p className="text-sm font-bold text-white uppercase italic truncate">
                                    {isValidDate ? format(parsedDate!, "MMM dd, yyyy") : "TBD"}
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

                    {/* Perforated Divider */}
                    <div className="relative h-px w-full">
                        <div className="absolute left-[-16px] top-[-16px] w-8 h-8 rounded-full bg-background border-r border-white/10 z-20" />
                        <div className="absolute right-[-16px] top-[-16px] w-8 h-8 rounded-full bg-background border-l border-white/10 z-20" />
                        <div className="w-full h-full border-t border-dashed border-white/20 relative z-10" />
                    </div>

                    {/* 2. Middle Section: The Main Pass */}
                    <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                        {/* QR CODE Visual */}
                        <div className="relative group shrink-0 mx-auto">
                            <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] blur-2xl group-hover:bg-white/20 transition-all duration-500 scale-90" />
                            <div className="relative p-6 bg-white rounded-[2.5rem] shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)] transition-all duration-500 group-hover:scale-105 ring-1 ring-white/10">
                                {registration?.qrCodeUrl ? (
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

                        {/* Participant Info */}
                        <div className="flex-1 space-y-8 w-full">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic mb-1">Athlete</p>
                                    <h4 className="text-3xl font-black italic text-white uppercase tracking-tight">{registration?.participantInfo?.name}</h4>
                                    <p className="text-xs text-text-muted font-bold italic opacity-70">{registration?.participantInfo?.email}</p>
                                </div>
                                {registration?.isProxy && (
                                    <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-black italic uppercase text-[10px] px-3">
                                        Proxy Entry
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Footer Section: Action */}
                    <div className="p-8 md:p-10 bg-white/[0.02] border-t border-white/5 space-y-4 text-center">
                        <Button
                            variant="outline"
                            className="w-full h-16 gap-3 font-black italic uppercase text-white hover:bg-white/5 border-white/10 rounded-2xl group relative overflow-hidden active:scale-[0.98] transition-all"
                            onClick={() => window.print()}
                        >
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                            Download Race Pass
                        </Button>
                        <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-wider">
                            Required for race kit collection & mandatory equipment checking
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-cta/5 border border-cta/20 rounded-2xl flex gap-4">
                <QrCode className="text-cta shrink-0" size={24} />
                <p className="text-[10px] text-text-muted leading-relaxed font-bold italic uppercase tracking-wider">
                    IMPORTANT: Do not share your QR code with anyone. This is your official entry pass and can only be scanned once for kit collection.
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
