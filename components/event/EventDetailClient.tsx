"use client";

import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useRouter } from "next/navigation";
import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
    Calendar, MapPin, Clock, Trophy, Users, Share2,
    ArrowLeft, ArrowRight, ChevronRight, CheckCircle2, Info, Timer
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserRegistrations } from "@/lib/services/registrationService";

const RouteMapViewer = dynamic(
    () => import("@/components/shared/RouteMapViewer").then(mod => mod.RouteMapViewer),
    { ssr: false, loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center italic text-text-muted">Loading Map...</div> }
);

interface EventDetailClientProps {
    event: RaceEvent;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"info" | "categories" | "timeline" | "route">("info");
    const { user } = useAuth();
    const [userRegistration, setUserRegistration] = useState<any>(null);

    useEffect(() => {
        if (user?.uid && event.id) {
            getUserRegistrations(user.uid).then(regs => {
                const reg = regs.find(r => r.eventId === event.id && (r.status === 'paid' || r.status === 'pending'));
                setUserRegistration(reg);
            });
        }
    }, [user, event.id]);

    const eventDate = new Date(event.date as unknown as string);

    return (
        <div className="relative">
            {/* Hero Parallax Area */}
            <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden">
                {event.featuredImage && (
                    <Image
                        src={event.featuredImage}
                        alt={event.name}
                        fill
                        className="object-cover scale-105"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto space-y-4">
                    <Link href="/events" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 text-xs font-black uppercase tracking-widest italic transition-colors">
                        <ArrowLeft size={16} /> Back to Search
                    </Link>
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="success" className="bg-cta text-white px-4 py-1.5 shadow-xl border-none">Registration Open</Badge>
                            {userRegistration && (
                                <Badge className={cn(
                                    "px-4 py-1.5 shadow-xl border-none text-white",
                                    userRegistration.status === "paid" ? "bg-green-500" : "bg-orange-500"
                                )}>
                                    {userRegistration.isProxy ? "You Registered Someone" : "You Are Registered"}
                                    {userRegistration.status === "pending" && " (Pending)"}
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black italic uppercase leading-none tracking-tighter text-white">
                            {event.name}
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-6 text-white/90 font-bold italic">
                        <div className="flex items-center gap-2"><Calendar size={20} className="text-primary" /> {format(eventDate, "MMMM d, yyyy")}</div>
                        <div className="flex items-center gap-2"><MapPin size={20} className="text-cta" /> {event.location?.name || "Multiple Locations"}</div>
                    </div>
                </div>
            </div>

            <PageWrapper className="pt-12 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-16">
                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-8 border-b border-white/5 pb-px">
                        {(["info", "categories", "timeline", "route"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative",
                                    activeTab === tab ? "text-primary" : "text-text-muted hover:text-white"
                                )}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === "info" && (
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">About the <span className="text-primary">Race</span></h2>
                                    <p className="text-lg text-text-muted leading-relaxed font-medium">
                                        {event.description}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="p-6 bg-surface/30 border-white/5 flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic uppercase text-white">Medals & Loot</h4>
                                            <p className="text-xs text-text-muted mt-1 font-medium italic leading-relaxed">Exclusive finisher medals and race kits for all valid participants.</p>
                                        </div>
                                    </Card>
                                    <Card className="p-6 bg-surface/30 border-white/5 flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center text-cta shrink-0">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic uppercase text-white">Community</h4>
                                            <p className="text-xs text-text-muted mt-1 font-medium italic leading-relaxed">Join thousands of runners in an unforgettable shared experience.</p>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === "categories" && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Race <span className="text-primary">Categories</span></h2>
                                <div className="grid grid-cols-1 gap-6">
                                    {event.categories?.map((cat, i) => (
                                        <Card key={i} className="p-8 bg-surface/40 border-white/5 hover:border-white/20 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">{cat.name}</h3>
                                                        <Badge variant="outline" className="border-primary/20 text-primary">{formatDistance(cat.distance, cat.distanceUnit)}</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-xs text-text-muted font-bold italic uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> Start: {cat.gunStartTime}</div>
                                                        <div className="flex items-center gap-1.5"><Timer size={14} className="text-cta" /> Cut-off: {cat.cutOffTime}</div>
                                                    </div>
                                                </div>
                                                <div className="text-left md:text-right space-y-3">
                                                    <p className="text-3xl font-black italic text-white tracking-tighter">₱{cat.price}</p>
                                                    <Button asChild variant="primary" size="sm" className="w-full md:w-auto uppercase italic font-black shadow-lg shadow-primary/20">
                                                        <Link href={`/events/${event.id}/register?category=${cat.id || i}`}>Register Now <ChevronRight size={16} /></Link>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 italic">Inclusions:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {cat.inclusions?.map((inc, j) => (
                                                        <span key={j} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/5 group-hover:border-primary/20 transition-colors">
                                                            <CheckCircle2 size={10} className="text-cta" /> {inc}
                                                        </span>
                                                    )) || <p className="text-[10px] text-text-muted italic">No inclusions listed</p>}
                                                </div>
                                            </div>
                                        </Card>
                                    )) || (
                                            <div className="py-24 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                                <Trophy className="text-text-muted opacity-20" size={48} />
                                                <p className="text-text-muted font-bold uppercase italic tracking-widest">No categories available</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <div className="space-y-8 max-w-2xl">
                                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white text-center">Event <span className="text-primary">Timeline</span></h2>
                                <div className="space-y-0">
                                    {event.timeline?.map((item, i) => (
                                        <div key={i} className="flex gap-8 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(249,115,22,.5)] group-hover:scale-125 transition-transform" />
                                                {i !== (event.timeline?.length || 0) - 1 && <div className="w-0.5 flex-1 bg-white/5 my-2" />}
                                            </div>
                                            <div className="pb-12 space-y-1">
                                                <p className="text-primary font-black italic leading-none">{item.time}</p>
                                                <h4 className="text-xl font-black uppercase italic text-white">{item.activity}</h4>
                                                {item.description && <p className="text-text-muted text-sm font-medium italic">{item.description}</p>}
                                            </div>
                                        </div>
                                    )) || (
                                            <div className="py-24 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                                <Clock className="text-text-muted opacity-20" size={48} />
                                                <p className="text-text-muted font-bold uppercase italic tracking-widest">Schedule coming soon</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {activeTab === "route" && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Race <span className="text-primary">Course</span></h2>
                                {event.categories[0]?.routeMap?.gpxFileUrl ? (
                                    <div className="space-y-6">
                                        <div className="aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl">
                                            <RouteMapViewer gpxUrl={event.categories[0].routeMap.gpxFileUrl} zoom={14} />
                                        </div>
                                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                                            <Info className="text-primary shrink-0" size={24} />
                                            <p className="text-xs text-text-muted leading-relaxed font-medium italic">
                                                Interactive map shows the official course for {event.categories[0].name}. Use the zoom controls to explore terrain and elevation. Locations for hydration stations and first aid will be marked on race day.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-24 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                        <MapPin className="text-text-muted opacity-20" size={48} />
                                        <p className="text-text-muted font-bold uppercase italic tracking-widest">Route details coming soon</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Sticky Card */}
                <div className="lg:block">
                    <div className="sticky top-32 space-y-6">
                        <Card className="p-8 bg-surface border-white/5 shadow-2xl space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Starts from</p>
                                <p className="text-4xl font-black italic text-white tracking-tighter">
                                    {event.categories?.length > 0
                                        ? `₱${Math.min(...event.categories.map(c => c.price))}`
                                        : "TBD"}
                                </p>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between text-xs font-bold uppercase italic text-text-muted">
                                    <span>Status</span>
                                    <span className="text-cta">Open</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold uppercase italic text-text-muted">
                                    <span>Date</span>
                                    <span className="text-white">{format(eventDate, "MMM d, yyyy")}</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => setActiveTab("categories")}
                                variant="primary"
                                className="w-full h-14 text-lg font-black italic uppercase tracking-wider bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20 group"
                            >
                                Get Your Slot <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </Button>

                            <p className="text-[10px] text-center text-text-muted font-bold italic uppercase tracking-widest">Secure Payment Processing</p>
                        </Card>

                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 gap-2"><Share2 size={16} /> Share</Button>
                            <Button variant="outline" className="flex-1 gap-2"><Users size={16} /> Followers</Button>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        </div>
    );
}
