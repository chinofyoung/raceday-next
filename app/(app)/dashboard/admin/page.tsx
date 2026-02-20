"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Users, Calendar, DollarSign, ArrowRight, TrendingUp,
    FileText, UserCheck, Loader2, BarChart3, Clock, Shield
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { format, subDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { getPlatformStats, PlatformStats } from "@/lib/services/statsService";
import { getEvents } from "@/lib/services/eventService";
import { getOrganizerApplications } from "@/lib/services/applicationService";
import dynamic from "next/dynamic";

const AdminOverviewChart = dynamic(
    () => import("@/components/admin/AdminOverviewChart"),
    { ssr: false, loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-xl" /> }
);

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [recentApps, setRecentApps] = useState<any[]>([]);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Use Stage 3.1: Parallelize Independent Queries
            const [statsResult, eventsResult, appsResult] = await Promise.all([
                getPlatformStats(),
                getEvents({ limitCount: 3, status: "all" }),
                getOrganizerApplications({ limitCount: 3, status: "pending" })
            ]);

            setStats(statsResult);
            setRecentEvents(eventsResult.items);
            setRecentApps(appsResult.items);

            // Mock Chart Data for now (Real data would aggregate regs by date - Stage 1.2 plan)
            const last7Days = Array.from({ length: 7 }).map((_, i) => {
                const date = subDays(new Date(), 6 - i);
                return {
                    name: format(date, "MMM dd"),
                    registrations: Math.floor(Math.random() * 50) + 10,
                    revenue: Math.floor(Math.random() * 20000) + 5000
                };
            });
            setChartData(last7Days);

        } catch (error) {
            console.error("Error fetching admin data:", error);
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

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10 text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        Admin <span className="text-primary">Command Center</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Platform-wide oversight and management.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" asChild className="font-black italic uppercase">
                        <Link href="/dashboard/admin/analytics">Detailed Reports</Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <Card className="p-6 bg-surface border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Users</p>
                            <p className="text-2xl font-black italic">{stats?.totalUsers.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-surface border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-cta/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cta/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center text-cta">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Events</p>
                            <p className="text-2xl font-black italic">{stats?.totalEvents.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-surface border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Revenue</p>
                            <p className="text-2xl font-black italic">₱{stats?.totalRevenue.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-surface border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Pending Apps</p>
                            <p className="text-2xl font-black italic">{stats?.pendingApplications.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Charts & Transactions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Chart */}
                    <Card className="p-8 bg-surface border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                                    <TrendingUp className="text-primary" size={20} /> Platform Activity
                                </h3>
                                <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest">Last 7 Days Growth</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <AdminOverviewChart data={chartData} />
                        </div>
                    </Card>

                    {/* Pending Applications List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">Pending Applications</h2>
                            <Link href="/dashboard/admin/applications" className="text-[10px] font-black uppercase text-primary hover:underline italic tracking-widest">View All</Link>
                        </div>
                        {recentApps.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {recentApps.map((app) => (
                                    <Card key={app.id} className="p-6 bg-surface/50 border-white/5 hover:border-white/10 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                                                    <UserCheck size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold italic uppercase text-white leading-tight">{app.organizerName}</h4>
                                                    <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-widest">{app.contactEmail}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" asChild className="text-primary font-black italic uppercase tracking-widest">
                                                <Link href={`/dashboard/admin/applications`}>Review <ArrowRight size={14} className="ml-1" /></Link>
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                                <UserCheck className="mx-auto text-text-muted opacity-20" size={48} />
                                <p className="text-text-muted italic font-medium uppercase tracking-widest text-xs">No pending applications.</p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions & Recent Events */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tight">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/dashboard/admin/users" className="block p-4 bg-primary rounded-xl border border-primary hover:scale-[1.02] transition-all group shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-white" />
                                        <span className="font-bold uppercase italic text-sm text-white">Manage Users</span>
                                    </div>
                                    <ArrowRight size={14} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/events" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 size={18} className="text-cta" />
                                        <span className="font-bold uppercase italic text-sm">Review Events</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-cta" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/analytics" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-green-500/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-green-500" />
                                        <span className="font-bold uppercase italic text-sm">Platform Reports</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-green-500" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/logs" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield size={18} className="text-blue-500" />
                                        <span className="font-bold uppercase italic text-sm">Audit Logs</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-blue-500" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Events List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tight">Newest Events</h2>
                        <div className="space-y-4">
                            {recentEvents.map((event) => (
                                <Card key={event.id} className="p-4 bg-surface/30 border-white/5 hover:bg-surface/50 transition-all group text-sm">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                            {event.featuredImage ? (
                                                <img src={event.featuredImage} alt={`${event.name} featured image`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-text-muted">
                                                    <Calendar size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black italic uppercase text-white line-clamp-1">{event.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <Badge className="text-[8px] font-black uppercase px-2 py-0">
                                                    {event.status}
                                                </Badge>
                                                <span className="text-[10px] text-text-muted font-bold italic uppercase tracking-widest whitespace-nowrap">
                                                    {event.location.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* System Info */}
                    <Card className="p-6 bg-surface/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 p-12 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        <h3 className="font-bold uppercase italic text-[10px] text-primary mb-6 tracking-widest text-center relative z-10">SYSTEM STATUS</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase italic">Firebase DB</span>
                                <Badge variant="success" className="text-[8px] px-2 py-0 border-none">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase italic">Cloudinary API</span>
                                <Badge variant="success" className="text-[8px] px-2 py-0 border-none">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase italic">Xendit Gateway</span>
                                <Badge variant="success" className="text-[8px] px-2 py-0 border-none">Online</Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PageWrapper>
    );
}
