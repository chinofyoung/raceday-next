"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Calendar, Clock, MapPin, Scan, Users, Package } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface OrganizerActiveEventsProps {
    items: any[];
    eventKitStats: any[];
}

export function OrganizerActiveEvents({ items, eventKitStats }: OrganizerActiveEventsProps) {
    if (eventKitStats.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Active Events</h2>
                </div>
                <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                    <Calendar className="mx-auto text-text-muted opacity-20" size={48} />
                    <p className="text-text-muted italic font-medium">You haven&apos;t created any events yet.</p>
                    <Button variant="primary" asChild className="bg-cta border-none italic font-black uppercase">
                        <Link href="/dashboard/events/create">Build First Event <ArrowRight size={16} className="ml-2" /></Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
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
        </div>
    );
}
