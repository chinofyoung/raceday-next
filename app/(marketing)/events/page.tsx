"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { RaceEvent } from "@/types/event";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Search, Calendar, MapPin, Filter, Loader2, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function EventCardSkeleton() {
    return (
        <div className="rounded-xl bg-surface/30 border border-white/5 overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        </div>
    );
}
import { useAuth } from "@/lib/hooks/useAuth";
import { isEventOver } from "@/lib/earlyBirdUtils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const DISTANCE_FILTERS = ["All", "5K", "10K", "21K", "42K"];

export default function EventsDirectoryPage() {
    const { user } = useAuth();

    // Convex queries
    const convexEvents = useQuery(api.events.list, {
        status: "published",
        paginationOpts: { numItems: 100, cursor: null }
    });

    const convexRegistrations = useQuery(api.registrations.getByUserId, user?._id ? {
        userId: user._id as Id<"users">
    } : "skip");

    const events = (convexEvents?.page || []).map(e => ({
        ...e,
        id: e._id // Map _id to id for compatibility with EventCard and types
    })) as RaceEvent[];

    const loading = convexEvents === undefined;
    const userRegistrations = convexRegistrations || [];

    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const getRegistrationStatus = (eventId: string) => {
        const reg = userRegistrations.find(r => r.eventId === eventId);
        if (!reg) return undefined;
        return {
            isRegistered: true,
            isProxy: (reg as any).isProxy || false,
            status: reg.status
        };
    };

    const { filteredEvents, upcomingEvents, pastEvents } = useMemo(() => {
        const filtered = events.filter(event => {
            const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDistance = activeFilter === "All" ||
                event.categories?.some(cat => cat.name.includes(activeFilter) || String(cat.distance).includes(activeFilter.replace(/[^0-9.]/g, '')));

            return matchesSearch && matchesDistance;
        });

        return {
            filteredEvents: filtered,
            upcomingEvents: filtered.filter(e => !isEventOver(e)),
            // Reverse past events to show the most recently ended events first
            pastEvents: filtered.filter(e => isEventOver(e)).reverse(),
        };
    }, [events, searchTerm, activeFilter]);

    return (
        <PageWrapper className="pt-12 space-y-12">
            {/* Header & Search */}
            <div className="space-y-8 max-w-5xl">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        Find your <span className="text-primary">next race</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-normal">
                        Discover the best running events across the country. Filter by distance, location, or date.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row max-w-lg gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted group-focus-within:text-primary transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search events by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-surface/50 border border-white/5 rounded-xl text-text focus:outline-none focus:border-primary transition-all shadow-xl"
                        />
                        {searchTerm.length > 0 && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer p-1"
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [mask-image:linear-gradient(to_right,black_85%,transparent_100%)] sm:[mask-image:none]">
                    <div className="flex items-center gap-2 mr-2 text-text-muted shrink-0">
                        <SlidersHorizontal size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Distance:</span>
                    </div>
                    {DISTANCE_FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={cn(
                                "px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border shrink-0",
                                activeFilter === filter
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-surface/50 border-white/5 text-text-muted hover:border-white/20"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Event List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <EventCardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="space-y-16">
                    {upcomingEvents.length > 0 && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-bold tracking-tight text-white">Upcoming <span className="text-primary">races</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {upcomingEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        mode="discovery"
                                        registrationStatus={getRegistrationStatus(event.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {pastEvents.length > 0 && (
                        <div className="space-y-8 border-t border-white/5 pt-12">
                            <h2 className="text-3xl font-bold tracking-tight text-text-muted">Past events</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75 grayscale-[20%]">
                                {pastEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        mode="discovery"
                                        registrationStatus={getRegistrationStatus(event.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-32 text-center space-y-6 bg-surface/20 rounded-2xl border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                        <Search size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">No races found</h3>
                        <p className="text-text-muted font-normal max-w-md mx-auto px-6">
                            We couldn&apos;t find any events matching your search criteria. Try different filters or search terms.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => { setSearchTerm(""); setActiveFilter("All"); }}>
                        Clear All Filters
                    </Button>
                </div>
            )}
        </PageWrapper>
    );
}
