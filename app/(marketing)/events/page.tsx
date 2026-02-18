"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Calendar, MapPin, Filter, Loader2, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { EventCardSkeleton } from "@/components/shared/Skeleton";

const DISTANCE_FILTERS = ["All", "5K", "10K", "21K", "42K"];

export default function EventsDirectoryPage() {
    const [events, setEvents] = useState<RaceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Fetch published events ordered by date
            const q = query(
                collection(db, "events"),
                where("status", "==", "published"),
                orderBy("date", "asc")
            );
            const snap = await getDocs(q);
            const eventsData = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RaceEvent[];
            setEvents(eventsData);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDistance = activeFilter === "All" ||
            event.categories?.some(cat => cat.name.includes(activeFilter) || String(cat.distance).includes(activeFilter.replace(/[^0-9.]/g, '')));

        return matchesSearch && matchesDistance;
    });

    return (
        <PageWrapper className="pt-12 pb-24 space-y-12">
            {/* Header & Search */}
            <div className="space-y-8 max-w-5xl">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
                        Find Your <span className="text-primary">Next Race</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium italic">
                        Discover the best running events across the country. Filter by distance, location, or date.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            type="text"
                            placeholder="Search events by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-white/5 rounded-2xl text-text focus:outline-none focus:border-primary transition-all shadow-xl"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 mr-2 text-text-muted">
                        <SlidersHorizontal size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Distance:</span>
                    </div>
                    {DISTANCE_FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={cn(
                                "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all italic border",
                                activeFilter === filter
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} mode="discovery" />
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center space-y-6 bg-surface/20 rounded-[3rem] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                        <Search size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black italic uppercase text-white">No races found</h3>
                        <p className="text-text-muted font-medium max-w-md mx-auto italic px-6">
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
