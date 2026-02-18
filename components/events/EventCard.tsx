import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Calendar,
    MapPin,
    Users,
    Filter,
    Edit2,
    Eye,
    Trash2,
    Tag,
    Trophy,
    ArrowRight,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";
import { RaceEvent } from "@/types/event";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface EventCardProps {
    event: RaceEvent;
    onDelete?: (id: string) => void;
    mode?: "management" | "discovery";
    registrationStatus?: { isRegistered: boolean; isProxy: boolean; status: string };
}

export function EventCard({ event, onDelete, mode = "management", registrationStatus }: EventCardProps) {
    const [paidCount, setPaidCount] = React.useState<number>(0);
    const eventDate = event.date ? (typeof (event.date as any).toDate === 'function' ? (event.date as any).toDate() : new Date(event.date as string | number | Date)) : null;

    React.useEffect(() => {
        const fetchPaidCount = async () => {
            if (!event.id) return;
            try {
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase/config");
                const q = query(
                    collection(db, "registrations"),
                    where("eventId", "==", event.id),
                    where("status", "==", "paid")
                );
                const snap = await getDocs(q);
                setPaidCount(snap.size);
            } catch (err) {
                console.error("Error fetching participant count:", err);
            }
        };
        fetchPaidCount();
    }, [event.id]);

    // Calculate price range
    const prices = event.categories?.map(c => c.price) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const priceDisplay = prices.length > 0
        ? minPrice === maxPrice
            ? `₱${minPrice.toLocaleString()}`
            : `₱${minPrice.toLocaleString()} - ₱${maxPrice.toLocaleString()}`
        : "Free / TBD";

    // Calculate total capacity
    const capacity = event.categories?.reduce((acc, cat) => acc + (cat.maxParticipants || 0), 0) || 0;
    const isNearlyFull = capacity > 0 && paidCount / capacity > 0.8;

    return (
        <Card className="group overflow-hidden border-white/5 flex flex-col h-full bg-surface/40 hover:bg-surface/60 p-0 relative">
            {/* Image Section */}
            <div className="aspect-[16/9] relative overflow-hidden">
                <img
                    src={event.featuredImage || "/placeholder.jpg"}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/10 to-transparent" />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {mode === "management" && (
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md",
                            event.status === "published" ? "bg-green-500/80 text-white" :
                                event.status === "draft" ? "bg-orange-500/80 text-white" : "bg-white/20 text-white"
                        )}>
                            {event.status}
                        </span>
                    )}
                    {mode === "discovery" && event.status === "published" && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md bg-cta text-white">
                            Registration Open
                        </span>
                    )}
                </div>

                {registrationStatus?.isRegistered && (
                    <div className="absolute top-4 right-4 z-20">
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-white",
                            registrationStatus.status === "paid" ? "bg-blue-500/80" : "bg-orange-500/80"
                        )}>
                            <CheckCircle2 size={12} fill="currentColor" className="text-white/20" />
                            {registrationStatus.isProxy ? "Registered for Someone" : "Registered"}
                        </div>
                    </div>
                )}

                {/* Categories Count Badge */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                    {event.categories?.slice(0, 3).map((cat, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[9px] font-bold text-white border border-white/10 uppercase italic">
                            {formatDistance(cat.distance, cat.distanceUnit) || cat.name}
                        </span>
                    ))}
                    {event.categories?.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[9px] font-bold text-white border border-white/10 uppercase italic">
                            +{event.categories.length - 3}
                        </span>
                    )}
                </div>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col gap-4">
                {/* Title & Date */}
                <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {event.name}
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-4">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold italic">
                            <Calendar size={14} className="text-primary" />
                            {eventDate ? format(eventDate, "MMM d, yyyy") : "TBD"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold italic">
                            <MapPin size={14} className="text-primary" />
                            <span className="line-clamp-1">{event.location?.name || "TBA"}</span>
                        </div>
                    </div>
                </div>

                {/* Highlights / Stats Grid */}
                <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/5 mx-[-20px] px-[20px] bg-white/[0.02]">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-widest opacity-60">Entry Fee</p>
                        <div className="flex items-center gap-2">
                            <Tag size={14} className="text-cta" />
                            <span className="text-sm font-black italic text-white">{priceDisplay}</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-widest opacity-60">Participants</p>
                        <div className="flex items-center gap-2 justify-end">
                            <Users size={14} className={cn(isNearlyFull ? "text-orange-500" : "text-blue-400")} />
                            <span className="text-sm font-black italic text-white">
                                {paidCount}{capacity > 0 && <span className="text-text-muted opacity-40 text-[10px] ml-1">/ {capacity}</span>}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    {mode === "management" ? (
                        <>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-white/10" asChild title="Edit Event">
                                    <Link href={`/dashboard/events/${event.id}/edit`}><Edit2 size={16} /></Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-white/10" asChild title="View Details">
                                    <Link href={`/dashboard/events/${event.id}`}><Eye size={16} /></Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 rounded-full hover:bg-red-500/10 hover:text-red-500"
                                    onClick={() => onDelete?.(event.id)}
                                    title="Delete Event"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>

                            <Button variant="outline" size="sm" className="text-[10px] uppercase font-black italic h-8 px-3 border-white/10 hover:bg-primary hover:text-white group/btn" asChild>
                                <Link href={`/dashboard/events/${event.id}`} className="flex items-center gap-1.5">
                                    Manage <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            {event.vanityRaceNumber?.enabled ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                                    <Trophy size={12} className="text-amber-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 italic">
                                        Premium Kits
                                    </span>
                                </div>
                            ) : (
                                <div /> // Spacer or nothing
                            )}
                            <Button variant="primary" size="sm" className="text-[10px] uppercase font-black italic h-8 px-4 bg-primary hover:scale-105 transition-transform group/btn" asChild>
                                <Link href={`/events/${event.id}`} className="flex items-center gap-1.5">
                                    View Details <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
