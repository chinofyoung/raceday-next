"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users, Calendar, DollarSign, ArrowRight, TrendingUp,
    FileText, UserCheck, BarChart3, Clock, Shield,
    Trophy, Globe
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format, subDays } from "date-fns";
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
            <div className="space-y-10 text-white">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <Skeleton className="h-10 w-80" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-10 w-36 rounded-lg" />
                </div>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-6 rounded-xl border border-border bg-card space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-48" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                        Admin <span className="text-primary">Command Center</span>
                    </h1>
                    <p className="text-text-muted font-medium">Platform-wide oversight and management.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" asChild className="font-bold">
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
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Users</p>
                            <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() || 0}</p>
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
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Events</p>
                            <p className="text-2xl font-bold">{stats?.totalEvents.toLocaleString() || 0}</p>
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
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Revenue</p>
                            <p className="text-2xl font-bold">₱{stats?.totalRevenue.toLocaleString() || 0}</p>
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
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pending Apps</p>
                            <p className="text-2xl font-bold">{stats?.pendingApplications.toLocaleString() || 0}</p>
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
                                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                    <TrendingUp className="text-primary" size={20} /> Platform Activity
                                </h3>
                                <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Last 7 Days Growth</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <AdminOverviewChart data={chartData} />
                        </div>
                    </Card>

                    {/* Pending Applications List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight">Pending Applications</h2>
                            <Link href="/dashboard/admin/applications" className="text-xs font-semibold uppercase text-primary hover:underline tracking-wider">View All</Link>
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
                                                    <h4 className="font-bold text-white leading-tight">{app.organizerName}</h4>
                                                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">{app.contactEmail}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" asChild className="text-primary font-bold tracking-wider">
                                                <Link href={`/dashboard/admin/applications`}>Review <ArrowRight size={14} className="ml-1" /></Link>
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                                <UserCheck className="mx-auto text-text-muted opacity-20" size={48} />
                                <p className="text-text-muted font-medium uppercase tracking-wider text-xs">No pending applications.</p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions & Recent Events */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/dashboard/admin/users" className="block p-4 bg-primary rounded-xl border border-primary hover:scale-[1.02] transition-all group shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-white" />
                                        <span className="font-bold text-sm text-white">Manage Users</span>
                                    </div>
                                    <ArrowRight size={14} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/events" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-cta/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 size={18} className="text-cta" />
                                        <span className="font-bold text-sm">Review Events</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-cta" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/analytics" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-green-500/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-green-500" />
                                        <span className="font-bold text-sm">Platform Reports</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-green-500" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/logs" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield size={18} className="text-blue-500" />
                                        <span className="font-bold text-sm">Audit Logs</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-blue-500" />
                                </div>
                            </Link>
                            <Link href="/events" className="block p-4 bg-surface rounded-xl border border-white/5 hover:border-primary/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Trophy size={18} className="text-primary" />
                                        <span className="font-bold text-sm">Find Races</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-primary" />
                                </div>
                            </Link>
                            <Link href="/" className="block p-4 bg-surface rounded-xl border border-white/5 hover:bg-white/5 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-text-muted transition-colors group-hover:text-white" />
                                        <span className="font-bold text-sm">View Site</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-white" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Events List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">Newest Events</h2>
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
                                            <h4 className="font-bold text-white line-clamp-1">{event.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <Badge className="text-xs font-semibold uppercase px-2 py-0">
                                                    {event.status}
                                                </Badge>
                                                <span className="text-xs text-text-muted font-semibold uppercase tracking-wider whitespace-nowrap">
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
                        <h3 className="font-semibold uppercase text-xs text-primary mb-6 tracking-wider text-center relative z-10">System Status</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-muted uppercase">Convex Backend</span>
                                <Badge variant="success" className="text-xs px-2 py-0 border-none">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-muted uppercase">Cloudinary API</span>
                                <Badge variant="success" className="text-xs px-2 py-0 border-none">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-muted uppercase">Xendit Gateway</span>
                                <Badge variant="success" className="text-xs px-2 py-0 border-none">Online</Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
