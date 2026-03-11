"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, MapPin, Scan, Users, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { format, formatDistanceToNow, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface OrganizerActiveEventsProps {
    items: any[];
    eventKitStats: any[];
}

export function OrganizerActiveEvents({ items, eventKitStats }: OrganizerActiveEventsProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                        <Link href="/dashboard/organizer/events/create">Build First Event <ArrowRight size={16} className="ml-2" /></Link>
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
                    <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-[10px] font-black italic uppercase px-2.5 py-0.5">
                        {items.length} Live
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {eventKitStats.map((event) => {
                    const parsedDate = event.date ? new Date(event.date) : null;
                    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
                    const isUpcoming = isValidDate && isAfter(parsedDate, new Date());

                    return (
                        <Card key={event.id} className="bg-white/5 border-white/10 hover:border-cta/30 transition-all group overflow-hidden flex flex-col h-full relative cursor-pointer">
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cta/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <Link href={`/dashboard/organizer/events/${event.id}`} className="absolute inset-0 z-0" aria-label="Manage event" />

                            <div className="p-3 flex-1 flex flex-col gap-3 relative z-10 pointer-events-none">
                                {/* Header: Image & Title */}
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-cta transition-colors overflow-hidden shrink-0 border border-white/10 shadow-lg relative">

                                        {event.featuredImage ? (
                                            <Image
                                                src={event.featuredImage}
                                                alt={event.name}
                                                fill
                                                sizes="(max-width: 768px) 64px, 64px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <Calendar size={28} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1">
                                        <h4 className="font-black italic uppercase text-lg text-white leading-tight truncate group-hover:text-cta transition-colors">{event.name}</h4>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-bold uppercase italic tracking-widest mt-2">
                                            {isValidDate && (
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-primary" />
                                                    {mounted ? (isUpcoming ? formatDistanceToNow(parsedDate, { addSuffix: true }) : format(parsedDate, "MMM d, yyyy")) : format(parsedDate, "MMM d, yyyy")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-white/5 mt-2">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 opacity-70">
                                            <Users size={12} className="text-cta" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Runners</span>
                                        </div>
                                        <p className="text-xl font-black italic text-white leading-none mt-1">{event.regCount}</p>
                                    </div>
                                    <div className="flex flex-col text-right items-end">
                                        <div className="flex items-center gap-1.5 opacity-70">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Location</span>
                                            <MapPin size={12} className="text-primary" />
                                        </div>
                                        <p className="text-sm font-bold italic text-white truncate max-w-[120px] leading-none mt-1">{event.location?.name || "TBA"}</p>
                                    </div>
                                </div>

                                {/* Spacer to push buttons/progress to bottom */}
                                <div className="flex-1" />

                                {/* Kit Fulfillment Progress */}
                                {event.regCount > 0 && (
                                    <div className="mt-2 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-1.5">
                                                <Package size={12} className="text-amber-500" />
                                                Kit Fulfillment
                                            </span>
                                            <span className="text-xs font-black italic text-white">
                                                {event.claimPercent}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
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

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-2 pt-4 border-t border-white/5 relative z-20 pointer-events-auto">
                                    <Button size="sm" variant="outline" asChild className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 text-white font-black italic uppercase text-xs">
                                        <Link href={`/dashboard/organizer/events/${event.id}`}>
                                            Manage
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild className="flex-1 bg-cta/10 hover:bg-cta/20 border-cta/20 text-cta font-black italic uppercase text-xs">
                                        <Link href={`/dashboard/organizer/events/${event.id}/scanner`}>
                                            <Scan size={14} className="mr-2" /> Scan
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
