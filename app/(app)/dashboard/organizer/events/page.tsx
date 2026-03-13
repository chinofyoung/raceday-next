"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { RaceEvent } from "@/types/event";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, MoreVertical, Edit2, Eye, Trash2, Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";

export default function EventsManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get("status") || "all";
    const [filter, setFilter] = useState<string>(initialStatus);
    const [search, setSearch] = useState("");
    const removeEvent = useMutation(api.events.remove);

    const convexEvents = useQuery(api.events.list, user?._id ? {
        organizerId: user._id as Id<"users">,
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    const events = (convexEvents?.page || []).map(e => ({
        ...e,
        id: e._id
    })) as RaceEvent[];

    const loading = authLoading || (!!user && convexEvents === undefined);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            await removeEvent({ id: id as Id<"events"> });
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const filteredEvents = useMemo(() => {
        const query = search.toLowerCase().trim();
        return events.filter(e => {
            const matchesFilter = filter === "all" || e.status === filter;
            const matchesSearch = !query
                || e.name?.toLowerCase().includes(query)
                || e.location?.name?.toLowerCase().includes(query)
                || e.location?.address?.toLowerCase().includes(query);
            return matchesFilter && matchesSearch;
        });
    }, [events, filter, search]);

    if (loading) {
        return (
            <div className="space-y-10">
                {/* Header skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <div className="space-y-1">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-5 w-96" />
                        </div>
                    </div>
                </div>
                {/* Quick actions skeleton */}
                <div className="flex gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-32 rounded-xl" />
                    ))}
                </div>
                {/* Filter bar skeleton */}
                <Skeleton className="h-16 w-full rounded-2xl" />
                {/* Events grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                            <Skeleton className="h-48 w-full" />
                            <div className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex gap-2 pt-2">
                                    <Skeleton className="h-8 w-20 rounded-lg" />
                                    <Skeleton className="h-8 w-20 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Event <span className="text-primary">Management</span></h1>
                        <p className="text-text-muted font-medium">Track registrations, manage categories, and update event details.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {["all", "published", "draft", "cancelled", "completed"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0",
                                filter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-text-muted hover:bg-white/10"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            {filteredEvents.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-20">
                        <Calendar size={48} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">No events found</h3>
                        <p className="text-text-muted font-medium max-w-md mx-auto">
                            {filter === "all"
                                ? "You haven't created any events yet. Click the button above to get started!"
                                : `You don't have any events with status "${filter}".`}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
