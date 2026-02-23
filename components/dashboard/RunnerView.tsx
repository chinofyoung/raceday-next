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
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
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
                        <Button variant="primary" asChild className="relative z-10 font-black italic uppercase text-white">
                            <Link href="/dashboard/settings">Complete Now</Link>
                        </Button>
                    </Card>
                )}

                {/* Announcements */}
                <RunnerAnnouncements />

                {/* My Registered Events */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">My Registered Events</h2>
                    {items.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {items.map((reg) => (
                                <Card key={reg.id} className="p-8 bg-surface/40 border-white/5 hover:bg-surface/60 transition-all relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0 overflow-hidden relative">
                                                {reg.event?.featuredImage && <img src={reg.event.featuredImage} alt={`${reg.event?.name || "Event"} featured image`} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xl font-black italic uppercase text-white leading-tight">{reg.event?.name}</h4>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <Badge variant={reg.status === "paid" ? "success" : "secondary"} className="text-[8px] font-black italic uppercase px-2 py-0 border-none">
                                                            {reg.status}
                                                        </Badge>
                                                        {reg.status === "paid" && (
                                                            <Badge variant={reg.raceKitClaimed ? "cta" : "outline"} className={cn(
                                                                "text-[8px] font-black italic uppercase px-2 py-0 border-none",
                                                                !reg.raceKitClaimed && "bg-white/5 text-text-muted opacity-60"
                                                            )}>
                                                                <Package size={10} className="mr-1" />
                                                                {reg.raceKitClaimed ? "Kit Collected" : "Kit Pending"}
                                                            </Badge>
                                                        )}
                                                    </div>
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
                                                    {reg.raceNumber && (
                                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-white"><span className="text-cta font-black">#</span> {reg.raceNumber}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 shrink-0">
                                            {reg.status === "paid" && (
                                                <Button variant="primary" size="sm" asChild className="bg-cta hover:bg-cta-hover border-none font-black italic uppercase tracking-widest shadow-lg shadow-cta/20 text-white">
                                                    <Link href={`/dashboard/events/${reg.eventId}/qr`}><QrCode size={16} className="mr-2" /> View Pass</Link>
                                                </Button>
                                            )}
                                            {reg.event?.isLiveTrackingEnabled && (
                                                <Button variant="outline" size="sm" asChild className="font-black italic uppercase border-primary/20 text-primary hover:bg-primary/10">
                                                    <Link href={`/events/${reg.eventId}/live`}>
                                                        <Activity size={16} className="mr-2" /> Live
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" asChild className="font-black italic uppercase border-white/10 text-white">
                                                <Link href={`/events/${reg.eventId}`}>Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4 text-white">
                            <Calendar className="mx-auto text-text-muted opacity-20" size={48} />
                            <p className="text-text-muted italic font-medium">You haven&apos;t registered for any events yet.</p>
                            <Button variant="outline" asChild className="italic font-black uppercase text-white">
                                <Link href="/events">Explore Races <ArrowRight size={16} className="ml-2" /></Link>
                            </Button>
                        </Card>
                    )}
                </div>
            </div>

            {/* Runner Sidebar */}
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-3">
                        <Link href="/dashboard/settings" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-primary/50 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-white">
                                    <User size={18} className="text-primary" />
                                    <span className="font-bold uppercase italic text-sm">Edit Profile</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-primary" />
                            </div>
                        </Link>
                        <Link href="/events" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-white">
                                    <Trophy size={18} className="text-cta" />
                                    <span className="font-bold uppercase italic text-sm">Find Races</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-cta" />
                            </div>
                        </Link>
                        {userRole === "runner" && (
                            <Link href="/dashboard/become-organizer" className="block p-4 bg-primary rounded-xl border border-primary transition-all group shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-white">
                                        {hasApplication ? <Settings size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
                                        <span className="font-bold uppercase italic text-sm text-white">
                                            {hasApplication ? "Edit Application" : "Apply as Organizer"}
                                        </span>
                                    </div>
                                    <ArrowRight size={14} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </Link>
                        )}

                        <Link href="/" className="block p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-white">
                                    <Globe size={18} className="text-cta" />
                                    <span className="font-bold uppercase italic text-sm text-white">Back to Website</span>
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
                    <div className="grid grid-cols-2 gap-4 relative z-10 text-white">
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
    );
}
