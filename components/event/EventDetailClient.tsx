"use client";

import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useRouter } from "next/navigation";
import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
    Calendar, MapPin, Clock, Trophy, Users,
    ArrowLeft, ArrowRight, ChevronRight, CheckCircle2, Info, Timer, Megaphone, Activity
} from "lucide-react";
import Link from "next/link";

import { format } from "date-fns";
import Image from "next/image";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserRegistrations, getCategoryCounts } from "@/lib/services/registrationService";
import { EventGallery } from "./EventGallery";
import { isEarlyBirdActive, isRegistrationClosed, getEarlyBirdDaysRemaining, getEffectivePrice, isEventOver, isCategoryFull } from "@/lib/earlyBirdUtils";
import { Announcement } from "@/types/announcement";
import { formatDistanceToNow } from "date-fns";

const RouteMapViewer = dynamic(
    () => import("@/components/shared/RouteMapViewer").then(mod => mod.RouteMapViewer),
    { ssr: false, loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center italic text-text-muted">Loading Map...</div> }
);

interface EventDetailClientProps {
    event: RaceEvent;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [activeRouteCategoryIndex, setActiveRouteCategoryIndex] = useState(0);
    const [userRegistration, setUserRegistration] = useState<any>(null);
    const [activeSection, setActiveSection] = useState<string>("info");
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            // Trigger when the element crosses the middle of the viewport
            rootMargin: '-140px 0px -60% 0px'
        });

        const sections = ["info", "announcements", "categories", "timeline", "route"];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            sections.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 180;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        if (user?.uid && event.id) {
            getUserRegistrations(user.uid).then(regs => {
                const reg = regs.find(r => r.eventId === event.id && (r.status === 'paid' || r.status === 'pending'));
                setUserRegistration(reg);
            });
        }
    }, [user, event.id]);

    useEffect(() => {
        if (event.id) {
            getCategoryCounts(event.id).then(counts => {
                setLiveCounts(counts);
            });
        }
    }, [event.id]);

    useEffect(() => {
        if (event.id) {
            fetch(`/api/events/${event.id}/announcements`)
                .then(res => res.json())
                .then(data => setAnnouncements(data || []))
                .catch(err => console.error("Failed to fetch announcements:", err));
        }
    }, [event.id]);

    const formatTimeAMPM = (timeStr: string) => {
        if (!timeStr) return "TBD";
        if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) return timeStr;
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    const eventDate = new Date(event.date as unknown as string);
    const isValidDate = !isNaN(eventDate.getTime());

    return (
        <div className="relative">
            {/* Hero Parallax Area */}
            <div className="relative h-[30vh] md:h-[50vh] w-full overflow-hidden">
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
                            {isEventOver(event) ? (
                                <Badge variant="secondary" className="bg-white/10 text-white px-4 py-1.5 shadow-xl border-none">Event Ended</Badge>
                            ) : isRegistrationClosed(event) ? (
                                <Badge variant="destructive" className="bg-red-500/20 text-red-500 px-4 py-1.5 shadow-xl border-none">Registration Closed</Badge>
                            ) : (
                                <Badge variant="success" className="bg-cta text-white px-4 py-1.5 shadow-xl border-none">Registration Open</Badge>
                            )}
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
                        <div className="flex items-center gap-2"><Calendar size={20} className="text-primary" /> {isValidDate ? format(eventDate, "MMMM d, yyyy") : "TBD"}</div>
                        <div className="flex items-center gap-2"><MapPin size={20} className="text-cta" /> {event.location?.name || "Multiple Locations"}</div>
                    </div>
                </div>
            </div>

            <PageWrapper className="pt-0 pb-36 lg:pb-24 max-w-7xl mx-auto flex flex-col gap-16">
                {/* Main Content */}
                <div className="w-full space-y-24">
                    {/* Sticky Tabs Navigation */}
                    <div className="sticky top-[84px] z-40 bg-background/95 backdrop-blur-2xl border-b border-white/5 py-4 w-full px-4 md:px-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-2 -my-2 no-scrollbar mask-linear-fade flex-1">
                                {(["info", "announcements", "categories", "timeline", "route"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => scrollToSection(tab)}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap hover:cursor-pointer hover:scale-105 active:scale-95",
                                            activeSection === tab
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {!isEventOver(event) && !isRegistrationClosed(event) && (
                                <div className="hidden lg:flex ml-8 items-center gap-4">
                                    {event.isLiveTrackingEnabled !== false && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="h-10 px-6 uppercase italic font-black text-xs border-primary/30 text-primary hover:bg-primary/10 tracking-widest hidden xl:flex"
                                        >
                                            <Link href={`/events/${event.id}/live`}>
                                                <Activity size={14} className="mr-2 animate-pulse" /> Live Track
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => scrollToSection("categories")}
                                        variant="primary"
                                        size="sm"
                                        className="h-10 px-6 uppercase italic font-black text-xs shadow-lg shadow-cta/20 bg-cta hover:bg-cta-hover border-none"
                                    >
                                        Register Now
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-32">
                        {/* Info Section */}
                        <div id="info" className="space-y-10 px-4 md:px-0">
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
                            <div className="mt-10">
                                <EventGallery images={event.galleryImages} eventName={event.name} />
                            </div>
                        </div>

                        {/* Announcements Section */}
                        <div id="announcements" className="space-y-8 px-4 md:px-0">
                            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Latest <span className="text-primary">Updates</span></h2>
                            {announcements.length > 0 ? (
                                <div className="space-y-4">
                                    {announcements.map((announcement) => (
                                        <Card key={announcement.id} className="p-6 md:p-8 bg-surface/40 hover:bg-surface/60 border-white/5 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white">{announcement.title}</h3>
                                                    <p className="text-xs text-text-muted font-bold italic uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                        <Clock size={12} className="text-primary" />
                                                        {formatDistanceToNow(new Date(announcement.createdAt as any), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                                    <Megaphone size={18} />
                                                </div>
                                            </div>
                                            <p className="text-sm md:text-base text-text-muted leading-relaxed whitespace-pre-wrap font-medium">
                                                {announcement.message}
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                    <Megaphone className="text-text-muted opacity-20" size={48} />
                                    <p className="text-text-muted font-bold uppercase italic tracking-widest">No updates at this time</p>
                                </div>
                            )}
                        </div>

                        {/* Categories Section */}
                        <div id="categories" className="space-y-8 px-4 md:px-0 relative">
                            {/* Decorative background element */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
                            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Race <span className="text-primary">Categories</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {event.categories?.map((cat, i) => (
                                    <Card key={i} className="flex flex-col bg-surface/40 border-white/5 hover:border-white/20 transition-all group overflow-hidden relative shadow-2xl">
                                        <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />

                                        <div className="p-6 flex-1 flex flex-col space-y-4 relative z-10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white leading-tight">{cat.name}</h3>
                                                    <Badge variant="outline" className="text-[10px] py-0 h-5 border-primary/20 text-primary bg-primary/5 uppercase font-black italic tracking-widest leading-none flex items-center">{formatDistance(cat.distance, cat.distanceUnit)}</Badge>
                                                </div>
                                                <div className="text-right">
                                                    {isEarlyBirdActive(event) && cat.earlyBirdPrice != null && Number(cat.earlyBirdPrice) < Number(cat.price) ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-bold text-text-muted line-through italic">₱{cat.price}</span>
                                                            <span className="text-2xl font-black italic text-green-400 tracking-tighter">₱{cat.earlyBirdPrice}</span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-2xl font-black italic text-white tracking-tighter">₱{cat.price}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">Start Time</p>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white italic">
                                                        <Clock size={12} className="text-primary" /> {formatTimeAMPM(cat.gunStartTime)}
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">Cut-off</p>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white italic">
                                                        <Timer size={12} className="text-cta" /> {formatTimeAMPM(cat.cutOffTime)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">Inclusions</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {cat.inclusions?.map((inc, j) => (
                                                        <span key={j} className="px-2 py-0.5 bg-white/5 rounded text-xs font-bold text-white/90 border border-white/5 whitespace-nowrap">
                                                            {inc}
                                                        </span>
                                                    )) || <p className="text-[9px] text-text-muted italic">No inclusions listed</p>}
                                                </div>
                                            </div>

                                            <div className="pt-2 mt-auto">
                                                {(cat.showMaxParticipants || cat.showRegisteredCount) && (
                                                    <div className="space-y-3 mb-4 min-h-[1.5rem]">
                                                        {cat.showMaxParticipants && cat.maxParticipants && cat.maxParticipants > 0 && (
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex justify-between items-center pr-1">
                                                                    <p className={cn(
                                                                        "text-[9px] font-black uppercase tracking-widest italic leading-none",
                                                                        (liveCounts[cat.id] || cat.registeredCount || 0) >= cat.maxParticipants ? "text-red-500" : "text-primary"
                                                                    )}>
                                                                        {(liveCounts[cat.id] || cat.registeredCount || 0) >= cat.maxParticipants ? "SOLD OUT" : "Limited Slots"}
                                                                    </p>
                                                                    <span className="text-[9px] font-bold text-text-muted italic">
                                                                        {Math.max(0, cat.maxParticipants - (liveCounts[cat.id] || cat.registeredCount || 0))} left
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                                        style={{ width: `${Math.min(100, ((liveCounts[cat.id] || cat.registeredCount || 0) / cat.maxParticipants) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {cat.showRegisteredCount && (
                                                            <div className="flex items-center justify-between text-text-muted/60 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all hover:bg-white/10 group/joined">
                                                                <div className="flex items-center gap-2">
                                                                    <Users size={12} className="text-primary" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest italic text-text-muted group-hover/joined:text-white transition-colors">Registered Runners</span>
                                                                </div>
                                                                <span className="text-[10px] font-black italic text-white">{(liveCounts[cat.id] || cat.registeredCount || 0)} <span className="text-primary">Joined</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <Button
                                                    asChild={!isEventOver(event) && !isRegistrationClosed(event) && !isCategoryFull(cat)}
                                                    variant="primary"
                                                    disabled={isEventOver(event) || isRegistrationClosed(event) || isCategoryFull(cat)}
                                                    className={cn(
                                                        "w-full uppercase italic font-black shadow-lg shadow-primary/10 text-xs h-10 tracking-widest",
                                                        (isEventOver(event) || isRegistrationClosed(event) || isCategoryFull(cat)) && "opacity-50 pointer-events-none grayscale bg-surface"
                                                    )}
                                                >
                                                    {isEventOver(event) || isRegistrationClosed(event) || isCategoryFull(cat) ? (
                                                        isEventOver(event)
                                                            ? "Event Ended"
                                                            : isRegistrationClosed(event)
                                                                ? "Closed"
                                                                : "Sold Out"
                                                    ) : (
                                                        <Link href={`/events/${event.id}/register?category=${cat.id || i}`}>
                                                            Register <ChevronRight size={14} className="ml-1" />
                                                        </Link>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )) || (
                                        <div className="lg:col-span-3 py-24 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                            <Trophy className="text-text-muted opacity-20" size={48} />
                                            <p className="text-text-muted font-bold uppercase italic tracking-widest">No categories available</p>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* Timeline Section */}
                        <div id="timeline" className="space-y-8max-w-7xlmx-auto px-4 md:px-0">
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

                        {/* Route Section */}
                        <div id="route" className="space-y-8 px-4 md:px-0 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[100%] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Race <span className="text-primary">Course</span></h2>

                                {event.categories && event.categories.length > 1 && (
                                    <div className="flex flex-wrap gap-2">
                                        {event.categories.map((cat, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveRouteCategoryIndex(i)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all border",
                                                    activeRouteCategoryIndex === i
                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                        : "bg-white/5 text-text-muted border-white/5 hover:border-white/20 hover:text-white"
                                                )}
                                            >
                                                {formatDistance(cat.distance, cat.distanceUnit)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {event.categories?.[activeRouteCategoryIndex]?.routeMap?.gpxFileUrl ? (
                                <div key={activeRouteCategoryIndex} className="space-y-6 animate-in fade-in duration-500">
                                    <div className="aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl relative isolate">
                                        <RouteMapViewer
                                            // Key is important to force re-render when switching GPX files
                                            key={event.categories[activeRouteCategoryIndex].routeMap.gpxFileUrl}
                                            gpxUrl={event.categories[activeRouteCategoryIndex].routeMap.gpxFileUrl}
                                            zoom={14}
                                            theme="dark"
                                        />
                                        <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-lg">
                                            <p className="text-xs font-black uppercase italic tracking-wider text-white">
                                                Showing: <span className="text-primary">{event.categories[activeRouteCategoryIndex].name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                                        <Info className="text-primary shrink-0" size={24} />
                                        <p className="text-xs text-text-muted leading-relaxed font-medium italic">
                                            Interactive map shows the official course for {event.categories[activeRouteCategoryIndex].name}. Use the zoom controls to explore terrain and elevation. Locations for hydration stations and first aid will be marked on race day.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-24 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                                    <MapPin className="text-text-muted opacity-20" size={48} />
                                    <p className="text-text-muted font-bold uppercase italic tracking-widest">
                                        Route details for {event.categories?.[activeRouteCategoryIndex]?.name || "this category"} coming soon
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            </PageWrapper >

            {/* Mobile Sticky Register CTA */}
            {!isEventOver(event) && !isRegistrationClosed(event) && (
                <div className="fixed bottom-0 left-0 right-0 z-[2000] p-4 bg-background/95 backdrop-blur-md border-t border-white/10 lg:hidden flex gap-3">
                    {event.isLiveTrackingEnabled !== false && (
                        <Button
                            asChild
                            variant="outline"
                            className="h-14 px-6 text-sm font-black italic uppercase tracking-wider border-primary/30 text-primary bg-background shadow-xl hover:bg-primary/5 group shrink-0"
                        >
                            <Link href={`/events/${event.id}/live`}>
                                <Activity className="animate-pulse" size={20} />
                            </Link>
                        </Button>
                    )}
                    <Button
                        asChild
                        variant="primary"
                        className="w-full h-14 text-lg font-black italic uppercase tracking-wider bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20 group flex-1"
                    >
                        <Link href={`/events/${event.id}/register`}>
                            Register Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                        </Link>
                    </Button>
                </div>
            )}
        </div >
    );
}
