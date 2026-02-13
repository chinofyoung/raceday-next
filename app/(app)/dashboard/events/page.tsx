"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAuth } from "@/lib/hooks/useAuth";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { Plus, Search, Filter, MoreVertical, Edit2, Eye, Trash2, Calendar, MapPin, Users, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function EventsManagementPage() {
    const { user, role } = useAuth();
    const [events, setEvents] = useState<RaceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "events"),
                where("organizerId", "==", user?.uid),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const eventData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RaceEvent[];
            setEvents(eventData);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const filteredEvents = events.filter(e => filter === "all" || e.status === filter);

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/dashboard" className="text-text-muted text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-widest italic">
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Event <span className="text-primary">Management</span></h1>
                        <p className="text-text-muted font-medium italic">Track registrations, manage categories, and update event details.</p>
                    </div>
                </div>
                <Button variant="primary" asChild className="gap-2">
                    <Link href="/dashboard/events/create"><Plus size={20} /> Create New Event</Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {["all", "published", "draft", "cancelled", "completed"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shrink-0",
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
                        <h3 className="text-xl font-bold uppercase italic text-white">No events found</h3>
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
        </PageWrapper>
    );
}
