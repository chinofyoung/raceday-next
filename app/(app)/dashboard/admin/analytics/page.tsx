"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
    BarChart3, TrendingUp, DollarSign, Users,
    Calendar, ArrowLeft, Loader2, Download
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, startOfDay } from "date-fns";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { getPlatformStats, PlatformStats } from "@/lib/services/statsService";
import { getRegistrations } from "@/lib/services/registrationService";
import { getEvents } from "@/lib/services/eventService";
import { toDate } from "@/lib/utils";
import { RaceEvent } from "@/types/event";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [userDistribution, setUserDistribution] = useState<any[]>([]);
    const [eventCategories, setEventCategories] = useState<any[]>([]);

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Optimized parallel fetching
            const [stats, regsResult, eventsResult] = await Promise.all([
                getPlatformStats(),
                getRegistrations({ status: "paid", limitCount: 1000 }), // Cap for charts
                getEvents({ status: "all", limitCount: 100 })
            ]);

            // 1. Process User Distribution
            setUserDistribution([
                { name: "Runners", value: stats.usersByRole.runner, color: "#f97316" },
                { name: "Organizers", value: stats.usersByRole.organizer, color: "#22c55e" },
                { name: "Admins", value: stats.usersByRole.admin, color: "#3b82f6" }
            ]);

            // 2. Process Revenue & Registrations by Month (Last 6 months)
            const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
            const monthsInterval = eachMonthOfInterval({
                start: sixMonthsAgo,
                end: new Date()
            });

            const registrations = regsResult.items.map(r => ({
                ...r,
                paidAt: toDate((r as any).paidAt || r.createdAt)
            }));

            const monthlyData = monthsInterval.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);

                const monthRegs = registrations.filter(reg =>
                    isWithinInterval(reg.paidAt as Date, { start: monthStart, end: monthEnd })
                );

                return {
                    name: format(month, "MMM"),
                    revenue: monthRegs.reduce((sum, r) => sum + (r.totalPrice || 0), 0),
                    registrations: monthRegs.length
                };
            });
            setRevenueData(monthlyData);

            // 3. Category Popularity
            const categoryCounts: Record<string, number> = {};
            registrations.forEach(reg => {
                const catId = reg.categoryId;
                categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
            });

            // Map category IDs to names using events data
            const categoryNames: Record<string, string> = {};
            eventsResult.items.forEach((event: RaceEvent) => {
                event.categories?.forEach((cat: any) => {
                    categoryNames[cat.id] = cat.name;
                });
            });

            const totalRegs = registrations.length || 1;
            const popularCategories = Object.entries(categoryCounts)
                .map(([id, count]) => ({
                    name: categoryNames[id] || "Other",
                    value: Math.round((count / totalRegs) * 100)
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 4);

            setEventCategories(popularCategories.length > 0 ? popularCategories : [
                { name: "5K", value: 0 },
                { name: "10K", value: 0 },
                { name: "21K", value: 0 },
                { name: "42K", value: 0 }
            ]);

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !isClient) {
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
                        Platform <span className="text-primary">Analytics</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Deep dive into platform growth and revenue performance.</p>
                </div>
                <Button variant="outline" className="font-black italic uppercase tracking-widest">
                    <Download size={18} className="mr-2" /> Export JSON
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <Card className="p-8 bg-surface border-white/5">
                    <div className="mb-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                            <DollarSign className="text-green-500" size={20} /> Revenue Growth
                        </h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest">Monthly Gross Revenue (PHP)</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* User Distribution */}
                <Card className="p-8 bg-surface border-white/5">
                    <div className="mb-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                            <Users className="text-blue-500" size={20} /> User Distribution
                        </h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest">Active Users by Role</p>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={userDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {userDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-4 min-w-[120px]">
                            {userDistribution.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[10px] font-black uppercase italic text-text-muted">{entry.name}</span>
                                    <span className="text-sm font-black italic ml-auto">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Event Performance */}
                <Card className="p-8 bg-surface border-white/5">
                    <div className="mb-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                            <TrendingUp className="text-cta" size={20} /> Registration Volume
                        </h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest">Signups over time</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <defs>
                                    <linearGradient id="lineOverlay" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-cta)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-cta)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="registrations"
                                    stroke="var(--color-cta)"
                                    strokeWidth={4}
                                    dot={{ fill: 'var(--color-cta)', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Popular Distances */}
                <Card className="p-8 bg-surface border-white/5">
                    <div className="mb-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                            <BarChart3 className="text-primary" size={20} /> Popular Categories
                        </h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest">% of Total Registrations</p>
                    </div>
                    <div className="space-y-6">
                        {eventCategories.map((cat) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black italic uppercase text-white">{cat.name} RUN</span>
                                    <span className="text-xs font-black italic text-primary">{cat.value}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                                        style={{ width: `${cat.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </PageWrapper>
    );
}
