"use client";

import { useMemo } from "react";
import { RaceEvent } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Edit2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { isEventOver, isRegistrationClosed } from "@/lib/earlyBirdUtils";

interface EventHeroProps {
    event: RaceEvent;
    userRegistration: any;
    loadingAuth?: boolean;
    isOrganizer?: boolean;
}

export function EventHero({ event, userRegistration, loadingAuth, isOrganizer }: EventHeroProps) {
    const eventDate = useMemo(() => new Date(event.date as unknown as string), [event.date]);
    const isValidDate = !isNaN(eventDate.getTime());

    return (
        <div className="relative h-[30vh] md:h-[50vh] w-full overflow-hidden">
            {event.featuredImage && (
                <Image
                    src={event.featuredImage}
                    alt={event.name}
                    fill
                    sizes="100vw"
                    className="object-cover scale-105"
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <Link href="/events" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                        <ArrowLeft size={16} /> Back to Search
                    </Link>
                    {isOrganizer && (
                        <Link
                            href={`/dashboard/organizer/events/${event.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-xl group"
                        >
                            <Edit2 size={14} className="group-hover:text-primary transition-colors" />
                            Edit <span className="hidden sm:inline">Event</span>
                        </Link>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {isEventOver(event) ? (
                            <Badge variant="secondary" className="bg-white/10 text-white px-4 py-1.5 shadow-xl border-none">Event Ended</Badge>
                        ) : isRegistrationClosed(event) ? (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-500 px-4 py-1.5 shadow-xl border-none">Registration Closed</Badge>
                        ) : (
                            <Badge variant="success" className="bg-cta text-white px-4 py-1.5 shadow-xl border-none">Registration Open</Badge>
                        )}
                        {loadingAuth ? (
                            <div className="w-32 h-8 bg-white/10 rounded-full animate-pulse shadow-xl" />
                        ) : userRegistration && (
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
                <div className="flex flex-wrap gap-6 text-white/90 font-semibold uppercase tracking-wide text-xs">
                    <div className="flex items-center gap-2"><Calendar size={20} className="text-primary" /> {isValidDate ? format(eventDate, "MMMM d, yyyy") : "TBD"}</div>
                    <div className="flex items-center gap-2"><MapPin size={20} className="text-cta" /> {event.location?.name || "Multiple Locations"}</div>
                </div>
            </div>
        </div>
    );
}
