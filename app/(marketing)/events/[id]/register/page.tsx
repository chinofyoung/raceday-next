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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3">
                        <RegistrationForm event={event} initialCategoryId={initialCategoryId} />
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-surface/50 border-white/5 space-y-6">
                            <h3 className="text-sm font-black uppercase italic tracking-widest text-white border-b border-white/5 pb-3">Why register now?</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-xs text-text-muted italic font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cta mt-1.5 shrink-0" />
                                    Secure your preferred category before slots run out.
                                </li>
                                <li className="flex gap-3 text-xs text-text-muted italic font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cta mt-1.5 shrink-0" />
                                    Get exclusive race kits and finisher tokens.
                                </li>
                                <li className="flex gap-3 text-xs text-text-muted italic font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cta mt-1.5 shrink-0" />
                                    Join the official leaderboard on race day.
                                </li>
                            </ul>
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                                <Info className="text-primary shrink-0" size={16} />
                                <p className="text-[10px] text-text-muted italic font-bold leading-relaxed uppercase">
                                    Your personal information is secured and will only be used for event-related communications.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
