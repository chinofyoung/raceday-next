"use client";

import { User, Trophy, QrCode, Package, MapPin, Upload, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RunnerEventCardProps {
    reg: any;
    isPast?: boolean;
    isPending?: boolean;
}

function getPendingBadgeConfig(manualPaymentStatus?: string): { label: string; className: string } {
    switch (manualPaymentStatus) {
        case "submitted":
            return {
                label: "Awaiting Verification",
                className: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
            };
        case "rejected":
            return {
                label: "Payment Rejected",
                className: "bg-red-500/10 text-red-300 border border-red-500/20",
            };
        case "pending":
            return {
                label: "Payment Pending",
                className: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
            };
        default:
            // Online payment pending (no manualPaymentStatus)
            return {
                label: "Pending Payment",
                className: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
            };
    }
}

export function RunnerEventCard({ reg, isPast, isPending }: RunnerEventCardProps) {
    const categoryName = reg.event?.categories?.find((c: any) => c.id === reg.categoryId)?.name || reg.categoryId;

    return (
        <Card className={cn(
            "flex flex-col pt-0 gap-0 bg-surface/40 border-white/5 hover:bg-surface/60 hover:border-white/10 transition-all duration-300 relative group overflow-hidden shadow-sm hover:shadow-lg cursor-pointer",
            isPast ? "opacity-90 grayscale-[0.3]" : ""
        )}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700 opacity-50 mix-blend-screen pointer-events-none" />
            
            <Link href={`/events/${reg.eventId}`} className="absolute inset-0 z-0" aria-label="View event details" />

            {/* Event Image */}
            <div className="w-full aspect-[3/2] bg-black/40 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors overflow-hidden relative border-b border-white/5 pointer-events-none">
                {reg.event?.featuredImage ? (
                    <Image
                        src={reg.event.featuredImage}
                        alt={`${reg.event?.name || "Event"} featured image`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-1000 ease-out"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface to-surface-muted flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-4xl font-bold text-white/10 group-hover:scale-110 transition-transform">
                            {reg.event?.name?.[0] || "?"}
                        </span>
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="flex flex-col flex-1 gap-3 p-4 z-10 pointer-events-none">

                {/* Title */}
                <h4 className="text-lg font-bold text-white leading-tight tracking-tight line-clamp-2">
                    {reg.event?.name}
                </h4>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    {reg.status === "pending" ? (
                        (() => {
                            const { label, className: badgeCn } = getPendingBadgeConfig(reg.manualPaymentStatus);
                            return (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm shadow-black/20",
                                    badgeCn
                                )}>
                                    <Clock size={11} />
                                    {label}
                                </span>
                            );
                        })()
                    ) : (
                        <Badge
                            variant={reg.status === "paid" ? "success" : "secondary"}
                            className="text-xs font-semibold uppercase px-2.5 py-0.5 border-none shadow-sm shadow-black/20"
                        >
                            {reg.status}
                        </Badge>
                    )}
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

                {/* Proxy indicator */}
                {reg.isProxy && (
                    <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg w-fit border border-indigo-500/20 shadow-inner">
                        <User size={13} />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Proxy: <span className="text-white truncate">{reg.participantInfo?.name || "Self"}</span>
                        </span>
                    </div>
                )}

                {/* Detail pills */}
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5 shadow-sm">
                        <MapPin size={11} className="text-cta shrink-0" />
                        <span className="text-white/90 truncate max-w-[120px]">{reg.event?.location?.name || "Location TBD"}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5 shadow-sm">
                        <Trophy size={11} className="text-primary shrink-0" />
                        <span className="text-white/90">{categoryName}</span>
                    </span>
                    {reg.raceNumber && (
                        <span className="flex items-center gap-1 bg-primary/10 backdrop-blur-sm px-2 py-1 rounded-md border border-primary/20 text-white shadow-sm">
                            <span className="text-primary font-bold shrink-0">#</span>
                            {reg.raceNumber}
                        </span>
                    )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex gap-2 pt-1 z-20 pointer-events-auto">
                    {(!isPast && reg.status === "paid") && (
                        <Button asChild className="flex-1 h-10">
                            <Link href={`/dashboard/events/${reg.eventId}/qr?regId=${reg.id}`}>
                                <QrCode size={16} /> View Pass
                            </Link>
                        </Button>
                    )}
                    {(!isPast && reg.status === "pending" && reg.manualPaymentStatus !== undefined) && (
                        <Button asChild className="flex-1 h-10 bg-primary hover:bg-primary/90">
                            <Link href={`/dashboard/events/${reg.eventId}/qr?regId=${reg.id}`}>
                                <Upload size={16} /> {reg.manualPaymentStatus === "submitted" ? "View Status" : "Upload Proof"}
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" asChild className="flex-1 h-10">
                        <Link href={`/events/${reg.eventId}`}>Details</Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
