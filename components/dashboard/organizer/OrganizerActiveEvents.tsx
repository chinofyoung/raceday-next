"use client";

import { memo, useEffect, useState } from "react";
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

function OrganizerActiveEventsComponent({ items, eventKitStats }: OrganizerActiveEventsProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (eventKitStats.length === 0) {
        return (
            <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group flex flex-col h-full">
                {/* Decorative blur glow */}
                <div className="absolute top-0 right-0 p-12 bg-cta/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cta/20 transition-colors duration-500 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cta/20 flex items-center justify-center text-cta border border-cta/20">
                            <Calendar size={16} />
                        </div>
                        <h3 className="text-base font-black uppercase italic tracking-tight text-white">Active Events</h3>
                    </div>
                </div>

                {/* Empty state */}
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-4 relative z-10">
                    <Calendar className="text-text-muted opacity-20" size={48} />
                    <p className="text-text-muted italic font-medium">You haven&apos;t created any events yet.</p>
                    <Button variant="primary" asChild className="bg-cta border-none italic font-black uppercase">
                        <Link href="/dashboard/organizer/events/create">
                            Build First Event <ArrowRight size={16} className="ml-2" />
                        </Link>
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group flex flex-col h-full">
            {/* Decorative blur glow */}
            <div className="absolute top-0 right-0 p-12 bg-cta/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cta/20 transition-colors duration-500 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cta/20 flex items-center justify-center text-cta border border-cta/20">
                        <Calendar size={16} />
                    </div>
                    <h3 className="text-base font-black uppercase italic tracking-tight text-white">Active Events</h3>
                    <Badge variant="secondary" className="bg-cta/10 text-cta border-cta/20 text-[10px] font-black italic uppercase px-2.5 py-0.5">
                        {items.length} Live
                    </Badge>
                </div>
            </div>

            {/* Event list */}
            <div className="flex flex-col gap-3 relative z-10">
                {eventKitStats.map((event) => {
                    const parsedDate = event.date ? new Date(event.date) : null;
                    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
                    const isUpcoming = isValidDate && isAfter(parsedDate, new Date());

                    return (
                        <div
                            key={event.id}
                            className="group/card relative flex flex-col sm:flex-row sm:items-center gap-4 bg-black/20 hover:bg-white/5 border border-white/5 hover:border-cta/20 rounded-2xl p-4 transition-all duration-300 overflow-hidden"
                        >
                            {/* Subtle hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cta/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                            {/* Invisible full-card link layer */}
                            <Link
                                href={`/dashboard/organizer/events/${event.id}`}
                                className="absolute inset-0 z-0 rounded-2xl"
                                aria-label={`Manage ${event.name}`}
                            />

                            {/* Left: Event image */}
                            <div className="relative w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-md self-start sm:self-auto">
                                {event.featuredImage ? (
                                    <Image
                                        src={event.featuredImage}
                                        alt={event.name}
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted group-hover/card:text-cta transition-colors">
                                        <Calendar size={20} />
                                    </div>
                                )}
                            </div>

                            {/* Middle: Event info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black italic uppercase text-sm text-white leading-tight truncate group-hover/card:text-cta transition-colors">
                                    {event.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                    {isValidDate && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase italic tracking-widest text-text-muted">
                                            <Clock size={10} className="text-primary shrink-0" />
                                            {mounted
                                                ? isUpcoming
                                                    ? formatDistanceToNow(parsedDate, { addSuffix: true })
                                                    : format(parsedDate, "MMM d, yyyy")
                                                : format(parsedDate, "MMM d, yyyy")}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase italic tracking-widest text-text-muted">
                                        <MapPin size={10} className="text-primary shrink-0" />
                                        {event.location?.name || "TBA"}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Stats + kit progress + actions */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 relative z-10 pointer-events-auto">
                                {/* Runners count */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Users size={12} className="text-cta" />
                                    <span className="text-sm font-black italic text-white">{event.regCount}</span>
                                    <span className="text-[10px] font-black uppercase italic tracking-widest text-text-muted">runners</span>
                                </div>

                                {/* Kit fulfillment progress */}
                                {event.regCount > 0 && (
                                    <div className="flex items-center gap-2 shrink-0 w-28 sm:w-36">
                                        <Package size={10} className="text-amber-500 shrink-0" />
                                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 min-w-[60px]">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    event.claimPercent === 100
                                                        ? "bg-gradient-to-r from-cta to-emerald-400"
                                                        : event.claimPercent > 50
                                                            ? "bg-gradient-to-r from-amber-500 to-amber-400"
                                                            : "bg-gradient-to-r from-primary to-orange-400"
                                                )}
                                                style={{ width: `${event.claimPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black italic text-white shrink-0">{event.claimPercent}%</span>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2 shrink-0 ml-auto">
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        asChild
                                        className="bg-white/5 hover:bg-white/10 border-white/10 text-white font-black italic uppercase text-[10px]"
                                    >
                                        <Link href={`/dashboard/organizer/events/${event.id}`}>
                                            Manage
                                        </Link>
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        asChild
                                        className="bg-cta/10 hover:bg-cta/20 border-cta/20 text-cta font-black italic uppercase text-[10px]"
                                    >
                                        <Link href={`/dashboard/organizer/events/${event.id}/scanner`}>
                                            <Scan size={12} /> Scan
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

export const OrganizerActiveEvents = memo(OrganizerActiveEventsComponent);
