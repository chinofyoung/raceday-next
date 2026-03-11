"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor, Calendar, ArrowRight, Users } from "lucide-react";
import Link from "next/link";

export default function KioskSelectPage() {
    const { user } = useAuth();

    const convexEvents = useQuery(api.events.list, user ? {
        organizerId: user._id as any,
        status: "published",
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    const events = convexEvents?.page || [];
    const loading = convexEvents === undefined;

    return (
        <div className="space-y-8 text-white">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                    Kiosk <span className="text-primary">Mode</span>
                </h1>
                <p className="text-text-muted font-medium italic">Select an event to launch kiosk mode.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-2xl space-y-4">
                    <Monitor className="text-text-muted" size={48} />
                    <p className="text-text-muted font-medium italic">No published events available.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event: any) => (
                        <Link
                            key={event._id}
                            href={`/dashboard/organizer/events/${event._id}/kiosk`}
                            className="group p-6 bg-surface/50 border border-white/5 rounded-2xl hover:border-primary/30 transition-all space-y-3"
                        >
                            <div className="flex items-start justify-between">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar size={20} />
                                </div>
                                <ArrowRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-white truncate">{event.name}</h3>
                                <p className="text-xs text-text-muted italic">{event.location || "No location"}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
