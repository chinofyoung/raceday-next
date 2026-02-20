"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import {
    UserCheck, ArrowLeft, Loader2, Download, Filter
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { OrganizerApplication } from "@/types/user";
import { cn, formatDate } from "@/lib/utils";
import { logAdminAction } from "@/lib/admin/audit";
import { useAuth } from "@/lib/hooks/useAuth";
import { exportToCSV } from "@/lib/admin/export";
import { getOrganizerApplications, reviewApplication } from "@/lib/services/applicationService";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";
import { ApplicationCard } from "./components/ApplicationCard";

export default function ApplicationsPage() {
    const { user: currentUser } = useAuth();
    const [filter, setFilter] = useState<any>("pending");
    const [processing, setProcessing] = useState<string | null>(null);

    const { data: applications, loading, hasMore, loadMore, refresh } = usePaginatedQuery<OrganizerApplication>({
        fetchFn: (opts) => getOrganizerApplications({ ...opts, status: filter }),
        pageSize: 20
    });

    useEffect(() => {
        refresh();
    }, [filter]);

    const handleApprove = async (app: OrganizerApplication) => {
        if (!confirm(`Are you sure you want to approve ${app.organizerName}?`)) return;

        setProcessing(app.id);
        try {
            await reviewApplication(app.id, "approved");

            // Update User role
            const userRef = doc(db, "users", app.userId);
            await updateDoc(userRef, {
                role: "organizer",
                "organizer.approved": true,
                "organizer.approvedAt": Timestamp.now()
            });

            // Log action
            if (currentUser) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    "approve_organizer",
                    app.userId,
                    app.organizerName
                );
            }

            refresh();
        } catch (error) {
            console.error("Error approving application:", error);
            alert("Failed to approve application.");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (app: OrganizerApplication) => {
        const reason = prompt("Reason for rejection:");
        if (reason === null) return;

        setProcessing(app.id);
        try {
            await reviewApplication(app.id, "rejected", { reason });

            // Log action
            if (currentUser) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    "reject_organizer",
                    app.userId,
                    app.organizerName,
                    reason
                );
            }

            refresh();
        } catch (error) {
            console.error("Error rejecting application:", error);
            alert("Failed to reject application.");
        } finally {
            setProcessing(null);
        }
    };

    const handleNeedsInfo = async (app: OrganizerApplication) => {
        const message = prompt("What information is missing?");
        if (message === null) return;

        setProcessing(app.id);
        try {
            await reviewApplication(app.id, "needs_info", { reason: message, adminNotes: `Info requested: ${message}` });

            // Log action
            if (currentUser) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    "request_info_organizer",
                    app.userId,
                    app.organizerName,
                    message
                );
            }

            refresh();
        } catch (error) {
            console.error("Error requesting info:", error);
            alert("Failed to request info.");
        } finally {
            setProcessing(null);
        }
    };

    const handleExport = () => {
        const exportData = applications.map(a => ({
            Organizer: a.organizerName,
            Type: a.organizerType,
            Email: a.contactEmail,
            Phone: a.phone,
            TIN: a.organizerTIN || "",
            Region: a.address?.region || "N/A",
            Province: a.address?.province || "N/A",
            Status: a.status,
            Applied: formatDate(a.createdAt)
        }));
        exportToCSV(exportData, `raceday-applications-${formatDate(new Date())}`);
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
                        Organizer <span className="text-primary">Applications</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Review and manage platform organizer requests.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0 text-xs font-black uppercase italic">
                        <Download size={18} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {["all", "pending", "needs_info", "approved", "rejected"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                filter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-text-muted hover:bg-white/10"
                            )}
                        >
                            {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {applications.length === 0 && !loading ? (
                <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-20">
                        <UserCheck size={48} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold uppercase italic text-white">No applications found</h3>
                        <p className="text-text-muted font-medium italic">There are no {filter} applications at the moment.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {applications.map((app) => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            processing={processing === app.id}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onNeedsInfo={handleNeedsInfo}
                        />
                    ))}
                    {loading && (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="flex justify-center pt-8">
                    <Button
                        variant="outline"
                        size="lg"
                        className="min-w-48 gap-2 font-black italic uppercase tracking-widest text-xs"
                        onClick={() => loadMore()}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Load More Applications"}
                    </Button>
                </div>
            )}
        </PageWrapper>
    );
}
