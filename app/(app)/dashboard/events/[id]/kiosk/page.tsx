"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Scan, ShieldCheck, XCircle, CheckCircle2, AlertTriangle,
    User, Shirt, Hash, X, Monitor, Users, Package,
    Search, ArrowRight, Clock, Loader2
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const QRScanner = dynamic(
    () => import("@/components/shared/QRScannerWrapper"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-black/40 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        ),
    }
);

// ── Audio feedback helpers ──────────────────────────────────────
function playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
    } catch { /* audio not supported — silently ignore */ }
}

function playSuccessSound() {
    playTone(880, 0.12);
    setTimeout(() => playTone(1100, 0.18), 120);
}

function playErrorSound() {
    playTone(300, 0.25, "square");
}

// ── Claimed entry for the recent feed ───────────────────────────
interface ClaimEntry {
    id: string;
    name: string;
    category: string;
    bib: string;
    timestamp: Date;
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function KioskModePage() {
    const { id: eventId } = useParams();
    const router = useRouter();

    // ── Event data ─────────────────────────────────────────────
    const [eventName, setEventName] = useState<string>("");

    // ── Scanner state ──────────────────────────────────────────
    const [scanResult, setScanResult] = useState<any>(null);
    const [registration, setRegistration] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt">("prompt");
    const [successFlash, setSuccessFlash] = useState(false);
    const scannerRef = useRef<any>(null);
    const lastScannedRef = useRef<string | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ── Stats ──────────────────────────────────────────────────
    const [stats, setStats] = useState({ total: 0, claimed: 0 });

    // ── Recent claims feed (local) ─────────────────────────────
    const [recentClaims, setRecentClaims] = useState<ClaimEntry[]>([]);

    // ── Manual search ──────────────────────────────────────────
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Derived
    const remaining = stats.total - stats.claimed;
    const claimPct = stats.total > 0 ? Math.round((stats.claimed / stats.total) * 100) : 0;

    // ── Fetch event name ───────────────────────────────────────
    useEffect(() => {
        if (!eventId) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, "events", eventId as string));
                if (snap.exists()) setEventName(snap.data().name || "Event");
            } catch { /* fallback to empty */ }
        })();
    }, [eventId]);

    // ── Fetch stats ────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        if (!eventId) return;
        try {
            const q = query(
                collection(db, "registrations"),
                where("eventId", "==", eventId),
                where("status", "==", "paid")
            );
            const snap = await getDocs(q);
            const total = snap.size;
            const claimed = snap.docs.filter(d => d.data().raceKitClaimed).length;
            setStats({ total, claimed });
        } catch (e) {
            console.error("Kiosk: Error fetching stats:", e);
        }
    }, [eventId]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Fetch participant by registration ID ───────────────────
    const fetchParticipant = async (regId: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, "registrations", regId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setRegistration({ id: snap.id, ...snap.data() });
            } else {
                toast.error("Registration not found.");
                playErrorSound();
            }
        } catch (e) {
            console.error("Kiosk: Error fetching participant:", e);
            toast.error("Failed to load participant.");
            playErrorSound();
        } finally {
            setLoading(false);
        }
    };

    // ── Mark kit as claimed ────────────────────────────────────
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
            playSuccessSound();
            setSuccessFlash(true);

            // Add to recent claims feed
            setRecentClaims(prev => [{
                id: registration.id,
                name: registration.participantInfo?.name || "Unknown",
                category: registration.categoryId || "",
                bib: registration.raceNumber || "",
                timestamp: new Date(),
            }, ...prev].slice(0, 8));

            // Refresh stats
            fetchStats();

            // Auto-reset after 3 seconds
            autoResetTimerRef.current = setTimeout(() => {
                resetScanner();
                setSuccessFlash(false);
            }, 3000);
        } catch (e) {
            console.error("Kiosk: Error updating claim:", e);
            toast.error("Failed to mark as claimed.");
            playErrorSound();
        } finally {
            setIsUpdating(false);
        }
    };

    // ── QR scan handlers ───────────────────────────────────────
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
                setSearchMode(false);
                fetchParticipant(data.registrationId);
                if (scannerRef.current) scannerRef.current.pause();
            } else {
                playErrorSound();
                toast.error("Invalid QR code", {
                    description: scannedEventId !== currentEventId
                        ? "This QR code belongs to a different event."
                        : "Unsupported QR format."
                });
            }
        } catch {
            playErrorSound();
            toast.error("Unrecognized QR Code");
        }
    }, [eventId, scanResult]);

    const onScanFailure = useCallback(() => { }, []);

    // ── Reset scanner ──────────────────────────────────────────
    const resetScanner = useCallback(() => {
        if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
        setScanResult(null);
        setRegistration(null);
        setSuccessFlash(false);
        lastScannedRef.current = null;
        lastScanTimeRef.current = 0;
        if (scannerRef.current) scannerRef.current.resume();
    }, []);

    const handlePermissionStatus = useCallback((status: "granted" | "denied" | "prompt") => {
        setPermissionStatus(status);
    }, []);

    // ── Manual search ──────────────────────────────────────────
    const handleSearch = async () => {
        if (!searchQuery.trim() || !eventId) return;
        setSearching(true);
        try {
            const q = query(
                collection(db, "registrations"),
                where("eventId", "==", eventId),
                where("status", "==", "paid")
            );
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const term = searchQuery.trim().toLowerCase();
            const filtered = all.filter((r: any) =>
                r.participantInfo?.name?.toLowerCase().includes(term) ||
                r.raceNumber?.toLowerCase().includes(term)
            );
            setSearchResults(filtered);
            if (filtered.length === 0) toast.info("No participants found for that search.");
        } catch (e) {
            console.error("Kiosk: Search error:", e);
            toast.error("Search failed.");
        } finally {
            setSearching(false);
        }
    };

    const selectSearchResult = (reg: any) => {
        setRegistration(reg);
        setScanResult({ registrationId: reg.id, eventId });
        setSearchResults([]);
        setSearchQuery("");
        setSearchMode(false);
        if (scannerRef.current) scannerRef.current.pause();
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
        };
    }, []);

    // Focus search input when search mode is toggled on
    useEffect(() => {
        if (searchMode && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchMode]);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className={cn(
            "fixed inset-0 z-50 bg-background flex flex-col overflow-hidden transition-colors duration-500",
            successFlash && "bg-emerald-950/40"
        )}>
            {/* ── Kiosk Header ──────────────────────────────── */}
            <div className="flex md:items-center flex flex-col md:flex-row gap-2  justify-between px-6 py-3 border-b border-white/5 bg-surface/60 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center text-cta">
                        <Monitor size={18} />
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-black italic uppercase tracking-tight text-white truncate max-w-[300px]">
                            {eventName}
                        </h1>
                        <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-[8px] font-black italic uppercase px-2 py-0">
                            Kiosk Mode
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSearchMode(!searchMode)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all cursor-pointer",
                            searchMode
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-white/5 text-text-muted hover:text-white border border-white/10 hover:border-white/20"
                        )}
                    >
                        <Search size={12} /> Manual Search
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/events/${eventId}`)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase italic tracking-wider text-text-muted hover:text-white hover:border-white/20 transition-all cursor-pointer"
                    >
                        <X size={12} /> Exit Kiosk
                    </button>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden">
                {/* LEFT: Scanner + Search */}
                <div className="lg:col-span-2 flex flex-col border-r border-white/5">
                    {/* Scanner Area */}
                    <div className="flex-1 relative p-4 flex flex-col">
                        <div className="flex-1 relative bg-black rounded-2xl overflow-hidden border border-white/10">
                            <QRScanner
                                onScanSuccess={onScanSuccess}
                                onScanFailure={onScanFailure}
                                scannerRef={scannerRef}
                                onPermissionStatus={handlePermissionStatus}
                            />
                            {/* Viewfinder overlay */}
                            {!scanResult && permissionStatus === "granted" && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <div className="w-52 h-52 border-2 border-primary/40 rounded-[2rem] animate-pulse flex items-center justify-center">
                                        <Scan className="text-primary/20" size={80} />
                                    </div>
                                </div>
                            )}
                            {/* Permission denied overlay */}
                            {permissionStatus === "denied" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-black/80 z-20">
                                    <XCircle className="text-red-500" size={48} />
                                    <p className="text-sm font-black italic uppercase text-white">Camera Denied</p>
                                    <p className="text-[10px] text-text-muted italic leading-relaxed">
                                        Enable camera in browser settings and refresh.
                                    </p>
                                    <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 text-white text-[10px] font-black italic uppercase">
                                        Refresh
                                    </Button>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-[10px] text-text-muted italic font-medium mt-3">
                            Position QR code within the frame.
                        </p>
                    </div>

                    {/* Manual Search Panel */}
                    {searchMode && (
                        <div className="p-4 border-t border-white/5 bg-surface/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex gap-2">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search by name or bib number..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <Button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="bg-primary hover:bg-primary/80 border-none text-[10px] font-black italic uppercase px-4"
                                >
                                    {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                </Button>
                            </div>
                            {searchResults.length > 0 && (
                                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl">
                                    {searchResults.map((r: any) => (
                                        <button
                                            key={r.id}
                                            onClick={() => selectSearchResult(r)}
                                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-primary/10 rounded-xl transition-all text-left cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic text-[10px] shrink-0">
                                                {r.participantInfo?.name?.charAt(0) || "?"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white uppercase italic truncate">{r.participantInfo?.name}</p>
                                                <p className="text-[9px] text-text-muted font-bold italic">
                                                    {r.raceNumber && `#${r.raceNumber}`} · {r.categoryId}
                                                </p>
                                            </div>
                                            {r.raceKitClaimed ? (
                                                <Badge variant="secondary" className="bg-cta/20 text-cta border-none text-[7px] font-black italic uppercase px-1.5 py-0 shrink-0">Claimed</Badge>
                                            ) : (
                                                <ArrowRight size={14} className="text-text-muted shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Stats + Result + Recent */}
                <div className="lg:col-span-3 flex flex-col overflow-hidden">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-3 gap-3 p-4 shrink-0">
                        <div className="p-4 bg-surface/50 rounded-2xl border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-cta/5 rounded-full blur-3xl -translate-x-8 -translate-y-8 group-hover:bg-cta/10 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-cta/10 flex items-center justify-center text-cta mx-auto mb-2">
                                    <Users size={18} />
                                </div>
                                <p className="text-3xl font-black italic tracking-tighter text-white">{stats.total}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">Total Runners</p>
                            </div>
                        </div>
                        <div className="p-4 bg-surface/50 rounded-2xl border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-3xl translate-x-8 -translate-y-8 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-2">
                                    <CheckCircle2 size={18} />
                                </div>
                                <p className="text-3xl font-black italic tracking-tighter text-white">{stats.claimed}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">Kits Claimed</p>
                            </div>
                        </div>
                        <div className="p-4 bg-surface/50 rounded-2xl border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-3xl -translate-x-8 translate-y-8 group-hover:bg-amber-500/10 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-2">
                                    <Package size={18} />
                                </div>
                                <p className="text-3xl font-black italic tracking-tighter text-white">{remaining}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">Remaining</p>
                            </div>
                        </div>
                    </div>

                    {/* Result Area */}
                    <div className="flex-1 p-4 pt-0 overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Scan className="animate-spin text-primary" size={48} />
                                    <p className="text-[10px] text-text-muted font-black italic uppercase tracking-widest">Looking up participant...</p>
                                </div>
                            </div>
                        ) : registration ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">
                                {/* Participant Card */}
                                <div className={cn(
                                    "p-6 rounded-2xl border-2 relative overflow-hidden transition-all duration-500",
                                    registration.raceKitClaimed
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : "bg-primary/5 border-primary/20"
                                )}>
                                    <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Participant</p>
                                                <h2 className="text-3xl lg:text-4xl font-black italic text-white uppercase tracking-tighter leading-none mt-1">
                                                    {registration.participantInfo?.name}
                                                </h2>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {registration.raceNumber && (
                                                    <div className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase italic px-3 py-1.5 bg-surface rounded-xl">
                                                        <Hash size={16} className="text-primary" /> {registration.raceNumber}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase italic px-3 py-1.5 bg-surface rounded-xl">
                                                    <User size={16} className="text-cta" /> {registration.categoryId}
                                                </div>
                                            </div>
                                        </div>
                                        {registration.raceKitClaimed ? (
                                            <div className="text-emerald-500 flex flex-col items-center gap-1 animate-in zoom-in duration-300">
                                                <CheckCircle2 size={48} />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">Claimed</span>
                                            </div>
                                        ) : (
                                            <div className="text-primary flex flex-col items-center gap-1">
                                                <AlertTriangle size={48} className="animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">Unclaimed</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sizes */}
                                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
                                        <div className="p-4 bg-surface/40 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary italic mb-1">
                                                <Shirt size={14} /> T-Shirt Size
                                            </div>
                                            <p className="text-2xl font-black italic text-white">{registration.participantInfo?.tShirtSize || "N/A"}</p>
                                        </div>
                                        <div className="p-4 bg-surface/40 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-cta italic mb-1">
                                                <Shirt size={14} /> Singlet Size
                                            </div>
                                            <p className="text-2xl font-black italic text-white">{registration.participantInfo?.singletSize || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 space-y-3 relative z-10">
                                        {!registration.raceKitClaimed ? (
                                            <Button
                                                className="w-full h-16 bg-cta hover:bg-cta-hover border-none text-xl font-black italic uppercase tracking-widest shadow-2xl shadow-cta/30 transition-all active:scale-[0.98]"
                                                onClick={markAsClaimed}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? (
                                                    <span className="flex items-center gap-3">
                                                        <Loader2 size={24} className="animate-spin" /> Confirming...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-3">
                                                        <CheckCircle2 size={24} /> Mark as Claimed
                                                    </span>
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
                                                <p className="text-sm font-black italic text-emerald-500 uppercase flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={18} /> Kit Collected Successfully
                                                </p>
                                                {registration.raceKitClaimedAt?.seconds && (
                                                    <p className="text-[10px] text-emerald-500/70 italic font-bold mt-1">
                                                        Claimed: {new Date(registration.raceKitClaimedAt.seconds * 1000).toLocaleTimeString()}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-text-muted italic mt-2 flex items-center justify-center gap-1">
                                                    <Clock size={10} /> Auto-resetting to scanner...
                                                </p>
                                            </div>
                                        )}
                                        <Button variant="ghost" className="w-full text-text-muted font-black italic uppercase text-xs" onClick={resetScanner}>
                                            <Scan size={16} className="mr-2" /> Scan Next Participant
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Ready to Scan placeholder */
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-28 h-28 bg-surface/50 rounded-full flex items-center justify-center text-text-muted mb-6 border border-white/5">
                                    <Scan size={56} className="opacity-20" />
                                </div>
                                <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">Ready to Scan</h3>
                                <p className="text-text-muted text-sm max-w-sm mx-auto italic font-medium mt-2">
                                    Point a runner&apos;s QR code at the camera, or use manual search to find a participant.
                                </p>
                            </div>
                        )}

                        {/* Recent Claims Feed */}
                        {recentClaims.length > 0 && !loading && (
                            <div className="mt-6 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock size={12} className="text-cta" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">Recent Claims</span>
                                </div>
                                <div className="space-y-1.5">
                                    {recentClaims.map((claim, i) => (
                                        <div
                                            key={`${claim.id}-${i}`}
                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                            style={{ opacity: 1 - (i * 0.1) }}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                                                <CheckCircle2 size={12} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-white italic truncate">{claim.name}</p>
                                            </div>
                                            <span className="text-[9px] text-text-muted font-bold italic shrink-0">{claim.category}</span>
                                            {claim.bib && (
                                                <span className="text-[9px] text-text-muted font-bold italic shrink-0">#{claim.bib}</span>
                                            )}
                                            <span className="text-[8px] text-text-muted italic shrink-0">
                                                {formatDistanceToNow(claim.timestamp, { addSuffix: true })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Progress Footer ───────────────────────────── */}
            <div className="shrink-0 px-6 py-3 bg-surface/60 backdrop-blur-sm border-t border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                        <ShieldCheck size={10} className="text-cta" /> Kit Fulfillment Progress
                    </span>
                    <span className="text-xs font-black italic text-white">
                        {stats.claimed}/{stats.total}
                        <span className="text-text-muted ml-2">({claimPct}%)</span>
                    </span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            claimPct === 100
                                ? "bg-gradient-to-r from-emerald-500 to-cta"
                                : claimPct > 50
                                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                                    : "bg-gradient-to-r from-primary to-orange-400"
                        )}
                        style={{ width: `${claimPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
