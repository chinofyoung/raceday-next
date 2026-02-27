"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Play, Square, Loader2, Navigation, Activity, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const RouteMapViewer = dynamic(
    () => import("@/components/shared/RouteMapViewer").then(mod => mod.RouteMapViewer),
    { ssr: false, loading: () => <div className="h-full w-full bg-surface animate-pulse flex items-center justify-center text-text-muted italic">Loading Map...</div> }
);

interface LiveTrackingClientProps {
    event: RaceEvent;
}

export function LiveTrackingClient({ event }: LiveTrackingClientProps) {
    const { user } = useAuth();
    const router = useRouter();

    const [activeRouteCategoryIndex, setActiveRouteCategoryIndex] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSimulatedFullscreen, setIsSimulatedFullscreen] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const lastLocationRef = useRef<{ lat: number, lng: number, time: number, bearing: number } | null>(null);

    // Convex Hooks
    const liveTrackers = useQuery(api.tracking.listByEvent, { eventId: event.id as Id<"events"> }) || [];
    const startTrackingMutation = useMutation(api.tracking.start);
    const updateLocationMutation = useMutation(api.tracking.update);
    const stopTrackingMutation = useMutation(api.tracking.stop);

    // Get user registration for access check
    const registrations = useQuery(api.registrations.getByUserId, { userId: user?._id as Id<"users"> }) || [];
    const hasAccess = user ? (user._id === event.organizerId || registrations.some(r => r.eventId === event.id && r.status === 'paid')) : false;

    const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);
        const bearing = (θ * 180 / Math.PI + 360) % 360;
        return bearing;
    };

    const category = event.categories?.[activeRouteCategoryIndex];
    const gpxUrl = category?.routeMap?.gpxFileUrl;
    const userId = user?._id;
    const displayName = user?.displayName || user?.email?.split('@')[0] || "Fellow Runner";

    useEffect(() => {
        const handleNativeFullscreenExit = () => {
            const doc = document as any;
            if (!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement)) {
                setIsFullscreen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleNativeFullscreenExit);
        document.addEventListener('webkitfullscreenchange', handleNativeFullscreenExit);
        document.addEventListener('mozfullscreenchange', handleNativeFullscreenExit);
        document.addEventListener('msfullscreenchange', handleNativeFullscreenExit);

        return () => {
            document.removeEventListener('fullscreenchange', handleNativeFullscreenExit);
            document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenExit);
            document.removeEventListener('mozfullscreenchange', handleNativeFullscreenExit);
            document.removeEventListener('msfullscreenchange', handleNativeFullscreenExit);
        };
    }, []);

    // Handle scroll locking for simulated fullscreen
    useEffect(() => {
        if (isSimulatedFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSimulatedFullscreen]);

    const toggleFullscreen = () => {
        if (!mapContainerRef.current) return;

        const elem = mapContainerRef.current as any;
        const doc = document as any;

        if (isSimulatedFullscreen) {
            setIsSimulatedFullscreen(false);
            return;
        }

        const isNativeActive = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (!isNativeActive) {
            const requestMethod = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
            if (requestMethod) {
                requestMethod.call(elem).catch((err: any) => {
                    console.warn("Native fullscreen failed, falling back to simulated:", err);
                    setIsSimulatedFullscreen(true);
                });
            } else {
                setIsSimulatedFullscreen(true);
            }
        } else {
            const exitMethod = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (exitMethod) {
                exitMethod.call(doc);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                if (event.id && user?._id) {
                    stopTrackingMutation({ eventId: event.id as Id<"events">, userId: user._id as Id<"users"> });
                }
            }
        };
    }, [watchId, event.id, user?._id, stopTrackingMutation]);

    const startTrackingCore = useCallback(async () => {
        if (!event.id || !user?._id) return;
        if (!("geolocation" in navigator)) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, heading } = position.coords;
                try {
                    const initialBearing = heading || 0;
                    await startTrackingMutation({
                        eventId: event.id as Id<"events">,
                        categoryId: category?.id,
                        userId: user._id as Id<"users">,
                        displayName,
                        lat: latitude,
                        lng: longitude,
                        bearing: initialBearing,
                    });
                    lastLocationRef.current = { lat: latitude, lng: longitude, time: Date.now(), bearing: initialBearing };

                    const id = navigator.geolocation.watchPosition(
                        async (pos) => {
                            const newLat = pos.coords.latitude;
                            const newLng = pos.coords.longitude;
                            const now = Date.now();

                            if (lastLocationRef.current) {
                                const last = lastLocationRef.current;
                                const timeElapsed = now - last.time;

                                // Haversine distance
                                const R = 6371e3;
                                const φ1 = last.lat * Math.PI / 180;
                                const φ2 = newLat * Math.PI / 180;
                                const Δφ = (newLat - last.lat) * Math.PI / 180;
                                const Δλ = (newLng - last.lng) * Math.PI / 180;

                                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                                    Math.cos(φ1) * Math.cos(φ2) *
                                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const distance = R * c;

                                if (timeElapsed > 15000 && distance > 15) {
                                    const calculatedBearing = pos.coords.heading !== null && pos.coords.heading !== undefined
                                        ? pos.coords.heading
                                        : calculateBearing(last.lat, last.lng, newLat, newLng);

                                    await updateLocationMutation({
                                        eventId: event.id as Id<"events">,
                                        userId: user._id as Id<"users">,
                                        lat: newLat,
                                        lng: newLng,
                                        bearing: calculatedBearing
                                    });
                                    lastLocationRef.current = { lat: newLat, lng: newLng, time: now, bearing: calculatedBearing };
                                }
                            } else {
                                const initialHeading = pos.coords.heading || 0;
                                await updateLocationMutation({
                                    eventId: event.id as Id<"events">,
                                    userId: user._id as Id<"users">,
                                    lat: newLat,
                                    lng: newLng,
                                    bearing: initialHeading
                                });
                                lastLocationRef.current = { lat: newLat, lng: newLng, time: now, bearing: initialHeading };
                            }
                        },
                        (err) => console.error("Error watching position", err),
                        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
                    );

                    setWatchId(id);
                    setIsTracking(true);

                    localStorage.setItem(`liveTrack_${event.id}_${user._id}`, JSON.stringify({ startedAt: Date.now() }));
                    toast.success("Live tracking started!");
                } catch (err) {
                    console.error("Failed to start tracking", err);
                    toast.error("Failed to start tracking on server");
                } finally {
                    setIsLoading(false);
                }
            },
            (err) => {
                console.error("Error getting location", err);
                if (err.code === 1) toast.error("Please allow location permissions to use Live Track");
                else toast.error("Could not get your location");
                setIsLoading(false);
                localStorage.removeItem(`liveTrack_${event.id}_${user?._id}`);
            },
            { enableHighAccuracy: true }
        );
    }, [event.id, category?.id, user?._id, user?.uid, displayName, startTrackingMutation, updateLocationMutation]);

    const stopTrackingCore = useCallback(async () => {
        if (!event.id || !user?._id) return;
        setIsLoading(true);
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        try {
            await stopTrackingMutation({ eventId: event.id as Id<"events">, userId: user._id as Id<"users"> });
            setIsTracking(false);
            lastLocationRef.current = null;
            localStorage.removeItem(`liveTrack_${event.id}_${user?._id}`);
            toast.success("Live tracking stopped");
        } catch (err) {
            console.error("Failed to stop tracking", err);
            toast.error("Failed to stop tracking");
        } finally {
            setIsLoading(false);
        }
    }, [event.id, user?._id, user?.uid, watchId, stopTrackingMutation]);

    const handleToggleTracking = () => {
        if (isTracking) stopTrackingCore();
        else startTrackingCore();
    };

    // Auto-resume tracking logic
    useEffect(() => {
        if (hasAccess && event.id && user?._id && !isTracking) {
            const stored = localStorage.getItem(`liveTrack_${event.id}_${user._id}`);
            if (stored) {
                try {
                    const { startedAt } = JSON.parse(stored);
                    const elapsed = Date.now() - startedAt;
                    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
                    if (elapsed < EIGHT_HOURS) {
                        startTrackingCore();
                    } else {
                        localStorage.removeItem(`liveTrack_${event.id}_${user.uid}`);
                    }
                } catch (e) {
                    localStorage.removeItem(`liveTrack_${event.id}_${user.uid}`);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAccess]);

    if (!user || hasAccess === false) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background p-6">
                <div className="bg-surface/40 p-10 rounded-3xl border border-white/10 text-center max-w-md w-full shadow-2xl space-y-6">
                    <Navigation className="text-cta mx-auto opacity-50 mb-4" size={64} />
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Access Denied</h2>
                    <p className="text-text-muted font-medium italic">
                        {!user
                            ? "You must be logged in to view Live Tracking."
                            : "Live Tracking is exclusively available to registered participants."}
                    </p>
                    <div className="pt-4 flex flex-col gap-3">
                        {!user && (
                            <Button variant="primary" asChild className="uppercase italic font-black shadow-lg shadow-primary/20 bg-cta hover:bg-cta-hover border-none">
                                <Link href="/auth/login">Log In</Link>
                            </Button>
                        )}
                        {user && (
                            <Button variant="primary" asChild className="uppercase italic font-black shadow-lg shadow-primary/20 bg-cta hover:bg-cta-hover border-none">
                                <Link href={`/events/${event.id}/register`}>Register for Event</Link>
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => router.back()} className="uppercase italic font-black text-text-muted hover:text-white border-white/10">
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PageWrapper className="pt-0 pb-36 lg:pb-24 max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex-none p-4 md:px-0 border-b border-white/5 bg-background/80 backdrop-blur-md z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div className="space-y-1">
                    <Link href={`/events/${event.id}`} className="text-xs text-text-muted hover:text-white uppercase font-black italic tracking-widest flex items-center gap-2 mb-2">
                        <ArrowLeft size={14} /> Back to Event
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                        {event.name} <Badge variant="outline" className="text-primary border-primary/30 uppercase"><Activity size={14} className="mr-1 inline animate-pulse" /> Live</Badge>
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {event.categories && event.categories.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {event.categories.map((cat, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveRouteCategoryIndex(i)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all border",
                                        activeRouteCategoryIndex === i
                                            ? "bg-white/10 text-white border-white/20 shadow-lg"
                                            : "bg-transparent text-text-muted border-white/5 hover:border-white/10 hover:text-white"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <Button
                        onClick={handleToggleTracking}
                        disabled={isLoading}
                        variant={isTracking ? "danger" : "primary"}
                        className={cn("uppercase italic font-black shadow-lg shadow-primary/20", isTracking && "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white")}
                    >
                        {isLoading ? (
                            <><Loader2 className="animate-spin mr-2" size={16} /> updating...</>
                        ) : isTracking ? (
                            <><Square size={14} fill="currentColor" className="mr-2" /> Stop Tracker</>
                        ) : (
                            <><Navigation size={14} className="mr-2" /> Start Tracker</>
                        )}
                    </Button>
                </div>
            </div>

            <div
                ref={mapContainerRef}
                className={cn(
                    "w-full relative overflow-hidden bg-surface/20 isolate transition-all duration-300",
                    isSimulatedFullscreen ? "fixed inset-0 z-[9999] h-screen w-screen rounded-none border-none" :
                        isFullscreen ? "h-screen rounded-none" : "h-[60vh] min-h-[500px] rounded-[2.5rem] border-4 border-white/5 shadow-2xl"
                )}
            >
                {gpxUrl ? (
                    (() => {
                        const allStations = event.categories.flatMap(cat => cat.stations || []);
                        const uniqueStations = Array.from(new Map(allStations.map(s => [s.id, s])).values());

                        return (
                            <RouteMapViewer
                                key={gpxUrl}
                                gpxUrl={gpxUrl}
                                zoom={14}
                                theme="dark"
                                liveTrackers={liveTrackers}
                                currentUserId={user?._id}
                                stations={uniqueStations}
                                className="rounded-none border-none h-full w-full"
                            />
                        );
                    })()
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                        <Navigation className="opacity-20 mb-4" size={48} />
                        <p className="font-bold uppercase italic tracking-widest text-sm">No route map available for this category</p>
                    </div>
                )}

                {gpxUrl && (
                    <button
                        onClick={toggleFullscreen}
                        className="absolute bottom-4 right-4 z-[1100] p-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:bg-gray-800 hover:text-white transition-all shadow-lg"
                        title={isFullscreen || isSimulatedFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen || isSimulatedFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                )}

                <div className="absolute bottom-6 left-6 z-[1100] bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {liveTrackers.slice(0, 3).map((t, i) => (
                            <div key={t.userId} className="w-8 h-8 rounded-full border-2 border-black bg-primary/20 flex items-center justify-center relative shadow-sm" style={{ zIndex: 10 - i }}>
                                <span className="text-[10px] font-black text-white">{t.displayName.charAt(0).toUpperCase()}</span>
                                <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black", t.userId === user?._id ? "bg-green-500" : "bg-blue-500")} />
                            </div>
                        ))}
                    </div>
                    {liveTrackers.length === 0 ? (
                        <p className="text-xs font-bold text-text-muted italic">No active runners</p>
                    ) : (
                        <p className="text-xs font-black text-white uppercase tracking-wider italic">
                            <span className="text-primary">{liveTrackers.length}</span> Active Runner{liveTrackers.length > 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
