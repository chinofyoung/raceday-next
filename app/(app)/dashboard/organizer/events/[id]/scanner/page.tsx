"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/_LegacyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/_LegacyBadge";
import {
    Camera, Scan, ShieldCheck, XCircle,
    CheckCircle2, AlertTriangle, User, Shirt, Hash, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";

const QRScanner = dynamic(
    () => import("@/components/shared/QRScannerWrapper"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full aspect-square bg-black/40 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        ),
    }
);
import { cn } from "@/lib/utils";

export default function EventScannerPage() {
    const { id: eventId } = useParams();
    const [scanResult, setScanResult] = useState<any>(null);
    const [registrationId, setRegistrationId] = useState<Id<"registrations"> | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt">("prompt");
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef<any>(null);
    const lastScannedRef = useRef<string | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const registrationUiRef = useRef<HTMLDivElement>(null);

    const stats = useQuery(api.registrations.getEventFulfillmentStats, { eventId: eventId as Id<"events"> }) || { total: 0, claimed: 0 };
    const registration = useQuery(api.registrations.getById, registrationId ? { id: registrationId } : "skip" as any) as any;
    const markClaimedMutation = useMutation(api.registrations.markAsClaimed);

    useEffect(() => {
        if (registration && registrationUiRef.current) {
            registrationUiRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [registration]);

    const onScanSuccess = useCallback(async (decodedText: string) => {
        const now = Date.now();
        if (decodedText === lastScannedRef.current && (now - lastScanTimeRef.current < 2000)) return;
        if (scanResult && decodedText === lastScannedRef.current) return;

        lastScannedRef.current = decodedText;
        lastScanTimeRef.current = now;

        try {
            const data = JSON.parse(decodedText);
            const scannedEventId = String(data.eventId || "").trim();
            const currentEventId = String(eventId || "").trim();

            if (data.registrationId && scannedEventId === currentEventId) {
                setScanResult(data);
                setRegistrationId(data.registrationId as Id<"registrations">);
                if (scannerRef.current) {
                    scannerRef.current.stop().catch((e: any) => console.error("Error stopping scanner:", e));
                }
            } else {
                toast.error("Invalid QR code", {
                    description: scannedEventId !== currentEventId
                        ? "This QR code belongs to a different event."
                        : "Unsupported QR format."
                });
            }
        } catch (e) {
            toast.error("Unrecognized QR Code");
        }
    }, [eventId, scanResult]);

    const onScanFailure = useCallback(() => { }, []);

    const markAsClaimed = async () => {
        if (!registrationId) return;
        setIsUpdating(true);
        try {
            await markClaimedMutation({ id: registrationId });
            toast.success("Marked as claimed!");
        } catch (e) {
            console.error("Error updating claim status:", e);
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const resetScanner = useCallback(() => {
        setScanResult(null);
        setRegistrationId(null);
        lastScannedRef.current = null;
        lastScanTimeRef.current = 0;
        setShowScanner(false);
        setTimeout(() => setShowScanner(true), 50);
    }, []);

    const handlePermissionStatus = useCallback((status: "granted" | "denied" | "prompt") => {
        setPermissionStatus(status);
    }, []);

    return (
        <PageWrapper className="pt-8 pb-24 max-w-7xl mx-auto space-y-12">
            <Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-2 text-xs font-black uppercase tracking-widest italic transition-colors">
                <ArrowLeft size={14} /> Back to Event
            </Link>
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
                            <p className="text-xl font-black italic text-white leading-none tracking-tighter">
                                {stats.claimed.toLocaleString()} / {stats.total.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Scanner View */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-4 bg-black border-white/10 overflow-hidden relative group min-h-[300px]">
                        {showScanner ? (
                            <QRScanner
                                onScanSuccess={onScanSuccess}
                                onScanFailure={onScanFailure}
                                scannerRef={scannerRef}
                                onPermissionStatus={handlePermissionStatus}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-black/60 backdrop-blur-sm z-20">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Camera size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black italic uppercase text-white">Camera Access Required</p>
                                    <p className="text-[10px] text-text-muted italic leading-relaxed max-w-[200px]">
                                        Scanner needs webcam access to process QR codes.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowScanner(true)}
                                    className="bg-primary hover:bg-primary/80 border-none text-[10px] font-black italic uppercase tracking-widest px-6"
                                >
                                    Enable Camera
                                </Button>
                            </div>
                        )}
                        {showScanner && !scanResult && permissionStatus === "granted" && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-48 h-48 border-2 border-primary/40 rounded-[2rem] animate-pulse flex items-center justify-center">
                                    <Scan className="text-primary/20" size={80} />
                                </div>
                            </div>
                        )}
                        {showScanner && permissionStatus === "denied" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-black/80 z-20">
                                <XCircle className="text-red-500" size={48} />
                                <div className="space-y-1">
                                    <p className="text-sm font-black italic uppercase text-white">Access Denied</p>
                                    <p className="text-[10px] text-text-muted italic leading-relaxed">
                                        Please enable camera access in your browser settings and refresh the page.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="border-white/10 text-white text-[10px] font-black italic uppercase"
                                >
                                    Refresh Page
                                </Button>
                            </div>
                        )}
                    </Card>
                    <div className="p-6 bg-surface/30 border border-dashed border-white/10 rounded-2xl text-center space-y-2">
                        <p className="text-xs text-text-muted italic font-medium">Position the runner&apos;s QR code within the frame to automatically scan.</p>
                    </div>
                </div>

                {/* Result View */}
                <div className="lg:col-span-3">
                    {registration === undefined && registrationId !== null ? (
                        <div className="h-full flex items-center justify-center py-20">
                            <Scan className="animate-spin text-primary" size={48} />
                        </div>
                    ) : registration ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" ref={registrationUiRef}>
                            <Card className={cn(
                                "p-8 border-2 relative overflow-hidden",
                                registration.raceKitClaimed ? "bg-cta/5 border-cta/20" : "bg-primary/5 border-primary/20"
                            )}>
                                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Participant</p>
                                            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                                                {registration.registrationData?.participantInfo?.name || "Participant"}
                                            </h2>
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
                                        <p className="text-2xl font-black italic text-white">
                                            {registration.registrationData?.participantInfo?.tShirtSize || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-3 p-4 bg-surface/40 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-cta italic">
                                            <Shirt size={14} /> Singlet Size
                                        </div>
                                        <p className="text-2xl font-black italic text-white">
                                            {registration.registrationData?.participantInfo?.singletSize || "N/A"}
                                        </p>
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
                                            <p className="text-[10px] text-cta/70 italic font-bold">
                                                Claimed on: {registration.raceKitClaimedAt ? new Date(registration.raceKitClaimedAt).toLocaleString() : "Recently"}
                                            </p>
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
