"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Download, QrCode, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export default function RunnerQRPage() {
    const { id: eventId } = useParams();
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
            // 1. Fetch Registration
            const q = query(
                collection(db, "registrations"),
                where("eventId", "==", eventId),
                where("userId", "==", user?.uid),
                where("status", "==", "paid")
            );
            const regSnap = await getDocs(q);

            if (!regSnap.empty) {
                const reg = regSnap.docs[0].data();
                setRegistration({ id: regSnap.docs[0].id, ...reg });

                // 2. Fetch Event Details
                const eventRef = doc(db, "events", eventId as string);
                const eventSnap = await getDoc(eventRef);
                if (eventSnap.exists()) {
                    setEvent(eventSnap.data());
                }
            } else {
                // No paid registration found
                router.push("/dashboard/events");
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

    const eventDate = event?.date && typeof event.date.toDate === 'function' ? event.date.toDate() : new Date(event?.date as string | number | Date);

    return (
        <PageWrapper className="pt-8 pb-24 max-w-2xl mx-auto space-y-12">
            <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-4 text-xs font-black uppercase tracking-widest italic transition-colors">
                <ArrowLeft size={16} /> Dashboard
            </Link>

            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Your <span className="text-primary">Race Pass</span>.</h1>
                <p className="text-text-muted font-medium italic text-sm">Present this QR code during race kit collection on event day.</p>
            </div>

            <Card className="p-10 bg-surface/40 border-white/10 flex flex-col items-center justify-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />

                <div className="text-center space-y-1 relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest text-primary italic">Bib Number</p>
                    <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">{registration?.raceNumber || "---"}</h2>
                </div>

                <div className="relative z-10 p-6 bg-white rounded-[2rem] shadow-2xl scale-110">
                    {registration?.qrCodeUrl ? (
                        <Image src={registration.qrCodeUrl} alt="Race QR" width={250} height={250} className="rounded-xl" />
                    ) : (
                        <div className="w-[250px] h-[250px] flex items-center justify-center text-red-500 font-bold italic underline">
                            QR LOAD ERROR
                        </div>
                    )}
                </div>

                <div className="w-full space-y-4 pt-6 relative z-10">
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                        <h4 className="text-sm font-black italic text-white uppercase tracking-tight">{event?.name}</h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase italic">
                                <Calendar size={14} className="text-primary" /> {format(eventDate, "MMMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase italic">
                                <MapPin size={14} className="text-cta" /> {event?.location.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase italic">
                                <Clock size={14} className="text-white/40" /> Category: {registration?.categoryId}
                            </div>
                        </div>
                    </div>

                    <Button className="w-full h-14 font-black italic uppercase tracking-widest gap-2" variant="outline" onClick={() => window.print()}>
                        <Download size={20} /> Save as PDF
                    </Button>
                </div>
            </Card>

            <div className="p-6 bg-cta/5 border border-cta/20 rounded-2xl flex gap-4">
                <QrCode className="text-cta shrink-0" size={24} />
                <p className="text-[10px] text-text-muted leading-relaxed font-bold italic uppercase tracking-wider">
                    IMPORTANT: Do not share your QR code with anyone. This is your official entry pass and can only be scanned once for kit collection.
                </p>
            </div>
        </PageWrapper>
    );
}
