"use client";

import { useState, useEffect } from "react";
import { MapPin, Trophy, QrCode, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, toDate } from "@/lib/utils";

interface NextRaceHeroProps {
    registration: {
        id: string;
        _id: string;
        eventId: string;
        status: string;
        categoryId?: string;
        raceNumber?: string;
        raceKitClaimed?: boolean;
        isProxy?: boolean;
        participantInfo?: Record<string, unknown>;
        event: {
            _id: string;
            name: string;
            date: string;
            featuredImage?: string;
            location?: { name: string };
            categories?: Array<{ id: string; name: string }>;
        };
    };
}

function useCountdown(targetDate: Date) {
    const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(getTimeLeft(targetDate));
        }, 60_000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
}

function getTimeLeft(targetDate: Date) {
    const now = Date.now();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isToday: false, isPast: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isToday = days === 0 && hours < 24;

    return { days, hours, minutes, isToday, isPast: false };
}

export function NextRaceHero({ registration }: NextRaceHeroProps) {
    const reg = registration;
    const event = reg.event;
    const eventDate = toDate(event.date);
    const countdown = useCountdown(eventDate);

    const categoryName = event.categories?.find((c) => c.id === reg.categoryId)?.name || reg.categoryId || "Open";

    return (
        <Card className="bg-surface/40 border-primary/20 rounded-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-[100px] -mr-20 -mt-20 opacity-50 mix-blend-screen pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="aspect-[16/9] md:aspect-auto md:min-h-[280px] bg-black/40 relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
                    {event.featuredImage ? (
                        <Image
                            src={event.featuredImage}
                            alt={event.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface to-background flex items-center justify-center">
                            <span className="text-6xl font-bold text-white/10">{event.name?.[0] || "?"}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col gap-4 relative z-10">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={reg.status === "paid" ? "success" : "secondary"}
                            className="text-xs font-semibold uppercase px-2.5 py-0.5 border-none shadow-sm shadow-black/20"
                        >
                            {reg.status}
                        </Badge>
                        {reg.status === "paid" && (
                            <Badge
                                variant={reg.raceKitClaimed ? "cta" : "outline"}
                                className={cn(
                                    "text-xs font-semibold uppercase px-2.5 py-0.5 border-none shadow-sm shadow-black/20",
                                    !reg.raceKitClaimed && "bg-white/5 text-text-muted opacity-80"
                                )}
                            >
                                <Package size={11} className="mr-1 inline" />
                                {reg.raceKitClaimed ? "Kit Collected" : "Kit Pending"}
                            </Badge>
                        )}
                    </div>

                    {/* Event Name */}
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                        {event.name}
                    </h3>

                    {/* Countdown */}
                    <div>
                        {countdown.isPast ? (
                            <span className="text-2xl md:text-3xl font-bold font-heading text-text-muted">
                                In progress
                            </span>
                        ) : countdown.isToday ? (
                            <span className="text-2xl md:text-4xl font-bold font-heading text-primary">
                                Today!
                            </span>
                        ) : (
                            <div>
                                <span className="text-2xl md:text-4xl font-bold font-heading text-primary tracking-tight">
                                    {countdown.days}d {countdown.hours}h {countdown.minutes}m
                                </span>
                                <span className="text-sm text-text-muted font-medium ml-2">until race day</span>
                            </div>
                        )}
                    </div>

                    {/* Detail pills */}
                    <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-white/5 shadow-sm">
                            <MapPin size={12} className="text-cta shrink-0" />
                            <span className="text-white/90">{event.location?.name || "Location TBD"}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-white/5 shadow-sm">
                            <Trophy size={12} className="text-primary shrink-0" />
                            <span className="text-white/90">{categoryName}</span>
                        </span>
                        {reg.raceNumber && (
                            <span className="flex items-center gap-1 bg-primary/10 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-primary/20 text-white shadow-sm">
                                <span className="text-primary font-bold shrink-0">#</span>
                                {reg.raceNumber}
                            </span>
                        )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        {reg.status === "paid" && (
                            <Button asChild className="sm:w-auto">
                                <Link href={`/dashboard/events/${reg.eventId}/qr?regId=${reg.id}`}>
                                    <QrCode size={16} /> View Pass
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild className="sm:w-auto">
                            <Link href={`/events/${reg.eventId}`}>Details</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
