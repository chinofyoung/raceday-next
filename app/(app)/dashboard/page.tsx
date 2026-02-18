"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Calendar, User, Settings, ArrowRight, Trophy,
    Plus, BarChart3, Users, DollarSign, QrCode,
    Loader2, MapPin, CheckCircle2, Globe
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getEvents } from "@/lib/services/eventService";
import { getRegistrations, getRegistrationsWithEvents } from "@/lib/services/registrationService";

export default function DashboardPage() {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, secondary: 0, revenue: 0 });
    const [items, setItems] = useState<any[]>([]);

    const completion = user?.profileCompletion || 0;
    const isOrganizer = role === "organizer" || role === "admin";

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, role]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            if (isOrganizer) {
                // Fetch Organizer Stats (Stage 3.1: Parallelize)
                const [eventsResult, regsResult] = await Promise.all([
                    getEvents({ organizerId: user?.uid, limitCount: 100, status: "all" }),
                    getRegistrations({ status: "paid", limitCount: 1000 })
                ]);

                const eventsList = eventsResult.items;
                const activeEvents = eventsList.filter((e: any) => e.status === "published");
                const myEventsIds = eventsList.map((e: any) => e.id);
                // Filter registrations for this organizer's events (Stage 1.1)
                const myRegs = regsResult.items.filter((r: any) => myEventsIds.includes(r.eventId));
                const totalRevenue = myRegs.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

                setStats({
                    total: eventsList.length,
                    secondary: myRegs.length,
                    revenue: totalRevenue
                });
                setItems(activeEvents.slice(0, 3));
            } else {
                // Fetch Runner Stats (Stage 1.4: Fix N+1 Query)
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
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-12 text-white">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">
                        Hello, <span className="text-primary">{user?.displayName?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Welcome back to your race command center.</p>
                </div>
                <div className="flex gap-3">
                    {isOrganizer && (
                        <Button variant="primary" size="sm" asChild className="hidden md:flex bg-cta hover:bg-cta-hover border-none font-black italic uppercase">
                            <Link href="/dashboard/events/create"><Plus size={16} className="mr-2" /> New Event</Link>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" asChild className="font-black italic uppercase border-white/10">
                        <Link href="/dashboard/settings"><Settings size={16} className="mr-2" /> Settings</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="hidden sm:flex font-black italic uppercase border-primary/20 text-primary hover:bg-primary/5">
                        <Link href="/"><Globe size={16} className="mr-2" /> Back to Website</Link>
                    </Button>
                </div>
            </div>

            {isOrganizer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="p-6 bg-surface border-white/5 flex items-center gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative z-10">
                            <Calendar size={28} />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Events</p>
                            <p className="text-3xl font-black italic">{stats.total}</p>
                        </div>
                    </Card>
                    <Card className="p-6 bg-surface border-white/5 flex items-center gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-cta/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cta/10 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-cta/10 flex items-center justify-center text-cta relative z-10">
                            <Users size={28} />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Runners</p>
                            <p className="text-3xl font-black italic">{stats.secondary}</p>
                        </div>
                    </Card>
                    <Card className="p-6 bg-surface border-white/5 flex items-center gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 relative z-10">
                            <DollarSign size={28} />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Revenue</p>
                            <p className="text-3xl font-black italic">₱{stats.revenue.toLocaleString()}</p>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Main Stats & List */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Profile Completion Card */}
                    {!isOrganizer && completion < 100 && (
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

                    {/* Organizer: My Events List */}
                    {isOrganizer && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">Active Events</h2>
                                <Link href="/dashboard/events" className="text-xs font-bold uppercase text-primary hover:underline italic">View All Events</Link>
                            </div>
                            {items.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {items.map((event) => (
                                        <Card key={event.id} className="p-6 bg-surface/50 border-white/5 hover:border-white/10 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors overflow-hidden">
                                                        {event.featuredImage ? <img src={event.featuredImage} className="w-full h-full object-cover" /> : <Calendar size={24} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold italic uppercase text-white leading-tight">{event.name}</h4>
                                                        <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-widest">{event.location.name}</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" asChild className="text-primary font-black italic uppercase">
                                                    <Link href={`/dashboard/events/${event.id}`}>Manage <ArrowRight size={14} className="ml-1" /></Link>
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
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
                    )}

                    {/* Runner: My Registered Events */}
                    {!isOrganizer && (
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
                                                        {reg.event?.featuredImage && <img src={reg.event.featuredImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                                                        <Calendar size={32} className="relative z-10" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xl font-black italic uppercase text-white leading-tight">{reg.event?.name}</h4>
                                                            <Badge variant={reg.status === "paid" ? "success" : "secondary"} className="text-[8px] font-black italic uppercase px-2 py-0 border-none">
                                                                {reg.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-text-muted uppercase italic tracking-widest">
                                                            <span className="flex items-center gap-1"><MapPin size={12} className="text-cta" /> {reg.event?.location.name}</span>
                                                            <span className="flex items-center gap-1"><Trophy size={12} className="text-primary" /> {reg.categoryId}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
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
                    )}
                </div>

                {/* Right Col: Quick Actions & Sidebar Info */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tight">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {isOrganizer ? (
                                <>
                                    <Link href="/dashboard/events/create" className="block p-4 bg-primary rounded-xl border border-primary hover:scale-[1.02] transition-all group shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Plus size={18} className="text-white" />
                                                <span className="font-bold uppercase italic text-sm text-white">Create New Event</span>
                                            </div>
                                            <ArrowRight size={14} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </Link>
                                    <Link href="/dashboard/events" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 size={18} className="text-cta" />
                                                <span className="font-bold uppercase italic text-sm">Manage Events</span>
                                            </div>
                                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-cta" />
                                        </div>
                                    </Link>
                                </>
                            ) : (
                                <>
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
                                </>
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

                    {/* Stats Overview */}
                    <Card className="p-6 bg-surface/50 border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 p-12 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        <h3 className="font-bold uppercase italic text-[10px] text-primary mb-6 tracking-widest text-center relative z-10">
                            {isOrganizer ? "ORGNZR ANALYTICS" : "ATHLETE STATS"}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                                <div className="text-3xl font-black italic text-white tracking-tighter">{stats.total}</div>
                                <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">
                                    {isOrganizer ? "Total Races" : "Confirmed"}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                                <div className="text-3xl font-black italic text-white tracking-tighter">
                                    {isOrganizer ? stats.secondary : 0}
                                </div>
                                <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">
                                    {isOrganizer ? "Total Runners" : "Finished"}
                                </div>
                            </div>
                        </div>
                        {!isOrganizer && (
                            <div className="mt-4 p-4 bg-cta/5 border border-cta/20 rounded-2xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center text-cta shrink-0">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[10px] font-bold italic text-white uppercase leading-tight">You have {stats.total} upcoming races scheduled!</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </PageWrapper>
    );
}
