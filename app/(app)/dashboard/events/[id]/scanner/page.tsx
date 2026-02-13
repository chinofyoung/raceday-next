"use client";

import { useEffect, useState, useRef } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Camera, Scan, ShieldCheck, XCircle,
    CheckCircle2, AlertTriangle, User, Shirt, Hash
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { cn } from "@/lib/utils";

export default function EventScannerPage() {
    const { id: eventId } = useParams();
    const [scanResult, setScanResult] = useState<any>(null);
    const [registration, setRegistration] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        };
    }, []);

    async function onScanSuccess(decodedText: string) {
        try {
            const data = JSON.parse(decodedText);
            if (data.registrationId && data.eventId === eventId) {
                setScanResult(data);
                fetchParticipant(data.registrationId);
                // Pause scanner or stop it
                if (scannerRef.current) scannerRef.current.pause();
            } else {
                alert("Invalid QR code for this event!");
            }
        } catch (e) {
            console.error("QR Parse Error:", e);
        }
    }

    function onScanFailure(error: any) {
        // Just consume
    }

    const fetchParticipant = async (regId: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, "registrations", regId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setRegistration({ id: snap.id, ...snap.data() });
            }
        } catch (e) {
            console.error("Error fetching participant:", e);
        } finally {
            setLoading(false);
        }
    };

    const markAsClaimed = async () => {
        if (!registration) return;
        setIsUpdating(true);
        try {
            const docRef = doc(db, "registrations", registration.id);
            await updateDoc(docRef, {
                raceKitClaimed: true,
                raceKitClaimedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setRegistration({ ...registration, raceKitClaimed: true });
        } catch (e) {
            console.error("Error updating claim status:", e);
        } finally {
            setIsUpdating(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setRegistration(null);
        if (scannerRef.current) scannerRef.current.resume();
    };

    return (
        <PageWrapper className="pt-8 pb-24 max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                        <Camera size={14} /> LIVE Scanner Mode
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                        Race Kit <span className="text-cta">Fulfillment</span>.
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-surface/50 border border-white/5 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cta/10 flex items-center justify-center text-cta">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-text-muted italic">Total Claimed</p>
                            <p className="text-xl font-black italic text-white leading-none tracking-tighter">1,248 / 2,000</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Scanner View */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-4 bg-black border-white/10 overflow-hidden relative group">
                        <div id="reader" className="w-full aspect-square bg-surface/20 rounded-xl overflow-hidden" />
                        {!scanResult && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Scan className="text-primary opacity-20 animate-ping" size={120} />
                            </div>
                        )}
                    </Card>
                    <div className="p-6 bg-surface/30 border border-dashed border-white/10 rounded-2xl text-center space-y-2">
                        <p className="text-xs text-text-muted italic font-medium">Position the runner&apos;s QR code within the frame to automatically scan.</p>
                    </div>
                </div>

                {/* Result View */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="h-full flex items-center justify-center py-20">
                            <Scan className="animate-spin text-primary" size={48} />
                        </div>
                    ) : registration ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Card className={cn(
                                "p-8 border-2 relative overflow-hidden",
                                registration.raceKitClaimed ? "bg-cta/5 border-cta/20" : "bg-primary/5 border-primary/20"
                            )}>
                                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Participant</p>
                                            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">{registration.participantInfo.name}</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase italic px-3 py-1 bg-surface rounded-lg">
                                                <Hash size={14} className="text-primary" /> {registration.raceNumber}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase italic px-3 py-1 bg-surface rounded-lg">
                                                <User size={14} className="text-cta" /> {registration.categoryId}
                                            </div>
                                        </div>
                                    </div>
                                    {registration.raceKitClaimed ? (
                                        <div className="text-cta flex flex-col items-center gap-1">
                                            <CheckCircle2 size={40} />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Claimed</span>
                                        </div>
                                    ) : (
                                        <div className="text-primary flex flex-col items-center gap-1">
                                            <AlertTriangle size={40} className="animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Unclaimed</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10 relative z-10">
                                    <div className="space-y-3 p-4 bg-surface/40 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary italic">
                                            <Shirt size={14} /> T-Shirt Size
                                        </div>
                                        <p className="text-2xl font-black italic text-white">{registration.participantInfo.tShirtSize || "N/A"}</p>
                                    </div>
                                    <div className="space-y-3 p-4 bg-surface/40 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-cta italic">
                                            <Shirt size={14} /> Singlet Size
                                        </div>
                                        <p className="text-2xl font-black italic text-white">{registration.participantInfo.singletSize || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4 relative z-10">
                                    {!registration.raceKitClaimed ? (
                                        <Button
                                            className="w-full h-16 bg-cta hover:bg-cta-hover border-none text-xl font-black italic uppercase tracking-widest shadow-2xl shadow-cta/20"
                                            onClick={markAsClaimed}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? "Confirming..." : "Confirm & Mark Claimed"}
                                        </Button>
                                    ) : (
                                        <div className="p-4 bg-cta/10 border border-cta/20 rounded-2xl text-center">
                                            <p className="text-sm font-black italic text-cta uppercase">Success — Already Collected</p>
                                            <p className="text-[10px] text-cta/70 italic font-bold">Claimed on: {new Date(registration.raceKitClaimedAt?.seconds * 1000).toLocaleString()}</p>
                                        </div>
                                    )}
                                    <Button variant="ghost" className="w-full text-text-muted font-black italic uppercase" onClick={resetScanner}>
                                        <Scan size={18} className="mr-2" /> Scan Next Participant
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 text-center py-20 border-4 border-dashed border-white/5 rounded-[3rem]">
                            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-text-muted">
                                <Scan size={48} className="opacity-20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic uppercase text-white">Ready to Scan</h3>
                                <p className="text-text-muted text-sm max-w-xs mx-auto italic font-medium px-4">
                                    Awaiting runner identity. Scanned details will appear here instantly.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
