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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <PageWrapper className="pt-12 pb-24 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-cta/10 rounded-full flex items-center justify-center mx-auto text-cta animate-bounce shadow-2xl shadow-cta/20">
                    <CheckCircle2 size={56} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Code Card */}
                <Card className="p-8 bg-surface/40 border-white/10 flex flex-col items-center justify-center space-y-8 relative overflow-hidden group transition-all hover:bg-surface/50">
                    <div className="absolute top-0 right-0 p-12 bg-cta/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cta/10 transition-colors" />

                    <div className="space-y-2 text-center relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Your Race Pass</p>
                        <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">
                            {registration?.status === "paid" ? `#${registration?.raceNumber}` : "GENERATING..."}
                        </h3>
                    </div>

                    <div className="relative z-10 p-4 bg-white rounded-3xl shadow-2xl scale-110 transition-transform hover:scale-125 duration-500">
                        {registration?.status === "paid" && registration?.qrCodeUrl ? (
                            <Image src={registration.qrCodeUrl} alt="Race QR Code" width={200} height={200} className="rounded-xl" />
                        ) : (
                            <div className="w-[200px] h-[200px] bg-white flex flex-col items-center justify-center text-cta gap-3">
                                <QrCode size={48} className="animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Assigning Bib...</p>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 w-full pt-4">
                        <Button
                            variant="outline"
                            className="w-full gap-2 font-black italic uppercase"
                            onClick={() => window.print()}
                            disabled={registration?.status !== "paid"}
                        >
                            <Download size={18} /> {registration?.status === "paid" ? "Download Pass" : "Waiting for Payment..."}
                        </Button>
                    </div>
                </Card>

                {/* Details Card */}
                <div className="space-y-6">
                    <Card className="p-8 bg-surface/30 border-white/5 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Registrant</p>
                            <h4 className="text-2xl font-black italic text-white uppercase">{registration?.participantInfo.name}</h4>
                            <p className="text-xs text-text-muted font-bold italic">{registration?.participantInfo.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Category</p>
                                <p className="text-sm font-black italic text-white uppercase">{registration?.categoryId}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Payment</p>
                                <Badge
                                    variant={registration?.status === "paid" ? "success" : "outline"}
                                    className={cn(
                                        "uppercase font-black border-none shadow-md",
                                        registration?.status === "paid" ? "bg-cta text-white" : "bg-white/10 text-white/40"
                                    )}
                                >
                                    {registration?.status === "paid" ? "Success" : registration?.status?.toUpperCase() || "PENDING"}
                                </Badge>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-3 text-text-muted text-xs font-bold italic">
                                <MapPin size={14} className="text-cta" /> {event?.location?.name || "Location TBD"}
                            </div>
                            <div className="flex items-center gap-3 text-text-muted text-xs font-bold italic">
                                <Calendar size={14} className="text-primary" /> {event?.date ? format(event.date.toDate(), "MMMM d, yyyy") : "Date TBD"}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-primary/5 border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Share2 size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black italic uppercase text-white">Bragging Rights</h4>
                                <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-wider">Show your friends you are in!</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary font-black italic uppercase italic">Share <ArrowRight size={14} className="ml-1" /></Button>
                    </Card>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-12">
                <Button className="flex-1 h-14 bg-cta hover:bg-cta-hover border-none font-black italic uppercase tracking-widest shadow-xl shadow-cta/20 group" asChild>
                    <Link href="/dashboard">
                        Go to Dashboard <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
                <Button variant="outline" className="flex-1 h-14 font-black italic uppercase tracking-widest" asChild>
                    <Link href={`/events/${eventId}`}>Back to Event Page</Link>
                </Button>
            </div>
        </PageWrapper>
    );
}
