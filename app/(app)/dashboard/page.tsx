"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboardMode } from "@/components/providers/DashboardModeProvider";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Calendar, User, Settings, ArrowRight, Trophy,
    Plus, BarChart3, Users, DollarSign, QrCode,
    Loader2, MapPin, CheckCircle2, Globe, Repeat,
    Package, Scan, Download, Eye, Clock,
    TrendingUp, ShieldCheck, AlertTriangle, Shirt,
    ArrowUpRight, Activity, Zap
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { getEvents } from "@/lib/services/eventService";
import { getRegistrations, getRegistrationsWithEvents } from "@/lib/services/registrationService";
import { computeProfileCompletion } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { user, role } = useAuth();
    const { mode, setMode, canSwitchMode } = useDashboardMode();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, secondary: 0, revenue: 0 });
    const [items, setItems] = useState<any[]>([]);
    const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const completion = computeProfileCompletion(user as any);
    const isOrganizerView = mode === "organizer";

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, mode]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isOrganizerView) {
                const [eventsResult, regsResult] = await Promise.all([
                    getEvents({ organizerId: user?.uid, limitCount: 100, status: "all" }),
                    getRegistrations({ organizerId: user?.uid, status: "paid", limitCount: 200 })
                ]);

                const eventsList = eventsResult.items;
                const activeEvents = eventsList.filter((e: any) => e.status === "published");
                const myRegs = regsResult.items;
                const totalRevenue = myRegs.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

                setAllEvents(eventsList);
                setAllRegistrations(myRegs);
                setStats({
                    total: eventsList.length,
                    secondary: myRegs.length,
                    revenue: totalRevenue
                });
                setItems(activeEvents.slice(0, 5));
            } else {
                const result = await getRegistrationsWithEvents({
                    userId: user?.uid,
                    limitCount: 5
                });

                setStats({
                    total: result.items.filter((r: any) => r.status === "paid").length,
                    secondary: 0,
                    revenue: 0
                });
                setItems(result.items);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError("Failed to load your dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Derived organizer stats
    const claimedKits = useMemo(() => allRegistrations.filter(r => r.raceKitClaimed).length, [allRegistrations]);
    const claimPercentage = useMemo(() => allRegistrations.length > 0 ? Math.round((claimedKits / allRegistrations.length) * 100) : 0, [claimedKits, allRegistrations]);
    const publishedEvents = useMemo(() => allEvents.filter(e => e.status === "published"), [allEvents]);
    const draftEvents = useMemo(() => allEvents.filter(e => e.status === "draft"), [allEvents]);

    // Recent registrations (sorted by createdAt desc)
    const recentRegistrations = useMemo(() => {
        return [...allRegistrations]
            .sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            })
            .slice(0, 6);
    }, [allRegistrations]);

    // Per-event kit stats
    const eventKitStats = useMemo(() => {
        return items.map(event => {
            const eventRegs = allRegistrations.filter(r => r.eventId === event.id);
            const claimed = eventRegs.filter(r => r.raceKitClaimed).length;
            return {
                ...event,
                regCount: eventRegs.length,
                claimedCount: claimed,
                claimPercent: eventRegs.length > 0 ? Math.round((claimed / eventRegs.length) * 100) : 0
            };
        });
    }, [items, allRegistrations]);

    // Per-category revenue
    const categoryRevenue = useMemo(() => {
        const catMap = new Map<string, { name: string; count: number; revenue: number }>();
        allRegistrations.forEach(r => {
            const catId = r.categoryId || "Unknown";
            const existing = catMap.get(catId) || { name: catId, count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += r.totalPrice || 0;
            catMap.set(catId, existing);
        });
        return Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [allRegistrations]);


    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest italic animate-pulse">Loading Dashboard...</p>
                </div>
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <p className="text-red-400 font-bold italic uppercase">{error}</p>
                    <Button variant="outline" onClick={fetchDashboardData}>
                        Try Again
                    </Button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-8 text-white">
            {/* === Header === */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">
                        Hello, <span className="text-primary">{user?.displayName?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">
                        {isOrganizerView ? "Your race command center. Everything at a glance." : "Welcome back to your race command center."}
                    </p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                    {/* Mode Switcher */}
                    {canSwitchMode && (
                        <div className="flex items-center bg-surface border border-white/10 rounded-xl p-1 gap-0.5">
                            <button
                                onClick={() => setMode("runner")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${mode === "runner"
                                    ? "bg-primary text-white shadow-md"
                                    : "text-text-muted hover:text-white"
                                    }`}
                            >
                                <Trophy size={14} />
                                Runner
                            </button>
                            <button
                                onClick={() => setMode("organizer")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${mode === "organizer"
                                    ? "bg-cta text-white shadow-md"
                                    : "text-text-muted hover:text-white"
                                    }`}
                            >
                                <BarChart3 size={14} />
                                Organizer
                            </button>
                        </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="font-black italic uppercase border-white/10">
                        <Link href="/dashboard/settings"><Settings size={16} className="mr-2" /> Settings</Link>
                    </Button>
                </div>
            </div>

            {/* === ORGANIZER VIEW === */}
            {isOrganizerView && (
                <>
                    {/* Quick Action Toolbar */}
                    <div className="bg-surface/60 backdrop-blur-sm border border-white/5 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={14} className="text-cta" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Quick Actions</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Link
                                href="/dashboard/events/create"
                                className="flex items-center gap-3 p-3.5 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 hover:border-primary/40 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase italic leading-tight">Create Event</p>
                                    <p className="text-[9px] text-text-muted font-medium italic">New race</p>
                                </div>
                            </Link>
                            {items.length > 0 && (
                                <Link
                                    href={`/dashboard/events/${items[0]?.id}/scanner`}
                                    className="flex items-center gap-3 p-3.5 bg-cta/10 border border-cta/20 rounded-xl hover:bg-cta/20 hover:border-cta/40 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-cta/20 flex items-center justify-center text-cta group-hover:scale-110 transition-transform">
                                        <Scan size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white uppercase italic leading-tight">Scanner</p>
                                        <p className="text-[9px] text-text-muted font-medium italic">Race kit scan</p>
                                    </div>
                                </Link>
                            )}
                            <Link
                                href="/dashboard/events"
                                className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase italic leading-tight">All Events</p>
                                    <p className="text-[9px] text-text-muted font-medium italic">Manage</p>
                                </div>
                            </Link>
                            <Link
                                href="/"
                                className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase italic leading-tight">View Site</p>
                                    <p className="text-[9px] text-text-muted font-medium italic">Public page</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all">
                            <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase italic tracking-widest">
                                        <span>{publishedEvents.length} live</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-3xl font-black italic tracking-tight">{stats.total}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Events</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-cta/30 transition-all">
                            <div className="absolute top-0 right-0 p-8 bg-cta/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cta/10 transition-colors" />
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-cta/10 flex items-center justify-center text-cta">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-3xl font-black italic tracking-tight">{stats.secondary}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Runners</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-8 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors" />
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                        <DollarSign size={20} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-3xl font-black italic tracking-tight">₱{stats.revenue.toLocaleString()}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Revenue</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors" />
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Package size={20} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase italic tracking-widest">
                                        <span>{claimPercentage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-3xl font-black italic tracking-tight">{claimedKits}<span className="text-lg text-text-muted font-bold">/{stats.secondary}</span></p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Kits Claimed</p>
                                </div>
                                {/* Mini progress bar */}
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${claimPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Active Events with Kit Tracking */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Active Events with Scanner Access */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-black italic uppercase tracking-tight">Active Events</h2>
                                        <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-[9px] font-black italic uppercase px-2.5 py-0.5">
                                            {items.length} Live
                                        </Badge>
                                    </div>
                                    <Link href="/dashboard/events" className="text-xs font-bold uppercase text-primary hover:underline italic flex items-center gap-1">
                                        All Events <ArrowRight size={12} />
                                    </Link>
                                </div>

                                {eventKitStats.length > 0 ? (
                                    <div className="space-y-3">
                                        {eventKitStats.map((event) => {
                                            const parsedDate = event.date ? (typeof event.date?.toDate === 'function' ? event.date.toDate() : new Date(event.date)) : null;
                                            const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
                                            const isUpcoming = isValidDate && isAfter(parsedDate, new Date());

                                            return (
                                                <Card key={event.id} className="p-0 bg-surface/50 border-white/5 hover:border-white/10 transition-all group overflow-hidden">
                                                    <div className="p-5">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors overflow-hidden shrink-0">
                                                                    {event.featuredImage ? (
                                                                        <img src={event.featuredImage} alt={event.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Calendar size={24} />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 space-y-1.5">
                                                                    <h4 className="font-bold italic uppercase text-white leading-tight truncate">{event.name}</h4>
                                                                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted font-bold uppercase italic tracking-widest">
                                                                        <span className="flex items-center gap-1">
                                                                            <MapPin size={10} className="text-cta" />
                                                                            {event.location?.name || "TBA"}
                                                                        </span>
                                                                        {isValidDate && (
                                                                            <span className="flex items-center gap-1">
                                                                                <Clock size={10} className="text-primary" />
                                                                                {isUpcoming ? formatDistanceToNow(parsedDate, { addSuffix: true }) : format(parsedDate, "MMM d, yyyy")}
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1">
                                                                            <Users size={10} className="text-cta" />
                                                                            {event.regCount} runners
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0">
                                                                <Button size="sm" variant="outline" asChild className="text-cta border-cta/20 hover:bg-cta/10 font-black italic uppercase text-[10px] px-3 h-8">
                                                                    <Link href={`/dashboard/events/${event.id}/scanner`}>
                                                                        <Scan size={12} className="mr-1.5" /> Scan
                                                                    </Link>
                                                                </Button>
                                                                <Button size="sm" variant="ghost" asChild className="text-primary font-black italic uppercase text-[10px] px-3 h-8">
                                                                    <Link href={`/dashboard/events/${event.id}`}>
                                                                        Manage <ArrowRight size={12} className="ml-1" />
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Race Kit Progress */}
                                                        {event.regCount > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                                                        <Package size={10} className="text-amber-500" />
                                                                        Race Kit Fulfillment
                                                                    </span>
                                                                    <span className="text-[10px] font-black italic text-white">
                                                                        {event.claimedCount}/{event.regCount}
                                                                        <span className="text-text-muted ml-1">({event.claimPercent}%)</span>
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all duration-1000",
                                                                            event.claimPercent === 100 ? "bg-gradient-to-r from-cta to-emerald-400" :
                                                                                event.claimPercent > 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                                                                                    "bg-gradient-to-r from-primary to-orange-400"
                                                                        )}
                                                                        style={{ width: `${event.claimPercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                                        <Calendar className="mx-auto text-text-muted opacity-20" size={48} />
                                        <p className="text-text-muted italic font-medium">You haven&apos;t created any events yet.</p>
                                        <Button variant="primary" asChild className="bg-cta border-none italic font-black uppercase">
                                            <Link href="/dashboard/events/create">Build First Event <ArrowRight size={16} className="ml-2" /></Link>
                                        </Button>
                                    </Card>
                                )}
                            </div>

                            {/* Drafts Notice */}
                            {draftEvents.length > 0 && (
                                <Card className="p-4 bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold italic text-white">
                                                {draftEvents.length} draft event{draftEvents.length > 1 ? "s" : ""} awaiting publishing
                                            </p>
                                            <p className="text-[10px] text-text-muted font-medium italic">Finish setting up and publish to start accepting registrations.</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" asChild className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-bold italic uppercase text-[10px] shrink-0">
                                        <Link href="/dashboard/events">View Drafts</Link>
                                    </Button>
                                </Card>
                            )}
                        </div>

                        {/* Right: Recent Registrations + Revenue */}
                        <div className="space-y-6">
                            {/* Recent Registrations Feed */}
                            <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 p-12 bg-cta/5 rounded-full blur-3xl -ml-16 -mt-16" />
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-cta" />
                                        <h3 className="text-sm font-black uppercase italic tracking-tight">Recent Sign-ups</h3>
                                    </div>
                                </div>
                                <div className="space-y-2 relative z-10">
                                    {recentRegistrations.length > 0 ? (
                                        recentRegistrations.map((reg) => (
                                            <div key={reg.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic text-[10px] uppercase shrink-0">
                                                    {reg.participantInfo?.name?.charAt(0) || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white uppercase italic truncate">{reg.participantInfo?.name || "Unknown"}</p>
                                                    <p className="text-[9px] text-text-muted font-bold italic uppercase tracking-wider">{reg.categoryId}</p>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    {reg.raceKitClaimed ? (
                                                        <Badge variant="success" className="bg-cta/20 text-cta border-none text-[7px] font-black italic uppercase px-1.5 py-0">Claimed</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-white/10 text-text-muted text-[7px] font-black italic uppercase px-1.5 py-0">Pending Kit</Badge>
                                                    )}
                                                    {reg.createdAt?.seconds && (
                                                        <span className="text-[8px] text-text-muted italic mt-0.5">
                                                            {formatDistanceToNow(new Date(reg.createdAt.seconds * 1000), { addSuffix: true })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center">
                                            <Users className="mx-auto text-text-muted opacity-10 mb-2" size={32} />
                                            <p className="text-text-muted text-xs italic font-medium">No registrations yet.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Revenue by Category */}
                            {categoryRevenue.length > 0 && (
                                <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden">
                                    <div className="absolute bottom-0 right-0 p-12 bg-green-500/5 rounded-full blur-3xl -mr-16 -mb-16" />
                                    <div className="flex items-center gap-2 mb-4 relative z-10">
                                        <TrendingUp size={14} className="text-green-500" />
                                        <h3 className="text-sm font-black uppercase italic tracking-tight">Revenue by Category</h3>
                                    </div>
                                    <div className="space-y-3 relative z-10">
                                        {categoryRevenue.map((cat, i) => (
                                            <div key={cat.name} className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-white uppercase italic truncate">{cat.name}</span>
                                                    <span className="text-xs font-black text-green-500 italic">₱{cat.revenue.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                                                            style={{ width: `${categoryRevenue.length > 0 ? (cat.revenue / categoryRevenue[0].revenue) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-text-muted font-bold italic">{cat.count} runners</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total</span>
                                            <span className="text-sm font-black text-white italic">₱{stats.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Race Kit Overview Card */}
                            <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                                <div className="flex items-center gap-2 mb-4 relative z-10">
                                    <ShieldCheck size={14} className="text-amber-500" />
                                    <h3 className="text-sm font-black uppercase italic tracking-tight">Kit Fulfillment</h3>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-center mb-4">
                                        {/* Circular Progress */}
                                        <div className="relative w-24 h-24">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                                <circle
                                                    cx="48" cy="48" r="38"
                                                    stroke="currentColor" strokeWidth="6" fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 38}
                                                    strokeDashoffset={2 * Math.PI * 38 * (1 - claimPercentage / 100)}
                                                    strokeLinecap="round"
                                                    className="text-amber-500 transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-black italic text-white">{claimPercentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center p-3 bg-background/50 rounded-xl border border-white/5">
                                            <div className="text-lg font-black italic text-cta">{claimedKits}</div>
                                            <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Claimed</div>
                                        </div>
                                        <div className="text-center p-3 bg-background/50 rounded-xl border border-white/5">
                                            <div className="text-lg font-black italic text-text-muted">{stats.secondary - claimedKits}</div>
                                            <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Remaining</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* === RUNNER VIEW === */}
            {!isOrganizerView && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-12">
                        {/* Profile Completion Card */}
                        {completion < 100 && (
                            <Card className="bg-primary/10 border border-primary/20 p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-16 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
                                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - completion / 100)} className="text-primary transition-all duration-1000" />
                                    </svg>
                                    <span className="absolute font-black italic text-xl text-white">{completion}%</span>
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
                                    <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Complete your profile</h3>
                                    <p className="text-sm text-text-muted leading-relaxed font-medium italic">Fill in your details to auto-fill your race registrations and get your race kit sizes right!</p>
                                </div>
                                <Button variant="primary" asChild className="relative z-10 font-black italic uppercase">
                                    <Link href="/dashboard/profile">Complete Now</Link>
                                </Button>
                            </Card>
                        )}

                        {/* My Registered Events */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">My Registered Events</h2>
                            {items.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {items.map((reg) => (
                                        <Card key={reg.id} className="p-8 bg-surface/40 border-white/5 hover:bg-surface/60 transition-all relative group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0 overflow-hidden relative">
                                                        {reg.event?.featuredImage && <img src={reg.event.featuredImage} alt={`${reg.event?.name || "Event"} featured image`} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                                                        <Calendar size={32} className="relative z-10" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xl font-black italic uppercase text-white leading-tight">{reg.event?.name}</h4>
                                                            <Badge variant={reg.status === "paid" ? "success" : "secondary"} className="text-[8px] font-black italic uppercase px-2 py-0 border-none">
                                                                {reg.status}
                                                            </Badge>
                                                        </div>
                                                        {reg.isProxy && (
                                                            <div className="flex items-center gap-1.5 text-indigo-400">
                                                                <User size={12} />
                                                                <span className="text-[10px] font-bold italic uppercase tracking-wider">
                                                                    Registered for: <span className="text-white">{reg.participantInfo?.name || "Self"}</span>
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-text-muted uppercase italic tracking-widest">
                                                            <span className="flex items-center gap-1"><MapPin size={12} className="text-cta" /> {reg.event?.location?.name || "Location TBD"}</span>
                                                            <span className="flex items-center gap-1"><Trophy size={12} className="text-primary" /> {reg.categoryId}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 shrink-0">
                                                    {reg.status === "paid" && (
                                                        <Button variant="primary" size="sm" asChild className="bg-cta hover:bg-cta-hover border-none font-black italic uppercase tracking-widest shadow-lg shadow-cta/20">
                                                            <Link href={`/dashboard/events/${reg.eventId}/qr`}><QrCode size={16} className="mr-2" /> View Pass</Link>
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" size="sm" asChild className="font-black italic uppercase border-white/10">
                                                        <Link href={`/events/${reg.eventId}`}>Details</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                                    <Calendar className="mx-auto text-text-muted opacity-20" size={48} />
                                    <p className="text-text-muted italic font-medium">You haven&apos;t registered for any events yet.</p>
                                    <Button variant="outline" asChild className="italic font-black uppercase">
                                        <Link href="/events">Explore Races <ArrowRight size={16} className="ml-2" /></Link>
                                    </Button>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Runner Sidebar */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-xl font-black italic uppercase tracking-tight">Quick Actions</h2>
                            <div className="grid grid-cols-1 gap-3">
                                <Link href="/dashboard/profile" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-primary/50 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-text">
                                            <User size={18} className="text-primary" />
                                            <span className="font-bold uppercase italic text-sm">View Profile</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-primary" />
                                    </div>
                                </Link>
                                <Link href="/events" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-text">
                                            <Trophy size={18} className="text-cta" />
                                            <span className="font-bold uppercase italic text-sm">Find Races</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-cta" />
                                    </div>
                                </Link>
                                {user?.role === "runner" && (
                                    <Link href="/dashboard/become-organizer" className="block p-4 bg-primary rounded-xl border border-primary transition-all group shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Plus size={18} className="text-white" />
                                                <span className="font-bold uppercase italic text-sm text-white">Apply as Organizer</span>
                                            </div>
                                            <ArrowRight size={14} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </Link>
                                )}
                                <Link href="/" className="block p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Globe size={18} className="text-cta" />
                                            <span className="font-bold uppercase italic text-sm text-text">Back to Website</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-cta" />
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Athlete Stats */}
                        <Card className="p-6 bg-surface/50 border border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 p-12 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                            <h3 className="font-bold uppercase italic text-[10px] text-primary mb-6 tracking-widest text-center relative z-10">
                                ATHLETE STATS
                            </h3>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                                    <div className="text-3xl font-black italic text-white tracking-tighter">{stats.total}</div>
                                    <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Confirmed</div>
                                </div>
                                <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                                    <div className="text-3xl font-black italic text-white tracking-tighter">0</div>
                                    <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Finished</div>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-cta/5 border border-cta/20 rounded-2xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center text-cta shrink-0">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[10px] font-bold italic text-white uppercase leading-tight">You have {stats.total} upcoming races scheduled!</p>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}
