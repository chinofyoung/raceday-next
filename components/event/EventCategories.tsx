"use client";

import { RaceEvent, EventCategory } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Timer, Users, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { cn, formatDistance } from "@/lib/utils";
import { isEarlyBirdActive, isRegistrationClosed, isEventOver, isCategoryFull } from "@/lib/earlyBirdUtils";

interface EventCategoriesProps {
    event: RaceEvent;
    formatTimeAMPM: (timeStr: string) => string;
}

export function EventCategories({ event, formatTimeAMPM }: EventCategoriesProps) {
    return (
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
                                                        (cat.registeredCount || 0) >= cat.maxParticipants ? "text-red-500" : "text-primary"
                                                    )}>
                                                        {(cat.registeredCount || 0) >= cat.maxParticipants ? "SOLD OUT" : "Limited Slots"}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-text-muted italic">
                                                        {Math.max(0, cat.maxParticipants - (cat.registeredCount || 0))} left
                                                    </span>
                                                </div>
                                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, ((cat.registeredCount || 0) / cat.maxParticipants) * 100)}%` }}
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
                                                <span className="text-[10px] font-black italic text-white">{(cat.registeredCount || 0)} <span className="text-primary">Joined</span></span>
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
    );
}
