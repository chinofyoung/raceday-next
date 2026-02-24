"use client";

import { RaceEvent } from "@/types/event";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { isEventOver, isRegistrationClosed } from "@/lib/earlyBirdUtils";

interface EventHeroProps {
    event: RaceEvent;
    userRegistration: any;
    loadingAuth?: boolean;
}

export function EventHero({ event, userRegistration, loadingAuth }: EventHeroProps) {
    const eventDate = new Date(event.date as unknown as string);
    const isValidDate = !isNaN(eventDate.getTime());

    return (
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
                <div className="flex flex-wrap gap-6 text-white/90 font-bold italic">
                    <div className="flex items-center gap-2"><Calendar size={20} className="text-primary" /> {isValidDate ? format(eventDate, "MMMM d, yyyy") : "TBD"}</div>
                    <div className="flex items-center gap-2"><MapPin size={20} className="text-cta" /> {event.location?.name || "Multiple Locations"}</div>
                </div>
            </div>
        </div>
    );
}
