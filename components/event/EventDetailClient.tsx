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
import { EventGallery } from "./EventGallery";
import { isEarlyBirdActive, isRegistrationClosed, getEarlyBirdDaysRemaining, getEffectivePrice, isEventOver } from "@/lib/earlyBirdUtils";

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

        const sections = ["info", "categories", "timeline", "route"];
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

    const eventDate = new Date(event.date as unknown as string);

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
                        <div className="flex items-center gap-2"><Calendar size={20} className="text-primary" /> {format(eventDate, "MMMM d, yyyy")}</div>
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
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1">
                                {(["info", "categories", "timeline", "route"] as const).map((tab) => (
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
                                <div className="hidden lg:block ml-8">
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

                        {/* Categories Section */}
                        <div id="categories" className="space-y-8 px-4 md:px-0 relative">
                            {/* Decorative background element */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
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
                                                {isEarlyBirdActive(event) && cat.earlyBirdPrice != null && Number(cat.earlyBirdPrice) < Number(cat.price) ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold text-text-muted line-through italic">₱{cat.price}</span>
                                                        <span className="text-3xl font-black italic text-green-400 tracking-tighter">₱{cat.earlyBirdPrice}</span>
                                                        <Badge variant="success" className="bg-green-500/20 text-green-500 border-none mt-1 text-[10px] px-2">EARLY BIRD PROMO</Badge>
                                                    </div>
                                                ) : (
                                                    <p className="text-3xl font-black italic text-white tracking-tighter">₱{cat.price}</p>
                                                )}

                                                <Button
                                                    asChild={!isEventOver(event) && !isRegistrationClosed(event)}
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={isEventOver(event) || isRegistrationClosed(event)}
                                                    className={cn(
                                                        "w-full md:w-auto uppercase italic font-black shadow-lg shadow-primary/20",
                                                        (isEventOver(event) || isRegistrationClosed(event)) && "opacity-50 pointer-events-none grayscale"
                                                    )}
                                                >
                                                    {isEventOver(event) || isRegistrationClosed(event) ? (
                                                        isEventOver(event) ? "Event Ended" : "Registration Closed"
                                                    ) : (
                                                        <Link href={`/events/${event.id}/register?category=${cat.id || i}`}>
                                                            Register Now <ChevronRight size={16} />
                                                        </Link>
                                                    )}
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

                        {/* Timeline Section */}
                        <div id="timeline" className="space-y-8 max-w-4xl mx-auto px-4 md:px-0">
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
                                    <div className="aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl relative">
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
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-white/10 lg:hidden">
                    <Button
                        asChild
                        variant="primary"
                        className="w-full h-14 text-lg font-black italic uppercase tracking-wider bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20 group"
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
