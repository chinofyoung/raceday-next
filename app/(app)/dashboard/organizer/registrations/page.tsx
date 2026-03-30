"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, ArrowLeft, Users, ChevronLeft, ChevronRight, Check, X, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OrganizerRegistrationsPage() {
    const { user, loading: authLoading } = useAuth();

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedEventId, setSelectedEventId] = useState<string>("all");
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [expandedProofId, setExpandedProofId] = useState<string | null>(null);
    const rejectPayment = useMutation(api.registrations.rejectManualPayment);

    const handleApprove = async (regId: string) => {
        setApprovingId(regId);
        try {
            const response = await fetch("/api/payments/manual-approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registrationId: regId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to approve");
            toast.success("Registration approved! Bib number assigned.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to approve.");
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (regId: string) => {
        setRejectingId(regId);
        try {
            await rejectPayment({ id: regId as Id<"registrations"> });
            toast.success("Registration rejected. Runner can re-upload proof.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to reject.");
        } finally {
            setRejectingId(null);
        }
    };

    // Debounce search input to avoid filtering on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const convexEvents = useQuery(api.events.list, user ? {
        organizerId: user?._id as any,
        status: "all",
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    const organizerRegistrations = useQuery(api.registrations.list, user ? {
        organizerId: user._id as any,
        status: "all",
        paginationOpts: { numItems: 200, cursor: null }
    } : "skip");

    const loading = authLoading || convexEvents === undefined || organizerRegistrations === undefined;

    const events = useMemo(() => {
        return (convexEvents?.page || []).map((e: any) => ({
            ...e,
            id: e._id
        }));
    }, [convexEvents]);

    const registrations = useMemo(() => {
        return (organizerRegistrations?.page || []).map((r: any) => ({
            ...r,
            id: r._id,
            participantInfo: r.registrationData?.participantInfo || r.participantInfo,
        }));
    }, [organizerRegistrations]);

    const enrichedRegistrations = useMemo(() => {
        return registrations.map((reg: any) => {
            const event = events.find((e: any) => e.id === reg.eventId);
            const category = event?.categories?.find((c: any) => c.id === reg.categoryId);
            return {
                ...reg,
                eventName: event?.name || "Unknown Event",
                categoryName: category?.name || reg.categoryId
            };
        });
    }, [registrations, events]);

    const filteredRegistrations = useMemo(() => {
        return enrichedRegistrations.filter((reg: any) => {
            const matchesEvent = selectedEventId === "all" || reg.eventId === selectedEventId;
            const searchTerm = debouncedSearch.toLowerCase();
            const matchesSearch =
                !searchTerm ||
                reg.participantInfo?.name?.toLowerCase().includes(searchTerm) ||
                reg.participantInfo?.email?.toLowerCase().includes(searchTerm) ||
                reg.eventName.toLowerCase().includes(searchTerm) ||
                reg.categoryName.toLowerCase().includes(searchTerm);

            let matchesPaymentStatus = true;
            if (selectedPaymentStatus === "pending") {
                matchesPaymentStatus = reg.status === "pending";
            } else if (selectedPaymentStatus === "submitted") {
                matchesPaymentStatus = reg.manualPaymentStatus === "submitted";
            } else if (selectedPaymentStatus === "paid") {
                matchesPaymentStatus = reg.status === "paid";
            } else if (selectedPaymentStatus === "rejected") {
                matchesPaymentStatus = reg.manualPaymentStatus === "rejected";
            }

            return matchesEvent && matchesSearch && matchesPaymentStatus;
        });
    }, [enrichedRegistrations, selectedEventId, debouncedSearch, selectedPaymentStatus]);

    // Reset pagination when filters or page size change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedEventId, selectedPaymentStatus, itemsPerPage]);

    const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);

    const paginatedRegistrations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRegistrations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRegistrations, currentPage, itemsPerPage]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider animate-pulse">Loading Registrations...</p>
                </div>
            </div>
        );
    }

    const eventOptions = [
        { value: "all", label: "All Events" },
        ...events.map(e => ({ value: e.id, label: e.name }))
    ];

    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">All <span className="text-primary">Sign-Ups</span></h1>
                    <p className="text-text-muted font-medium">Manage and view all runner registrations.</p>
                </div>
            </div>

            <Card className="p-6 bg-surface/50 border border-white/5 relative overflow-hidden space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        <Input
                            placeholder="Search by runner, email, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="w-full md:w-64 shrink-0">
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors px-4 py-2.5 appearance-none cursor-pointer"
                        >
                            {eventOptions.map(o => (
                                <option key={o.value} value={o.value} className="bg-surface text-white">{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-52 shrink-0">
                        <select
                            value={selectedPaymentStatus}
                            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors px-4 py-2.5 appearance-none cursor-pointer"
                        >
                            <option value="all" className="bg-surface text-white">All Statuses</option>
                            <option value="pending" className="bg-surface text-white">Pending Payment</option>
                            <option value="submitted" className="bg-surface text-white">Proof Submitted</option>
                            <option value="paid" className="bg-surface text-white">Paid</option>
                            <option value="rejected" className="bg-surface text-white">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                            <div className="col-span-3">Runner Info</div>
                            <div className="col-span-2">Event & Category</div>
                            <div className="col-span-2">Contact</div>
                            <div className="col-span-1">Date</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-white/5">
                            {paginatedRegistrations.length > 0 ? (
                                paginatedRegistrations.map((reg: any) => (
                                    <div key={reg.id}>
                                        <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/5 transition-colors">
                                            <div className="col-span-3 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
                                                    {reg.participantInfo?.name?.charAt(0) || "?"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-white uppercase truncate">
                                                        {reg.participantInfo?.name || "Unknown"}
                                                    </p>
                                                    {reg.isProxy && (
                                                        <p className="text-xs text-text-muted truncate">Registered by {reg.registeredByName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-2 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{reg.eventName}</p>
                                                <p className="text-xs text-text-muted font-bold uppercase tracking-wider truncate">{reg.categoryName}</p>
                                            </div>
                                            <div className="col-span-2 min-w-0">
                                                <p className="text-xs text-text-muted truncate">{reg.participantInfo?.email}</p>
                                                <p className="text-xs text-text-muted truncate">{reg.participantInfo?.phone}</p>
                                            </div>
                                            <div className="col-span-1 text-xs text-text-muted">
                                                {reg.createdAt
                                                    ? format(new Date(reg.createdAt), "MMM d")
                                                    : '—'}
                                            </div>
                                            <div className="col-span-2 flex flex-col gap-1 shrink-0">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {reg.status === "paid" ? (
                                                        <Badge variant="success" className="bg-green-500/20 text-green-400 border-none text-xs font-semibold uppercase px-2 py-0.5">Paid</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs font-semibold uppercase px-2 py-0.5">{reg.status}</Badge>
                                                    )}
                                                    {reg.manualPaymentStatus === "submitted" && (
                                                        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold uppercase px-1.5 py-0">Proof sent</Badge>
                                                    )}
                                                    {reg.manualPaymentStatus === "rejected" && (
                                                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-semibold uppercase px-1.5 py-0">Rejected</Badge>
                                                    )}
                                                    {reg.manualPaymentStatus === "pending" && (
                                                        <Badge className="bg-white/4 text-text-muted border border-white/8 text-[10px] font-semibold uppercase px-1.5 py-0">No proof</Badge>
                                                    )}
                                                </div>
                                                {reg.status === "paid" && (
                                                    reg.raceKitClaimed ? (
                                                        <Badge variant="success" className="bg-cta/20 text-cta border-none text-xs font-semibold uppercase px-2 py-0.5 w-fit">Kit Claimed</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-white/10 text-text-muted text-xs font-semibold uppercase px-2 py-0.5 w-fit">Pending Kit</Badge>
                                                    )
                                                )}
                                            </div>
                                            <div className="col-span-2 flex items-center justify-end gap-2 shrink-0">
                                                {reg.status === "pending" && (
                                                    <>
                                                        {reg.proofOfPayment?.url && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedProofId(expandedProofId === reg.id ? null : reg.id)}
                                                                className="p-1.5 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                                                title="View proof"
                                                            >
                                                                <ImageIcon size={14} />
                                                            </button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            className="h-7 px-3 text-xs bg-cta hover:bg-cta/90 border-none gap-1"
                                                            onClick={() => handleApprove(reg.id)}
                                                            disabled={approvingId === reg.id}
                                                        >
                                                            {approvingId === reg.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-3 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 gap-1"
                                                            onClick={() => handleReject(reg.id)}
                                                            disabled={rejectingId === reg.id}
                                                        >
                                                            {rejectingId === reg.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Expanded proof image */}
                                        {expandedProofId === reg.id && reg.proofOfPayment?.url && (
                                            <div className="px-4 pb-4 flex gap-4">
                                                <a href={reg.proofOfPayment.url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={reg.proofOfPayment.url}
                                                        alt="Payment proof"
                                                        className="w-48 h-auto rounded-lg border border-white/10 hover:border-primary/30 transition-colors"
                                                    />
                                                </a>
                                                <div className="text-xs text-text-muted space-y-1.5">
                                                    {reg.manualPaymentStatus && (
                                                        <div>
                                                            {reg.manualPaymentStatus === "submitted" && (
                                                                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold uppercase px-1.5 py-0">Proof submitted</Badge>
                                                            )}
                                                            {reg.manualPaymentStatus === "rejected" && (
                                                                <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-semibold uppercase px-1.5 py-0">Rejected</Badge>
                                                            )}
                                                            {reg.manualPaymentStatus === "pending" && (
                                                                <Badge className="bg-white/4 text-text-muted border border-white/8 text-[10px] font-semibold uppercase px-1.5 py-0">Pending</Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p>Uploaded {reg.proofOfPayment.uploadedAt ? format(new Date(reg.proofOfPayment.uploadedAt), "MMM d, yyyy h:mm a") : "—"}</p>
                                                    <p>Amount: <span className="text-white font-semibold">₱{reg.totalPrice}</span></p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <Users className="text-text-muted opacity-10 mb-4" size={48} />
                                    <p className="text-text-muted text-sm font-medium">No registrations found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {filteredRegistrations.length > 0 && (
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Rows per page</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors px-3 py-1.5 appearance-none cursor-pointer"
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <option key={n} value={n} className="bg-surface text-white">{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-text-muted">
                                <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredRegistrations.length)}</span> of <span className="font-bold text-white">{filteredRegistrations.length}</span>
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
                    </div>
                )}
            </Card>
        </div>
    );
}
