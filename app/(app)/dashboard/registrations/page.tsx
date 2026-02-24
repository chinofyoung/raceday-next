"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getRegistrations } from "@/lib/services/registrationService";
import { getEvents } from "@/lib/services/eventService";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow, format } from "date-fns";
import { Search, ArrowLeft, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Registration } from "@/types/registration";
import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";

export default function OrganizerRegistrationsPage() {
    const { user, loading: authLoading } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [events, setEvents] = useState<RaceEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEventId, setSelectedEventId] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eventsRes, regsRes] = await Promise.all([
                getEvents({ organizerId: user!.uid, limitCount: 100, status: "all" }),
                getRegistrations({ organizerId: user!.uid, status: "paid", limitCount: 1000 })
            ]);
            setEvents(eventsRes.items);
            setRegistrations(regsRes.items);
        } catch (error) {
            console.error("Failed to load registrations data", error);
        } finally {
            setLoading(false);
        }
    };

    const enrichedRegistrations = useMemo(() => {
        return registrations.map(reg => {
            const event = events.find(e => e.id === reg.eventId);
            const category = event?.categories?.find(c => c.id === reg.categoryId);
            return {
                ...reg,
                eventName: event?.name || "Unknown Event",
                categoryName: category?.name || reg.categoryId
            };
        });
    }, [registrations, events]);

    const filteredRegistrations = useMemo(() => {
        return enrichedRegistrations.filter(reg => {
            const matchesEvent = selectedEventId === "all" || reg.eventId === selectedEventId;
            const searchTerm = searchQuery.toLowerCase();
            const matchesSearch =
                reg.participantInfo?.name?.toLowerCase().includes(searchTerm) ||
                reg.participantInfo?.email?.toLowerCase().includes(searchTerm) ||
                reg.eventName.toLowerCase().includes(searchTerm) ||
                reg.categoryName.toLowerCase().includes(searchTerm);

            return matchesEvent && matchesSearch;
        });
    }, [enrichedRegistrations, selectedEventId, searchQuery]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedEventId]);

    const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);

    const paginatedRegistrations = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRegistrations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredRegistrations, currentPage]);

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest italic animate-pulse">Loading Registrations...</p>
                </div>
            </PageWrapper>
        );
    }

    const eventOptions = [
        { value: "all", label: "All Events" },
        ...events.map(e => ({ value: e.id, label: e.name }))
    ];

    return (
        <PageWrapper className="pt-8 pb-12 space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-black uppercase tracking-tight italic">All Sign-Ups</h1>
                    </div>
                    <p className="text-text-muted text-sm italic ml-10">Manage and view all runner registrations.</p>
                </div>
            </div>

            <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by runner, email, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={<Search size={16} />}
                        />
                    </div>
                    <div className="w-full md:w-64 shrink-0">
                        <Select
                            options={eventOptions}
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-text-muted italic">
                            <div className="col-span-3">Runner Info</div>
                            <div className="col-span-3">Event & Category</div>
                            <div className="col-span-2">Contact</div>
                            <div className="col-span-2">Registration Date</div>
                            <div className="col-span-2 text-right">Status</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-white/5">
                            {paginatedRegistrations.length > 0 ? (
                                paginatedRegistrations.map((reg) => (
                                    <div key={reg.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/[0.02] transition-colors">
                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic text-sm uppercase shrink-0">
                                                {reg.participantInfo?.name?.charAt(0) || "?"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white uppercase italic truncate">
                                                    {reg.participantInfo?.name || "Unknown"}
                                                </p>
                                                {reg.isProxy && (
                                                    <p className="text-[10px] text-text-muted italic truncate">Registered by {reg.registeredByName}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-3 min-w-0">
                                            <p className="text-xs font-bold text-white italic truncate">{reg.eventName}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest italic truncate">{reg.categoryName}</p>
                                        </div>
                                        <div className="col-span-2 min-w-0">
                                            <p className="text-xs text-text-muted truncate">{reg.participantInfo?.email}</p>
                                            <p className="text-[10px] text-text-muted truncate">{reg.participantInfo?.phone}</p>
                                        </div>
                                        <div className="col-span-2 text-xs text-text-muted">
                                            {reg.createdAt
                                                ? ('seconds' in reg.createdAt
                                                    ? format(reg.createdAt.toDate(), "MMM d, yyyy h:mm a")
                                                    : format(reg.createdAt as Date, "MMM d, yyyy h:mm a"))
                                                : 'Unknown'}
                                        </div>
                                        <div className="col-span-2 flex flex-col items-end gap-1 shrink-0">
                                            <div className="flex gap-1.5">
                                                {reg.status === "paid" ? (
                                                    <Badge variant="success" className="bg-green-500/20 text-green-400 border-none text-[8px] font-black italic uppercase px-2 py-0.5">Paid</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[8px] font-black italic uppercase px-2 py-0.5">{reg.status}</Badge>
                                                )}
                                            </div>
                                            {reg.raceKitClaimed ? (
                                                <Badge variant="success" className="bg-cta/20 text-cta border-none text-[8px] font-black italic uppercase px-2 py-0.5 mt-1">Kit Claimed</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-white/10 text-text-muted text-[8px] font-black italic uppercase px-2 py-0.5 mt-1">Pending Kit</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <Users className="text-text-muted opacity-10 mb-4" size={48} />
                                    <p className="text-text-muted text-sm font-medium italic">No registrations found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <p className="text-xs text-text-muted italic">
                            Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRegistrations.length)}</span> of <span className="font-bold text-white">{filteredRegistrations.length}</span> sign-ups
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="border-white/10 text-text-muted hover:text-white hover:bg-white/5 px-3 py-1.5 min-w-0"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="border-white/10 text-text-muted hover:text-white hover:bg-white/5 px-3 py-1.5 min-w-0"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </PageWrapper>
    );
}
