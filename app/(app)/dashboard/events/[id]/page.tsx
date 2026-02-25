"use client";

import { useEffect, useState, useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAuth } from "@/lib/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Loader2, ArrowLeft, Users, DollarSign, Calendar, MapPin,
    Edit2, Download, Search, QrCode, CheckCircle2, Copy, Monitor
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnnouncementsTab } from "@/components/dashboard/AnnouncementsTab";
import { DemographicsTab } from "@/components/dashboard/organizer/DemographicsTab";
import { BaseQuickAction } from "@/components/dashboard/shared/BaseQuickAction";
import { VolunteerManagement } from "@/components/dashboard/organizer/VolunteerManagement";
import { toast } from "sonner";

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, role } = useAuth();
    const [event, setEvent] = useState<RaceEvent | null>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("participants");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("paid");
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        if (id && user) {
            fetchEventData();
        }
    }, [id, user]);

    const fetchEventData = async () => {
        setLoading(true);
        try {
            // Check Access & Fetch Permissions
            const accessRes = await fetch(`/api/events/${id}/check-access`);
            if (!accessRes.ok) throw new Error("Access denied");
            const accessData = await accessRes.json();

            const canAccess = accessData.isOrganizer || accessData.isAdmin || accessData.permissions.length > 0;
            setPermissions(accessData.permissions || []);

            if (!canAccess) {
                setEvent(null);
                setLoading(false);
                return;
            }

            // Fetch Event
            const docRef = doc(db, "events", id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const eventData = { ...snap.data(), id: snap.id } as RaceEvent;
                setEvent(eventData);

                // Fetch Registrations
                const q = query(
                    collection(db, "registrations"),
                    where("eventId", "==", id)
                );
                const regSnap = await getDocs(q);
                setRegistrations(regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        } catch (error) {
            console.error("Error fetching event data:", error);
            setEvent(null);
        } finally {
            setLoading(false);
        }
    };

    const isOrganizer = event?.organizerId === user?.uid || role === "admin";

    const availableTabs = (["participants", "stats", "revenue", "bibs", "announcements", "volunteers"] as const).filter(tab => {
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

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    if (!event) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white uppercase italic">Event not found</h1>
                    <Button asChild variant="primary"><Link href="/dashboard">Back to Dashboard</Link></Button>
                </div>
            </PageWrapper>
        );
    }

    const paidRegistrations = registrations.filter(r => r.status === "paid");
    const totalRevenue = paidRegistrations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    const filteredParticipants = registrations.filter(r => {
        const name = r.participantInfo?.name?.toLowerCase() || "";
        const bib = (r.raceNumber?.toLowerCase() || "");
        const email = r.participantInfo?.email?.toLowerCase() || "";
        const search = searchQuery.toLowerCase();

        const matchesSearch = name.includes(search) || bib.includes(search) || email.includes(search);
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const parsedDate = event.date ? (typeof (event.date as any).toDate === 'function' ? (event.date as any).toDate() : new Date(event.date as any)) : null;
    const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

    return (
        <PageWrapper className="py-12 space-y-12">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                    <div className="space-y-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-white transition-colors group w-fit">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="primary" className="bg-primary/10 text-primary border-none text-[10px] font-black italic uppercase px-3 py-1">
                                    {isOrganizer ? "Organizer" : "Volunteer"}
                                </Badge>
                                {event.status === "draft" && (
                                    <Badge variant="secondary" className="bg-white/5 text-text-muted border-none text-[10px] font-black italic uppercase px-3 py-1">Draft</Badge>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
                                {event.name}
                            </h1>
                            <div className="flex flex-wrap gap-4 mt-6 text-sm font-bold text-text-muted uppercase italic">
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
                                href={`/dashboard/events/${id}/edit`}
                                icon={Edit2}
                                label="Edit Event"
                                variant="primary"
                            />
                            <BaseQuickAction
                                onClick={async () => {
                                    if (confirm("Create a copy of this event?")) {
                                        const promise = fetch(`/api/events/${id}/clone`, { method: "POST" })
                                            .then(async res => {
                                                const data = await res.json();
                                                if (data.success) {
                                                    router.push(`/dashboard/events/${data.newId}/edit`);
                                                    return data;
                                                }
                                                throw new Error("Clone failed");
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
                            href={`/dashboard/events/${id}/kiosk`}
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Participants</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-black italic text-white">{paidRegistrations.length}</p>
                                <Users size={24} className="text-primary opacity-20" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Revenue</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-black italic text-white">
                                    {isOrganizer ? `₱${totalRevenue.toLocaleString()}` : "Locked"}
                                </p>
                                <DollarSign size={24} className="text-green-500 opacity-20" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Claimed Kits</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-black italic text-white">{paidRegistrations.filter(r => r.raceKitClaimed).length}</p>
                                <CheckCircle2 size={24} className="text-cta opacity-20" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-surface border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Conversion Rate</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-black italic text-white">
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
                                "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary transition-all font-medium italic"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex bg-surface p-1 rounded-xl border border-white/5 h-fit">
                                        {(["paid", "pending", "all"] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={cn(
                                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                                                    statusFilter === s ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    {isOrganizer && (
                                        <Button asChild variant="outline" size="sm" className="gap-2 font-black italic uppercase">
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
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted italic">Runner</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted italic">Category</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted italic">Bib #</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted italic">Kit Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted italic text-right">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredParticipants.length > 0 ? filteredParticipants.map((reg) => (
                                                <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic text-xs uppercase">
                                                                {reg.participantInfo?.name?.charAt(0) || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white uppercase italic">{reg.participantInfo?.name}</p>
                                                                <p className="text-[10px] text-text-muted font-medium italic">{reg.participantInfo?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-bold text-white uppercase italic">
                                                            {event.categories.find(c => (c.id || "0") === reg.categoryId)?.name || reg.categoryId}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-primary italic">#{reg.raceNumber || "---"}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {reg.raceKitClaimed ? (
                                                            <Badge variant="success" className="bg-cta text-white border-none uppercase text-[8px] font-black italic tracking-widest">Claimed</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-white/10 text-text-muted uppercase text-[8px] font-black italic tracking-widest">Unclaimed</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className={cn(
                                                            "text-[10px] font-black uppercase italic tracking-widest leading-none mb-1",
                                                            reg.status === "paid" ? "text-green-500" : "text-cta"
                                                        )}>
                                                            {reg.status}
                                                        </p>
                                                        <p className="text-[11px] font-black text-white italic">₱{reg.totalPrice}</p>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center space-y-4">
                                                        <Users className="mx-auto text-text-muted opacity-10" size={48} />
                                                        <p className="text-text-muted italic font-medium">No records found.</p>
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
                                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Revenue by Category</h3>
                                <div className="space-y-4">
                                    {event.categories.map((cat, i) => {
                                        const catRegs = paidRegistrations.filter(r => r.categoryId === (cat.id || cat.name));
                                        const catRev = catRegs.reduce((sum, r) => sum + r.basePrice, 0);
                                        return (
                                            <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-white uppercase italic">{cat.name}</p>
                                                    <p className="text-xs text-text-muted">{catRegs.length} registered • ₱{cat.price}/each</p>
                                                </div>
                                                <p className="text-lg font-black italic text-green-500">₱{catRev.toLocaleString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                            <Card className="p-8 bg-surface border-white/5 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white relative z-10">Event Summary</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                        <p className="text-xs font-bold text-text-muted uppercase italic tracking-widest text-[10px]">Total Revenue</p>
                                        <p className="text-2xl font-black italic font-green-500">₱{totalRevenue.toLocaleString()}</p>
                                    </div>
                                    <p className="text-[10px] text-text-muted italic leading-relaxed">
                                        This includes all paid registrations and vanity number premiums.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "bibs" && isOrganizer && (
                        <Card className="p-8 bg-surface border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Bib Number Settings</h3>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="font-black italic uppercase"
                                    onClick={async () => {
                                        if (confirm("Auto-assign bib numbers?")) {
                                            const res = await fetch(`/api/events/${id}/bibs/auto-assign`, { method: "POST" });
                                            if (res.ok) fetchEventData();
                                        }
                                    }}
                                >
                                    Auto-Assign
                                </Button>
                            </div>
                            <p className="text-sm text-text-muted italic font-medium">Auto-assignment settings can be configured per category in the event editor.</p>
                        </Card>
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
        </PageWrapper>
    );
}
