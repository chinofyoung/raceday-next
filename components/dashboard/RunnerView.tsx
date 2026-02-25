"use client";

import {
    Calendar, User, ArrowRight, Trophy, QrCode,
    Package, MapPin, CheckCircle2, Globe, Plus, Settings, Activity
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RunnerAnnouncements } from "@/components/dashboard/RunnerAnnouncements";
import { RunnerQuickActions } from "@/components/dashboard/RunnerQuickActions";
import { VolunteerDashboard } from "@/components/dashboard/volunteer/VolunteerDashboard";
import { toDate } from "@/lib/utils";

interface RunnerViewProps {
    completion: number;
    items: any[];
    stats: { total: number };
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerView({
    completion,
    items,
    stats,
    hasApplication,
    userRole
}: RunnerViewProps) {
    const now = new Date();

    // Sort items so most recent/upcoming makes sense. For upcoming we could sort asc, for past desc.
    const upcomingEvents = items.filter(reg => {
        if (!reg.event) return true;
        const eventDate = toDate(reg.event.date);
        return eventDate >= now && reg.event?.status !== "completed";
    }).sort((a, b) => {
        const dA = toDate(a.event?.date).getTime();
        const dB = toDate(b.event?.date).getTime();
        return dA - dB;
    });

    const pastEvents = items.filter(reg => {
        if (!reg.event) return false; // Hide missing events from past
        const eventDate = toDate(reg.event.date);
        return eventDate < now || reg.event?.status === "completed";
    }).sort((a, b) => {
        const dA = toDate(a.event?.date).getTime();
        const dB = toDate(b.event?.date).getTime();
        return dB - dA; // most recent past first
    });

    const renderEventCard = (reg: any) => {
        const isPast = pastEvents.some(p => p.id === reg.id);

        return (
            <Card key={reg.id} className={cn("p-4 sm:p-5 lg:p-4 bg-surface/40 border-white/5 hover:bg-surface/60 hover:border-white/10 transition-all duration-300 relative group overflow-hidden shadow-sm hover:shadow-lg flex flex-col sm:flex-row gap-4 lg:gap-5", isPast ? "opacity-90 grayscale-[0.3]" : "")}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700 opacity-50 mix-blend-screen pointer-events-none" />

                {/* Event Image */}
                <div className="w-full sm:w-40 lg:w-56 aspect-[2/1] sm:aspect-[3/4] lg:aspect-[4/3] rounded-xl bg-black/40 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0 overflow-hidden relative border border-white/5 shadow-inner z-10">
                    {reg.event?.featuredImage ? (
                        <img src={reg.event.featuredImage} alt={`${reg.event?.name || "Event"} featured image`} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-1000 ease-out" />
                    ) : (
                        <Trophy size={48} className="opacity-20 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent sm:hidden" />
                    <h4 className="absolute bottom-4 left-4 right-4 text-2xl font-black italic uppercase text-white leading-tight sm:hidden drop-shadow-lg">{reg.event?.name}</h4>
                </div>

                {/* Event Details */}
                <div className="flex flex-col flex-1 gap-3 w-full z-10 sm:py-1 lg:py-0">
                    <div className="space-y-3">
                        {/* Mobile Badges */}
                        <div className="flex flex-col gap-2 sm:hidden px-1">
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <Badge variant={reg.status === "paid" ? "success" : "secondary"} className="text-[10px] font-black italic uppercase px-3 py-1 border-none shadow-sm shadow-black/20">
                                    {reg.status}
                                </Badge>
                                {reg.status === "paid" && (
                                    <Badge variant={reg.raceKitClaimed ? "cta" : "outline"} className={cn(
                                        "text-[10px] font-black italic uppercase px-3 py-1 border-none shadow-sm shadow-black/20",
                                        !reg.raceKitClaimed && "bg-white/5 text-text-muted opacity-80"
                                    )}>
                                        <Package size={12} className="mr-1.5 inline" />
                                        {reg.raceKitClaimed ? "Kit Collected" : "Kit Pending"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Desktop Title & Badges */}
                        <div className="hidden sm:flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                            <h4 className="text-2xl lg:text-2xl font-black italic uppercase text-white leading-tight tracking-tight drop-shadow-sm line-clamp-2 lg:pr-4">{reg.event?.name}</h4>
                            <div className="flex flex-wrap gap-2 shrink-0 mt-1 lg:mt-0 lg:pt-1">
                                <Badge variant={reg.status === "paid" ? "success" : "secondary"} className="text-xs font-black italic uppercase px-3 py-1 border-none shadow-sm">
                                    {reg.status}
                                </Badge>
                                {reg.status === "paid" && (
                                    <Badge variant={reg.raceKitClaimed ? "cta" : "outline"} className={cn(
                                        "text-xs font-black italic uppercase px-3 py-1 border-none shadow-sm",
                                        !reg.raceKitClaimed && "bg-white/5 text-text-muted opacity-80"
                                    )}>
                                        <Package size={14} className="mr-1.5 inline" />
                                        {reg.raceKitClaimed ? "Kit Collected" : "Kit Pending"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {reg.isProxy && (
                            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg w-fit border border-indigo-500/20 shadow-inner">
                                <User size={14} />
                                <span className="text-xs font-bold italic uppercase tracking-wider">
                                    Proxy for: <span className="text-white truncate max-w-[200px]">{reg.participantInfo?.name || "Self"}</span>
                                </span>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 lg:gap-3 text-[10px] sm:text-xs font-bold text-text-muted uppercase italic tracking-wider pt-1 px-1 sm:px-0">
                            <span className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm"><MapPin size={14} className="text-cta shrink-0" /> <span className="text-white/90 truncate max-w-[140px] lg:max-w-[200px]">{reg.event?.location?.name || "Location TBD"}</span></span>
                            <span className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm"><Trophy size={14} className="text-primary shrink-0" /> <span className="text-white/90">{reg.categoryId}</span></span>
                            {reg.raceNumber && (
                                <span className="flex items-center gap-1.5 bg-primary/10 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-primary/20 text-white shadow-sm"><span className="text-primary font-black shrink-0">#</span> {reg.raceNumber}</span>
                            )}
                        </div>
                    </div>

                    {/* Spacer to push actions down */}
                    <div className="hidden sm:block flex-1 min-h-[0.5rem]" />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:justify-end gap-2 sm:gap-3 w-full shrink-0">
                        {(!isPast && reg.status === "paid") && (
                            <Button variant="primary" asChild className="w-full sm:flex-1 lg:flex-none lg:w-auto lg:px-6 bg-cta hover:bg-cta-hover border-none font-black italic uppercase tracking-widest shadow-md shadow-cta/20 text-white group/btn relative overflow-hidden h-10 lg:h-10 text-xs">
                                <Link href={`/dashboard/events/${reg.eventId}/qr`}>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                                    <span className="relative flex items-center justify-center"><QrCode size={16} className="mr-2" /> View Pass</span>
                                </Link>
                            </Button>
                        )}
                        {(!isPast && reg.event?.isLiveTrackingEnabled) && (
                            <Button variant="outline" asChild className="w-full sm:flex-1 lg:flex-none lg:w-auto lg:px-6 font-black italic uppercase border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 shadow-sm h-10 lg:h-10 text-xs">
                                <Link href={`/events/${reg.eventId}/live`}>
                                    <Activity size={16} className="mr-2 animate-pulse" /> Live
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild className="w-full sm:flex-1 lg:flex-none lg:w-auto lg:px-6 font-black italic uppercase border-white/10 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 shadow-sm h-10 lg:h-10 text-xs">
                            <Link href={`/events/${reg.eventId}`}>Details</Link>
                        </Button>
                    </div>
                </div>
            </Card>
        )
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <RunnerQuickActions hasApplication={hasApplication} userRole={userRole} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-12">
                    {/* Profile Completion Card */}
                    {completion < 100 && (
                        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 opacity-50 mix-blend-screen" />
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0 drop-shadow-lg">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="10%" fill="transparent" className="text-white/10" />
                                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="10%" fill="transparent" strokeDasharray={`${2 * Math.PI * 40}%`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - completion / 100)}%`} className="text-primary transition-all duration-1000 ease-out" />
                                </svg>
                                <span className="absolute font-black italic text-xl sm:text-2xl text-white">{completion}%</span>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2 md:space-y-3 relative z-10 w-full">
                                <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white drop-shadow-sm">Complete your profile</h3>
                                <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium italic">Fill in your details to auto-fill your race registrations and get your race kit sizes right!</p>
                            </div>
                            <Button variant="primary" asChild className="relative z-10 w-full md:w-auto font-black italic uppercase text-white shadow-lg shadow-primary/20 h-12 md:h-auto whitespace-nowrap">
                                <Link href="/dashboard/settings">Complete Now <ArrowRight className="ml-2 w-4 h-4" /></Link>
                            </Button>
                        </Card>
                    )}

                    {/* Announcements */}
                    <RunnerAnnouncements />

                    {/* Volunteer Dashboard */}
                    <VolunteerDashboard />

                    {/* My Registered Events */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">My Registered Events</h2>
                        {upcomingEvents.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 lg:gap-4">
                                {upcomingEvents.map(renderEventCard)}
                            </div>
                        ) : (
                            <Card className="p-10 md:p-16 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-6 text-white rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cta/5 rounded-full blur-3xl group-hover:bg-cta/10 transition-colors duration-700" />
                                <div className="relative z-10 space-y-5">
                                    <div className="w-20 h-20 mx-auto bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                        <Calendar className="text-text-muted opacity-40 group-hover:text-cta group-hover:opacity-100 transition-colors duration-500" size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white drop-shadow-sm">No Upcoming Races</h3>
                                        <p className="text-sm md:text-base text-text-muted italic font-medium max-w-md mx-auto leading-relaxed">Your race calendar is currently empty. Find your next challenge and start training today!</p>
                                    </div>
                                    <Button variant="primary" asChild className="italic font-black uppercase text-white bg-cta hover:bg-cta-hover border-none shadow-lg shadow-cta/20 h-12 px-8">
                                        <Link href="/events">Explore Races <ArrowRight size={18} className="ml-2" /></Link>
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* My Past Events */}
                    {pastEvents.length > 0 && (
                        <div className="space-y-6 pt-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">My Past Events</h2>
                            <div className="grid grid-cols-1 gap-4 lg:gap-4 opacity-90">
                                {pastEvents.map(renderEventCard)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Runner Sidebar */}
                <div className="space-y-8">

                    {/* Athlete Stats */}
                    <Card className="p-6 bg-surface/50 border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 p-12 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        <h3 className="font-bold uppercase italic text-[10px] text-primary mb-6 tracking-widest text-center relative z-10">
                            ATHLETE STATS
                        </h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10 text-white">
                            <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                                <div className="text-3xl font-black italic text-white tracking-tighter">{upcomingEvents.length}</div>
                                <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Upcoming</div>
                            </div>
                            <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                                <div className="text-3xl font-black italic text-white tracking-tighter">{pastEvents.length}</div>
                                <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Finished</div>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-cta/5 border border-cta/20 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center text-cta shrink-0">
                                <CheckCircle2 size={16} />
                            </div>
                            <p className="text-[10px] font-bold italic text-white uppercase leading-tight">You have {upcomingEvents.length} upcoming races scheduled!</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
