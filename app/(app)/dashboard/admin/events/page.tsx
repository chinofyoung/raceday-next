"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Calendar, Search, Filter, ArrowLeft, Loader2,
    MapPin, Users, Trophy, MoreVertical, Star,
    XCircle, Trash2, ExternalLink, Eye
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { RaceEvent } from "@/types/event";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { logAdminAction } from "@/lib/admin/audit";
import { exportToCSV } from "@/lib/admin/export";
import { Download } from "lucide-react";

export default function AdminEventManagementPage() {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<RaceEvent[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RaceEvent[]);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeature = async (event: RaceEvent) => {
        setProcessing(event.id);
        try {
            await updateDoc(doc(db, "events", event.id), { featured: !event.featured });

            // Log action
            if (currentUser) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    event.featured ? "unfeature_event" : "feature_event",
                    event.id,
                    event.name
                );
            }

            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, featured: !e.featured } : e));
        } catch (error) {
            console.error("Error featuring event:", error);
        } finally {
            setProcessing(null);
        }
    };

    const handleCancel = async (id: string) => {
        const reason = prompt("Enter cancellation reason:");
        if (reason === null) return;

        setProcessing(id);
        try {
            await updateDoc(doc(db, "events", id), { status: "cancelled", cancellationReason: reason });

            // Log action
            const targetEvent = events.find(e => e.id === id);
            if (currentUser && targetEvent) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    "cancel_event",
                    id,
                    targetEvent.name,
                    reason
                );
            }

            setEvents(prev => prev.map(e => e.id === id ? { ...e, status: "cancelled" } : e));
        } catch (error) {
            console.error("Error cancelling event:", error);
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This is IRREVERSIBLE. All associated registrations will lose their event link.")) return;

        setProcessing(id);
        try {
            const targetEvent = events.find(e => e.id === id);
            await deleteDoc(doc(db, "events", id));

            // Log action
            if (currentUser && targetEvent) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    "delete_event",
                    id,
                    targetEvent.name
                );
            }

            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting event:", error);
        } finally {
            setProcessing(null);
        }
    };

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    const handleExport = () => {
        const exportData = filteredEvents.map(e => ({
            Name: e.name,
            Organizer: e.organizerId,
            Date: formatDate(e.date),
            Location: e.location.name,
            Status: e.status,
            Featured: e.featured ? "Yes" : "No",
            Categories: e.categories?.length || 0
        }));
        exportToCSV(exportData, `raceday-events-${formatDate(new Date())}`);
    };

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard/admin" className="text-primary hover:underline flex items-center gap-1 text-[10px] font-black uppercase italic tracking-widest">
                            <ArrowLeft size={12} /> Dashboard
                        </Link>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        Global <span className="text-primary">Event Oversight</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Manage, feature, and audit all platform events.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
                        <Download size={18} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                    {["all", "published", "draft", "cancelled", "completed"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                statusFilter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-text-muted hover:bg-white/10"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-96 text-white">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search events by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm italic font-medium focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
                    />
                </div>
            </div>

            {/* Event List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredEvents.length === 0 ? (
                    <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                        <Calendar className="mx-auto text-text-muted opacity-20" size={48} />
                        <p className="text-text-muted italic font-medium uppercase tracking-widest text-xs">No events found.</p>
                    </Card>
                ) : (
                    filteredEvents.map((event) => (
                        <Card key={event.id} className="p-6 bg-surface/40 border-white/5 hover:bg-surface/60 transition-all relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />

                            <div className="flex flex-col lg:flex-row gap-8 items-center relative z-10">
                                {/* Media */}
                                <div className="w-full lg:w-32 aspect-video lg:aspect-square rounded-2xl overflow-hidden border border-white/5 shrink-0 relative">
                                    {event.featuredImage ? (
                                        <img src={event.featuredImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-text-muted italic font-black uppercase text-[10px]">No Image</div>
                                    )}
                                    {event.featured && (
                                        <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-lg">
                                            <Star size={12} fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-xl font-black italic uppercase text-white leading-tight">{event.name}</h3>
                                                <Badge className="text-[8px] font-black uppercase italic tracking-widest">
                                                    {event.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-[10px] font-bold text-text-muted uppercase italic tracking-widest">
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-cta" /> {event.location?.name || "TBD"}</span>
                                                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> {formatDate(event.date)}</span>
                                                <span className="flex items-center gap-1.5"><Trophy size={12} className="text-blue-500" /> {event.categories?.length || 0} Categories</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={cn(
                                                    "h-10 w-10 p-0 rounded-xl transition-all",
                                                    event.featured ? "text-primary bg-primary/10" : "text-text-muted hover:bg-white/5 hover:text-primary"
                                                )}
                                                onClick={() => handleFeature(event)}
                                                disabled={processing === event.id}
                                                title={event.featured ? "Unfeature Event" : "Feature Event"}
                                            >
                                                <Star size={18} fill={event.featured ? "currentColor" : "none"} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-10 w-10 p-0 rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                onClick={() => handleCancel(event.id)}
                                                disabled={processing === event.id || event.status === "cancelled"}
                                                title="Cancel Event"
                                            >
                                                <XCircle size={18} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-10 w-10 p-0 rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                onClick={() => handleDelete(event.id)}
                                                disabled={processing === event.id}
                                                title="Delete Event"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" size="sm" asChild className="font-black italic uppercase text-[10px] tracking-widest">
                                            <Link href={`/events/${event.id}`} target="_blank"><ExternalLink size={12} className="mr-2" /> View Public Page</Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="font-black italic uppercase text-[10px] tracking-widest">
                                            <Link href={`/dashboard/events/${event.id}`}><Eye size={12} className="mr-2" /> View Dashboard</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </PageWrapper>
    );
}
