"use client";

import {
    Zap, Plus, Scan, Monitor, BarChart3, Globe,
    Calendar, Users, DollarSign, Package, ArrowRight,
    MapPin, Clock, Activity, TrendingUp, ShieldCheck,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface OrganizerViewProps {
    items: any[];
    allEvents: any[];
    publishedEvents: any[];
    draftEvents: any[];
    stats: { total: number; secondary: number; revenue: number };
    claimedKits: number;
    claimPercentage: number;
    eventKitStats: any[];
    recentRegistrations: any[];
    categoryRevenue: any[];
}

export function OrganizerView({
    items,
    allEvents,
    publishedEvents,
    draftEvents,
    stats,
    claimedKits,
    claimPercentage,
    eventKitStats,
    recentRegistrations,
    categoryRevenue
}: OrganizerViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Action Toolbar */}
            <div className="bg-surface/60 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-cta" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                    {items.length > 0 && (
                        <Link
                            href={`/dashboard/events/${items[0]?.id}/kiosk`}
                            className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 hover:border-amber-500/40 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Monitor size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white uppercase italic leading-tight">Kiosk Mode</p>
                                <p className="text-[9px] text-text-muted font-medium italic">Tablet station</p>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <p className="text-3xl font-black italic tracking-tight text-white">{stats.total}</p>
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
                            <p className="text-3xl font-black italic tracking-tight text-white">{stats.secondary}</p>
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
                            <p className="text-3xl font-black italic tracking-tight text-white">₱{stats.revenue.toLocaleString()}</p>
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
                            <p className="text-3xl font-black italic tracking-tight text-white">{claimedKits}<span className="text-lg text-text-muted font-bold">/{stats.secondary}</span></p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Kits Claimed</p>
                        </div>
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
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Active Events</h2>
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

                {/* Right Column: Feeds & Secondary Stats */}
                <div className="space-y-6">
                    {/* Recent Registrations Feed */}
                    <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 p-12 bg-cta/5 rounded-full blur-3xl -ml-16 -mt-16" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-cta" />
                                <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Recent Sign-ups</h3>
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
                                <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Revenue by Category</h3>
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

                    {/* Kit Fulfillment Card */}
                    <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <ShieldCheck size={14} className="text-amber-500" />
                            <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Kit Fulfillment</h3>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-center mb-4">
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
        </div>
    );
}
