"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ChevronDown, ChevronUp, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PendingPaymentsTableProps {
    eventId: string;
}

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Awaiting proof" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

export function PendingPaymentsTable({ eventId }: PendingPaymentsTableProps) {
    const [statusFilter, setStatusFilter] = useState("submitted");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const registrations = useQuery(api.registrations.listManualPayments, {
        eventId: eventId as Id<"events">,
        statusFilter: statusFilter === "all" ? undefined : statusFilter,
    });

    const event = useQuery(api.events.getById, { id: eventId as Id<"events"> });
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
            toast.success("Registration rejected. Runner will be notified to re-upload.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to reject.");
        } finally {
            setRejectingId(null);
        }
    };

    const getCategoryName = (categoryId: string) => {
        return event?.categories?.find((c: any) => c.id === categoryId)?.name || categoryId;
    };

    // Count by status for tabs
    const allRegistrations = useQuery(api.registrations.listManualPayments, {
        eventId: eventId as Id<"events">,
    });
    const counts: Record<string, number> = { all: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 };
    if (allRegistrations) {
        counts.all = allRegistrations.length;
        allRegistrations.forEach((r: any) => {
            if (r.manualPaymentStatus && counts[r.manualPaymentStatus] !== undefined) {
                counts[r.manualPaymentStatus]++;
            }
        });
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-1 border-b border-white/8 overflow-x-auto">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={cn(
                            "px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                            statusFilter === tab.value
                                ? "text-white border-primary"
                                : "text-text-muted border-transparent hover:text-white"
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            "ml-2 px-1.5 py-0.5 rounded-full text-[10px]",
                            statusFilter === tab.value
                                ? "bg-primary/15 text-primary"
                                : "bg-white/6 text-text-muted"
                        )}>
                            {counts[tab.value]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            {registrations === undefined ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-text-muted" />
                </div>
            ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-text-muted text-sm">No registrations found.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_1.2fr] gap-4 px-4 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Runner</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Category</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Amount</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Submitted</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">Actions</span>
                    </div>

                    {registrations.map((reg: any) => {
                        const isExpanded = expandedId === reg._id;
                        const participant = reg.registrationData?.participantInfo;
                        return (
                            <div key={reg._id} className="border border-white/5 rounded-xl overflow-hidden">
                                {/* Row */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : reg._id)}
                                    className={cn(
                                        "w-full grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_1.2fr] gap-4 px-4 py-3 items-center text-left hover:bg-white/2 transition-colors",
                                        isExpanded && "bg-white/2"
                                    )}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-white truncate">{participant?.name || "Unknown"}</p>
                                        <p className="text-xs text-text-muted truncate">{participant?.email}</p>
                                    </div>
                                    <span className="text-sm text-white">{getCategoryName(reg.categoryId)}</span>
                                    <span className="text-sm text-white">₱{reg.totalPrice}</span>
                                    <span className="text-xs text-text-muted">
                                        {reg.proofOfPayment?.uploadedAt
                                            ? formatDistanceToNow(reg.proofOfPayment.uploadedAt, { addSuffix: true })
                                            : "—"}
                                    </span>
                                    <Badge className={cn(
                                        "text-[10px] font-semibold uppercase border px-1.5 py-0 w-fit",
                                        reg.manualPaymentStatus === "submitted" && "text-amber-500 bg-amber-500/10 border-amber-500/20",
                                        reg.manualPaymentStatus === "approved" && "text-cta bg-cta/10 border-cta/20",
                                        reg.manualPaymentStatus === "rejected" && "text-red-500 bg-red-500/10 border-red-500/20",
                                        reg.manualPaymentStatus === "pending" && "text-text-muted bg-white/4 border-white/8",
                                    )}>
                                        {reg.manualPaymentStatus}
                                    </Badge>
                                    <div className="flex items-center justify-end gap-2">
                                        {reg.manualPaymentStatus === "submitted" && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="h-7 px-3 text-xs bg-cta hover:bg-cta/90 border-none gap-1"
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(reg._id); }}
                                                    disabled={approvingId === reg._id}
                                                >
                                                    {approvingId === reg._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-3 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 gap-1"
                                                    onClick={(e) => { e.stopPropagation(); handleReject(reg._id); }}
                                                    disabled={rejectingId === reg._id}
                                                >
                                                    {rejectingId === reg._id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-white/5 flex gap-6">
                                        {/* Proof image */}
                                        <div className="shrink-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Proof of payment</p>
                                            {reg.proofOfPayment?.url ? (
                                                <a href={reg.proofOfPayment.url} target="_blank" rel="noopener noreferrer" className="block">
                                                    <img
                                                        src={reg.proofOfPayment.url}
                                                        alt="Payment proof"
                                                        className="w-48 h-auto rounded-lg border border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
                                                    />
                                                </a>
                                            ) : (
                                                <div className="w-48 h-64 bg-white/3 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-2">
                                                    <ImageIcon size={24} className="text-text-muted/30" />
                                                    <p className="text-xs text-text-muted">No proof uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Registration details */}
                                        <div className="flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-3">Registration details</p>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Name</span>
                                                    <p className="text-sm text-white font-medium">{participant?.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Email</span>
                                                    <p className="text-sm text-white font-medium">{participant?.email}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Phone</span>
                                                    <p className="text-sm text-white font-medium">{participant?.phone || "—"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">T-Shirt</span>
                                                    <p className="text-sm text-white font-medium">{participant?.tShirtSize || "—"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Registered</span>
                                                    <p className="text-sm text-white font-medium">
                                                        {reg.createdAt ? formatDistanceToNow(reg.createdAt, { addSuffix: true }) : "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Proof uploaded</span>
                                                    <p className="text-sm text-white font-medium">
                                                        {reg.proofOfPayment?.uploadedAt
                                                            ? formatDistanceToNow(reg.proofOfPayment.uploadedAt, { addSuffix: true })
                                                            : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
