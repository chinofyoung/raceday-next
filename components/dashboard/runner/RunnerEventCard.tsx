"use client";

import { User, Trophy, QrCode, Package, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RunnerEventCardProps {
    reg: any;
    isPast?: boolean;
}

export function RunnerEventCard({ reg, isPast }: RunnerEventCardProps) {
    const categoryName = reg.event?.categories?.find((c: any) => c.id === reg.categoryId)?.name || reg.categoryId;

    return (
        <Card key={reg.id} className={cn("p-4 sm:p-5 lg:p-4 bg-surface/40 border-white/5 hover:bg-surface/60 hover:border-white/10 transition-all duration-300 relative group overflow-hidden shadow-sm hover:shadow-lg flex flex-col sm:flex-row gap-4 lg:gap-5", isPast ? "opacity-90 grayscale-[0.3]" : "")}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700 opacity-50 mix-blend-screen pointer-events-none" />

            {/* Event Image */}
            <div className="w-full sm:w-40 lg:w-56 aspect-[2/1] sm:aspect-[3/4] lg:aspect-[4/3] rounded-xl bg-black/40 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0 overflow-hidden relative border border-white/5 shadow-inner z-10">
                {reg.event?.featuredImage ? (
                    <Image
                        src={reg.event.featuredImage}
                        alt={`${reg.event?.name || "Event"} featured image`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 160px, 224px"
                        className="object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-1000 ease-out"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface to-surface-muted flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-4xl font-black italic text-white/10 group-hover:scale-110 transition-transform uppercase">
                            {reg.event?.name?.[0] || "?"}
                        </span>
                    </div>
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
                        <span className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm"><Trophy size={14} className="text-primary shrink-0" /> <span className="text-white/90">{categoryName}</span></span>
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
                            <Link href={`/dashboard/events/${reg.eventId}/qr?regId=${reg.id}`}>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative flex items-center justify-center"><QrCode size={16} className="mr-2" /> View Pass</span>
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" asChild className="w-full sm:flex-1 lg:flex-none lg:w-auto lg:px-6 font-black italic uppercase border-white/10 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 shadow-sm h-10 lg:h-10 text-xs">
                        <Link href={`/events/${reg.eventId}`}>Details</Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
