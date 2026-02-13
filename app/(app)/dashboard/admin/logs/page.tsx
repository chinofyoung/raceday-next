"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
    Clock, ArrowLeft, Loader2, Shield,
    User, Target, FileText, Info
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(50));
            const snap = await getDocs(q);
            setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case "approve_organizer": return <Badge variant="success">Approved Organizer</Badge>;
            case "reject_organizer": return <Badge variant="error" className="bg-red-500/10 text-red-500">Rejected Organizer</Badge>;
            case "change_user_role": return <Badge variant="warning">Role Change</Badge>;
            case "feature_event": return <Badge variant="cta">Featured Event</Badge>;
            case "delete_event": return <Badge variant="destructive">Deleted Event</Badge>;
            case "cancel_event": return <Badge variant="error">Cancelled Event</Badge>;
            default: return <Badge variant="outline">{action}</Badge>;
        }
    };

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
                        Audit <span className="text-primary">Logs</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Monitor all administrative actions and system overrides.</p>
                </div>
            </div>

            {/* Log List */}
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5">
                        <Shield className="mx-auto text-text-muted opacity-20 mb-4" size={48} />
                        <p className="text-text-muted italic font-medium uppercase tracking-widest text-xs">No admin actions recorded yet.</p>
                    </Card>
                ) : (
                    logs.map((log) => (
                        <Card key={log.id} className="p-6 bg-surface/40 border-white/5 hover:bg-surface/50 transition-all group">
                            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/5 shrink-0">
                                        <Clock size={20} className="text-text-muted group-hover:text-primary transition-colors" />
                                        <span className="text-[8px] font-black italic uppercase text-text-muted mt-1">
                                            {log.timestamp ? formatDate(log.timestamp) : "Just now"}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {getActionBadge(log.action)}
                                            <div className="flex items-center gap-1.5 text-white font-bold italic uppercase text-xs">
                                                <User size={14} className="text-primary" /> {log.adminName}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase italic tracking-widest bg-white/5 py-1 px-3 rounded-lg border border-white/5">
                                                <Target size={12} className="text-cta" /> Target: <span className="text-white">{log.targetName}</span>
                                            </div>
                                            {log.details && (
                                                <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase italic tracking-widest bg-white/5 py-1 px-3 rounded-lg border border-white/5 max-w-md truncate">
                                                    <Info size={12} className="text-blue-500" /> Detail: <span className="text-white">{log.details}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-text-muted/30 font-mono tracking-tighter self-end lg:self-center">
                                    ID: {log.id}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </PageWrapper>
    );
}
