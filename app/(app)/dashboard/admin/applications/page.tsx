"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    UserCheck, UserX, Clock, Search, Filter,
    ArrowLeft, Loader2, Mail, Phone, Calendar as CalendarIcon,
    CheckCircle2, XCircle, MoreVertical, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { OrganizerApplication } from "@/types/user";
import { cn, formatDate } from "@/lib/utils";
import { logAdminAction } from "@/lib/admin/audit";
import { useAuth } from "@/lib/hooks/useAuth";
import { exportToCSV } from "@/lib/admin/export";
import { Download } from "lucide-react";

export default function ApplicationsPage() {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<OrganizerApplication[]>([]);
    const [filter, setFilter] = useState("pending");
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "organizerApplications"),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })) as OrganizerApplication[]);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (app: OrganizerApplication) => {
        if (!confirm(`Are you sure you want to approve ${app.organizerName}?`)) return;

        setProcessing(app.id);
        try {
            // 1. Update Application status
            await updateDoc(doc(db, "organizerApplications", app.id), {
                status: "approved",
                reviewedAt: Timestamp.now()
            });

            // 2. Update User role and organizer object
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

            // Refresh list
            setApplications(prev => prev.map(a =>
                a.id === app.id ? { ...a, status: "approved" as const } : a
            ));
        } catch (error) {
            console.error("Error approving application:", error);
            alert("Failed to approve application. Check console.");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (app: OrganizerApplication) => {
        const reason = prompt("Reason for rejection:");
        if (reason === null) return;

        setProcessing(app.id);
        try {
            await updateDoc(doc(db, "organizerApplications", app.id), {
                status: "rejected",
                rejectionReason: reason,
                reviewedAt: Timestamp.now()
            });

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

            setApplications(prev => prev.map(a =>
                a.id === app.id ? { ...a, status: "rejected" as const, rejectionReason: reason } : a
            ));
        } catch (error) {
            console.error("Error rejecting application:", error);
            alert("Failed to reject application.");
        } finally {
            setProcessing(null);
        }
    };

    const handleExport = () => {
        const exportData = filteredApps.map(a => ({
            Organizer: a.organizerName,
            Email: a.contactEmail,
            Phone: a.phone,
            Status: a.status,
            Applied: formatDate(a.createdAt)
        }));
        exportToCSV(exportData, `raceday-applications-${formatDate(new Date())}`);
    };

    const filteredApps = applications.filter(a => filter === "all" || a.status === filter);

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

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
                    <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
                        <Download size={18} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {["all", "pending", "approved", "rejected"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                filter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-text-muted hover:bg-white/10"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {filteredApps.length === 0 ? (
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
                    {filteredApps.map((app) => (
                        <Card key={app.id} className="p-8 bg-surface/40 border-white/5 hover:bg-surface/60 transition-all relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />

                            <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                                <div className="space-y-6 flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                                            <UserCheck size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-2xl font-black italic uppercase text-white leading-tight">{app.organizerName}</h3>
                                                <Badge variant={app.status === "pending" ? "cta" : app.status === "approved" ? "success" : "destructive"} className="text-[10px] font-black uppercase italic tracking-widest px-3">
                                                    {app.status}
                                                </Badge>
                                            </div>
                                            <p className="text-text-muted font-medium italic">Applicant UID: {app.userId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest italic">Contact Email</p>
                                            <div className="flex items-center gap-2 text-white font-bold italic">
                                                <Mail size={14} className="text-primary" />
                                                {app.contactEmail}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest italic">Phone Number</p>
                                            <div className="flex items-center gap-2 text-white font-bold italic">
                                                <Phone size={14} className="text-cta" />
                                                {app.phone}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest italic">Applied Date</p>
                                            <div className="flex items-center gap-2 text-white font-bold italic">
                                                <CalendarIcon size={14} className="text-blue-500" />
                                                {formatDate(app.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {app.status === "rejected" && app.rejectionReason && (
                                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                                            <p className="text-[10px] font-black uppercase text-red-500 tracking-widest italic mb-1">Rejection Reason</p>
                                            <p className="text-sm font-medium italic text-text-muted">{app.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row lg:flex-col gap-3 justify-end items-end">
                                    {app.status === "pending" ? (
                                        <>
                                            <Button
                                                variant="primary"
                                                className="w-full lg:w-40 font-black italic uppercase tracking-widest bg-success hover:bg-success/80 border-none shadow-lg shadow-success/20 h-12"
                                                onClick={() => handleApprove(app)}
                                                disabled={processing === app.id}
                                            >
                                                {processing === app.id ? <Loader2 className="animate-spin" size={18} /> : (
                                                    <><CheckCircle2 size={18} className="mr-2" /> Approve</>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full lg:w-40 font-black italic uppercase tracking-widest border-red-500/50 text-red-500 hover:bg-red-500/10 h-12"
                                                onClick={() => handleReject(app)}
                                                disabled={processing === app.id}
                                            >
                                                <XCircle size={18} className="mr-2" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-[10px] font-black uppercase italic text-text-muted flex items-center gap-2">
                                            Reviewed on {formatDate(app.reviewedAt) || "N/A"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </PageWrapper>
    );
}
