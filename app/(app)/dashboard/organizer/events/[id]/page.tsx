"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RaceEvent } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Users, DollarSign, Calendar, MapPin,
    Edit2, Download, Search, QrCode, CheckCircle2, Copy, Monitor
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnnouncementsTab } from "@/components/dashboard/AnnouncementsTab";
import dynamic from "next/dynamic";
import { BaseQuickAction } from "@/components/dashboard/shared/BaseQuickAction";
import { VolunteerManagement } from "@/components/dashboard/organizer/VolunteerManagement";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";

const DemographicsTab = dynamic(
    () => import("@/components/dashboard/organizer/DemographicsTab").then(mod => mod.DemographicsTab),
    {
        ssr: false,
        loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    }
);

export default function EventDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { user, role, loading: authLoading } = useAuth();

    // Safety check: is this possibly a Convex ID?
    const isConvexId = id && id.length > 20;

    // Use Convex Queries
    const eventData = useQuery(api.events.getById, (id && isConvexId) ? { id: id as Id<"events"> } : "skip");
    const registrationsData = useQuery(api.registrations.list, (id && isConvexId) ? {
        eventId: id as Id<"events">,
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    // Fetch volunteer record to determine permissions client-side (replaces the /api/events/:id/check-access fetch)
    const volunteerRecord = useQuery(
        api.volunteers.getByUserIdAndEvent,
        (user?._id && id && isConvexId) ? { userId: user._id as Id<"users">, eventId: id as Id<"events"> } : "skip"
    );

    const cloneMutation = useMutation(api.events.clone);

    const [activeTab, setActiveTab] = useState<string>("participants");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("paid");

    const event = useMemo(() => {
        if (!eventData) return null;
        return {
            ...eventData,
            id: eventData._id,
        } as unknown as RaceEvent;
    }, [eventData]);

    const registrations = useMemo(() => {
        if (!registrationsData) return [];
        return registrationsData.page.map((r: any) => ({
            ...r,
            id: r._id,
            ...(r.registrationData || {})
        }));
    }, [registrationsData]);

    const isOrganizer = event?.organizerId === user?._id || role === "admin";

    // Derive permissions from the volunteer record directly — no API fetch needed
    const permissions: string[] = useMemo(() => {
        if (isOrganizer) return [];
        return (volunteerRecord?.permissions as string[]) ?? [];
    }, [isOrganizer, volunteerRecord]);

    const availableTabs = (["participants", "stats", "revenue", "announcements", "volunteers"] as const).filter(tab => {
        if (isOrganizer) return true;
        if (tab === "participants") return permissions.includes("participants") || permissions.includes("kiosk");
        if (tab === "announcements") return permissions.includes("announcements");
        return false;
    });

    useEffect(() => {
        if (availableTabs.length > 0 && !availableTabs.includes(activeTab as any)) {
            setActiveTab(availableTabs[0]);
        }
    }, [availableTabs, activeTab]);

    // volunteerRecord === undefined means the query is still loading; null means no record found (not a volunteer)
    const volunteerLoading = !isOrganizer && volunteerRecord === undefined && user !== undefined;
    const loading = authLoading || volunteerLoading || (id && isConvexId && (eventData === undefined || registrationsData === undefined));

    if (loading) {
        return (
            <div className="space-y-12">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 w-2/3" />
                        <div className="flex gap-4">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-6 rounded-xl border border-border bg-card space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex gap-8 border-b border-white/5 pb-px">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-20" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">Event not found</h1>
                    <Button asChild variant="primary"><Link href="/dashboard/organizer">Back to Dashboard</Link></Button>
                </div>
            </div>
        );
    }

    const paidRegistrations = registrations.filter((r: any) => r.status === "paid");
    const totalRevenue = paidRegistrations.reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0);

    const filteredParticipants = registrations.filter((r: any) => {
        const name = r.participantInfo?.name?.toLowerCase() || "";
        const bib = (r.raceNumber?.toLowerCase() || "");
        const email = r.participantInfo?.email?.toLowerCase() || "";
        const search = searchQuery.toLowerCase();

        const matchesSearch = name.includes(search) || bib.includes(search) || email.includes(search);
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const parsedDate = event.date ? new Date(event.date as any) : null;
    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

    return (
        <div className="space-y-12">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                    <div className="space-y-4">
                        <Link href="/dashboard/organizer" className="md:hidden text-text-muted hover:text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors mb-4">
                            <ArrowLeft size={12} /> Back to Dashboard
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="primary" className="bg-primary/10 text-primary border-none text-xs font-semibold uppercase px-3 py-1">
                                    {isOrganizer ? "Organizer" : "Volunteer"}
                                </Badge>
                                {event.status === "draft" && (
                                    <Badge variant="secondary" className="bg-white/5 text-text-muted border-none text-xs font-semibold uppercase px-3 py-1">Draft</Badge>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[0.9]">
                                {event.name}
                            </h1>
                            <div className="flex flex-wrap gap-4 mt-6 text-sm font-bold text-text-muted uppercase">
                                <span className="flex items-center gap-2">
                                    <Calendar size={16} className="text-primary" />
                                    {isValidDate ? format(parsedDate, "MMMM d, yyyy") : "TBA"}
                                </span>
                                <span className="flex items-center gap-2">
                                    <MapPin size={16} className="text-cta" />
                                    {event.location?.name || "Location TBD"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isOrganizer && (
                        <>
                            <BaseQuickAction
                                href={`/dashboard/organizer/events/${id}/edit`}
                                icon={Edit2}
                                label="Edit Event"
                                variant="primary"
                            />
                            <BaseQuickAction
                                onClick={async () => {
                                    if (confirm("Create a copy of this event?")) {
                                        const promise = cloneMutation({ id: id as Id<"events"> })
                                            .then(async newId => {
                                                router.push(`/dashboard/organizer/events/${newId}/edit`);
                                                return newId;
                                            });

                                        toast.promise(promise, {
                                            loading: 'Duplicating event...',
                                            success: 'Event cloned successfully!',
                                            error: 'Failed to duplicate event.',
                                        });
                                    }
                                }}
                                icon={Copy}
                                label="Clone"
                                variant="secondary"
                            />
                        </>
                    )}
                    {(isOrganizer || permissions.includes("kiosk")) && (
                        <BaseQuickAction
                            href={`/dashboard/organizer/events/${id}/kiosk`}
                            icon={Monitor}
                            label="Kiosk Mode"
                            variant="cta"
                        />
                    )}
                </div>

                {/* Stats Grid */}
                {(isOrganizer || permissions.includes("participants") || permissions.includes("kiosk")) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Participants</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-bold text-white">{paidRegistrations.length}</p>
                                <Users size={24} className="text-primary opacity-20" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Revenue</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-bold text-white">
                                    {isOrganizer ? `₱${totalRevenue.toLocaleString()}` : "Locked"}
                                </p>
                                <DollarSign size={24} className="text-green-500 opacity-20" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Claimed Kits</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-bold text-white">{paidRegistrations.filter((r: any) => r.raceKitClaimed).length}</p>
                                <CheckCircle2 size={24} className="text-cta opacity-20" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Conversion Rate</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-bold text-white">
                                    {registrations.length > 0 ? `${Math.round((paidRegistrations.length / registrations.length) * 100)}%` : "0%"}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="flex gap-8 border-b border-white/5 pb-px overflow-x-auto scrollbar-none">
                    {availableTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-4 text-xs font-bold uppercase tracking-wider transition-all relative",
                                activeTab === tab ? "text-primary" : "text-text-muted hover:text-white"
                            )}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === "participants" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, bib number, or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary transition-all font-medium"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex bg-surface p-1 rounded-xl border border-white/5 h-fit">
                                        {(["paid", "pending", "all"] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={cn(
                                                    "px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg",
                                                    statusFilter === s ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    {isOrganizer && (
                                        <Button asChild variant="outline" size="sm" className="gap-2 font-bold">
                                            <a href={`/api/events/${id}/export?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`} download>
                                                <Download size={14} /> Export
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Card className="overflow-hidden bg-surface border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Runner</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Category</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Bib #</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Kit Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted text-right">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredParticipants.length > 0 ? filteredParticipants.map((reg: any) => (
                                                <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                                {reg.participantInfo?.name?.charAt(0) || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white uppercase">{reg.participantInfo?.name}</p>
                                                                <p className="text-xs text-text-muted font-medium">{reg.participantInfo?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-bold text-white uppercase">
                                                            {event.categories.find(c => (c.id || "0") === reg.categoryId)?.name || reg.categoryId}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-primary">#{reg.raceNumber || "---"}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {reg.raceKitClaimed ? (
                                                            <Badge variant="success" className="bg-cta text-white border-none uppercase text-xs font-semibold tracking-wider">Claimed</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-white/10 text-text-muted uppercase text-xs font-semibold tracking-wider">Unclaimed</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className={cn(
                                                            "text-xs font-bold uppercase tracking-wider leading-none mb-1",
                                                            reg.status === "paid" ? "text-green-500" : "text-cta"
                                                        )}>
                                                            {reg.status}
                                                        </p>
                                                        <p className="text-xs font-bold text-white">₱{reg.totalPrice}</p>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center space-y-4">
                                                        <Users className="mx-auto text-text-muted opacity-10" size={48} />
                                                        <p className="text-text-muted font-medium">No records found.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "stats" && isOrganizer && (
                        <DemographicsTab event={event} registrations={registrations} />
                    )}

                    {activeTab === "revenue" && isOrganizer && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="p-8 bg-surface border-white/5 space-y-6">
                                <h3 className="text-xl font-bold tracking-tight text-white">Revenue by Category</h3>
                                <div className="space-y-4">
                                    {event.categories.map((cat, i) => {
                                        const catRegs = paidRegistrations.filter((r: any) => r.categoryId === (cat.id || cat.name));
                                        const catRev = catRegs.reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0);
                                        return (
                                            <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-white">{cat.name}</p>
                                                    <p className="text-xs text-text-muted">{catRegs.length} registered • ₱{cat.price}/each</p>
                                                </div>
                                                <p className="text-lg font-bold text-green-500">₱{catRev.toLocaleString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                            <Card className="p-8 bg-surface border-white/5 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                <h3 className="text-xl font-bold tracking-tight text-white relative z-10">Event Summary</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Revenue</p>
                                        <p className="text-2xl font-bold font-green-500">₱{totalRevenue.toLocaleString()}</p>
                                    </div>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        This includes all paid registrations and vanity number premiums.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}


                    {activeTab === "announcements" && (
                        <div className="space-y-6">
                            <AnnouncementsTab eventId={event.id} />
                        </div>
                    )}

                    {activeTab === "volunteers" && isOrganizer && (
                        <div className="space-y-6">
                            <VolunteerManagement eventId={event.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
