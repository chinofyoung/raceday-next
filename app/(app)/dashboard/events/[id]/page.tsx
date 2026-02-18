"use client";

import { useEffect, useState } from "react";
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
    MoreVertical, Edit2, Download, Filter, Search, QrCode, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function EventDetailPage() {
    const { id } = useParams();
    const { user, role } = useAuth();
    const [event, setEvent] = useState<RaceEvent | null>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"participants" | "revenue" | "settings">("participants");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("paid");

    useEffect(() => {
        if (id && user) {
            fetchEventData();
        }
    }, [id, user]);

    const fetchEventData = async () => {
        setLoading(true);
        try {
            // Fetch Event
            const docRef = doc(db, "events", id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const eventData = { ...snap.data(), id: snap.id } as RaceEvent;
                if (eventData.organizerId !== user?.uid && role !== "admin") {
                    setEvent(null);
                } else {
                    setEvent(eventData);

                    // Fetch Registrations
                    const q = query(
                        collection(db, "registrations"),
                        where("eventId", "==", id)
                    );
                    const regSnap = await getDocs(q);
                    setRegistrations(regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            }
        } catch (error) {
            console.error("Error fetching event data:", error);
        } finally {
            setLoading(false);
        }
    };

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
                    <Button asChild variant="primary"><Link href="/dashboard/events">Back to Events</Link></Button>
                </div>
            </PageWrapper>
        );
    }

    const paidRegistrations = registrations.filter(r => r.status === "paid");
    const totalRevenue = paidRegistrations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const vanityCount = paidRegistrations.filter(r => r.vanityPremium > 0).length;
    const vanityRevenue = paidRegistrations.reduce((sum, r) => sum + (r.vanityPremium || 0), 0);

    const filteredParticipants = registrations.filter(r => {
        const matchesSearch = r.participantInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.raceNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            r.participantInfo.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || r.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const eventDate = typeof (event.date as any).toDate === 'function' ? (event.date as any).toDate() : new Date(event.date as string | number | Date);

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/dashboard/events" className="text-text-muted text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-widest italic">
                        <ArrowLeft size={14} /> Back to Events
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                                {event.name}
                            </h1>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest h-fit",
                                event.status === "published" ? "bg-green-500 text-white" : "bg-cta text-white"
                            )}>
                                {event.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-text-muted font-medium italic">
                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {format(eventDate, "MMMM d, yyyy")}</div>
                            <div className="flex items-center gap-1.5"><MapPin size={14} className="text-cta" /> {event.location.name}</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 font-black italic uppercase" asChild>
                        <Link href={`/dashboard/events/${id}/edit`}><Edit2 size={16} /> Edit Event</Link>
                    </Button>
                    <Button variant="primary" className="gap-2 bg-cta hover:bg-cta-hover border-none shadow-lg shadow-cta/20 font-black italic uppercase" asChild>
                        <Link href={`/dashboard/events/${id}/scanner`}><QrCode size={16} /> Scanner Mode</Link>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card
                    className={cn(
                        "p-6 bg-surface border-white/5 space-y-1 cursor-pointer transition-all hover:border-primary/50",
                        statusFilter === "paid" && activeTab === "participants" && "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                    )}
                    onClick={() => {
                        setActiveTab("participants");
                        setStatusFilter("paid");
                    }}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Registered</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-black italic text-white">{paidRegistrations.length}</p>
                        <Users size={24} className="text-primary opacity-20" />
                    </div>
                </Card>
                <Card
                    className={cn(
                        "p-6 bg-surface border-white/5 space-y-1 cursor-pointer transition-all hover:border-white/20",
                        statusFilter === "pending" && activeTab === "participants" && "border-white/40 bg-white/5 shadow-lg"
                    )}
                    onClick={() => {
                        setActiveTab("participants");
                        setStatusFilter("pending");
                    }}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Pending</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-black italic text-white">{registrations.length - paidRegistrations.length}</p>
                        <Users size={24} className="text-white opacity-10" />
                    </div>
                </Card>
                <Card className="p-6 bg-surface border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Revenue</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-black italic text-white">₱{totalRevenue.toLocaleString()}</p>
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

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="flex gap-8 border-b border-white/5 pb-px">
                    {(["participants", "revenue", "settings"] as const).map((tab) => (
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
                                    <div className="flex bg-surface-lighter p-1 rounded-xl border border-white/5 h-fit">
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
                                    <Button variant="outline" size="sm" className="gap-2 font-black italic uppercase"><Download size={14} /> Export CSV</Button>
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
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted italic text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredParticipants.length > 0 ? filteredParticipants.map((reg) => (
                                                <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic text-xs uppercase">
                                                                {reg.participantInfo.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white uppercase italic">{reg.participantInfo.name}</p>
                                                                <p className="text-[10px] text-text-muted font-medium italic">{reg.participantInfo.email}</p>
                                                                {reg.isProxy && reg.registeredByName && (
                                                                    <div className="mt-1 flex items-center gap-1 text-indigo-400">
                                                                        <Users size={10} />
                                                                        <span className="text-[9px] font-bold italic uppercase tracking-wider">
                                                                            By: {reg.registeredByName}
                                                                        </span>
                                                                    </div>
                                                                )}
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
                                                            "text-[10px] font-black uppercase italic tracking-widest",
                                                            reg.status === "paid" ? "text-green-500" : "text-cta"
                                                        )}>
                                                            {reg.status}
                                                        </p>
                                                        <p className="text-[11px] font-black text-white italic">₱{reg.totalPrice}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {reg.status === "pending" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2 h-8 font-black uppercase italic text-[10px]"
                                                                onClick={async () => {
                                                                    if (confirm("Cancel this pending registration?")) {
                                                                        try {
                                                                            const { deleteDoc, doc: fireDoc } = await import("firebase/firestore");
                                                                            await deleteDoc(fireDoc(db, "registrations", reg.id));
                                                                            fetchEventData();
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            alert("Failed to cancel registration.");
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center space-y-4">
                                                        <Users className="mx-auto text-text-muted opacity-10" size={48} />
                                                        <p className="text-text-muted italic font-medium">No records found matching your search.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "revenue" && (
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
                                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white relative z-10">Vanity Number Revenue</h3>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-text-muted font-medium text-xs italic">Total Vanity Selections</p>
                                        <p className="text-3xl font-black italic text-white tracking-widest">{vanityCount}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-text-muted font-medium text-xs italic">Total Premium Revenue</p>
                                        <p className="text-3xl font-black italic text-green-500 tracking-widest">₱{vanityRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 relative z-10">
                                    <p className="text-[10px] text-text-muted leading-relaxed italic font-bold uppercase tracking-widest">
                                        Vanity numbers are charged at <span className="text-primary font-bold">₱{event.vanityRaceNumber.premiumPrice}</span> per registration on top of the base category price.
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-white/5 space-y-2 relative z-10">
                                    <div className="flex justify-between text-xs font-bold text-text-muted italic uppercase">
                                        <span>Total Net Revenue</span>
                                        <span className="text-white">₱{(totalRevenue * 0.95).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[8px] text-text-muted italic text-right">* After 5% processing fees</p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
