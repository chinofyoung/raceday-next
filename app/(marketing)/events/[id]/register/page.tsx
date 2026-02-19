"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { RegistrationForm } from "@/components/forms/registration/RegistrationForm";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { isRegistrationClosed } from "@/lib/earlyBirdUtils";

export default function RegisterPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCategoryId = searchParams.get("category");

    const [event, setEvent] = useState<RaceEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "events", id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setEvent({ id: snap.id, ...snap.data() } as RaceEvent);
            }
        } catch (error) {
            console.error("Error fetching event:", error);
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
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase text-red-500 tracking-tighter">Registration Closed</h1>
                        <p className="text-lg text-text-muted font-medium italic">Sorry, registration for this event has ended.</p>
                    </div>
                    <div>
                        <Link href={`/events/${event.id}`} className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-full text-white font-black uppercase italic tracking-widest transition-all border border-white/5 hover:border-white/20 hover:scale-105">
                            <ArrowLeft size={16} /> Back to Event Details
                        </Link>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-24 space-y-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col gap-4">
                    <Link href={`/events/${id}`} className="text-text-muted text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors italic">
                        <ArrowLeft size={14} /> Back to Event Details
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                            Race <span className="text-primary">Registration</span>.
                        </h1>
                        <p className="text-lg text-text-muted font-medium italic">You are registering for: <span className="text-white font-black">{event.name}</span></p>
                    </div>
                </div>

                <div className="space-y-12">
                    <RegistrationForm event={event} initialCategoryId={initialCategoryId} />

                    {/* Why Register Box Below */}
                    <Card className="p-8 bg-surface/30 border-white/5 space-y-8 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                            <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Why register now?</h3>
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 max-w-sm">
                                <Info className="text-primary shrink-0" size={16} />
                                <p className="text-[10px] text-text-muted italic font-bold leading-relaxed uppercase">
                                    Your personal information is secured and will only be used for event-related communications.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-cta shrink-0 font-black italic transition-colors group-hover:bg-cta group-hover:text-white">01</div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Limited Slots</p>
                                    <p className="text-xs text-text-muted italic font-medium leading-relaxed">Secure your preferred category before slots run out.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-cta shrink-0 font-black italic transition-colors group-hover:bg-cta group-hover:text-white">02</div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Exclusives</p>
                                    <p className="text-xs text-text-muted italic font-medium leading-relaxed">Get exclusive race kits and finisher tokens.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-cta shrink-0 font-black italic transition-colors group-hover:bg-cta group-hover:text-white">03</div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Leaderboards</p>
                                    <p className="text-xs text-text-muted italic font-medium leading-relaxed">Join the official leaderboard on race day.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PageWrapper>
    );
}
