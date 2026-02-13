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
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [userDistribution, setUserDistribution] = useState<any[]>([]);
    const [eventCategories, setEventCategories] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Revenue by Month (Last 6 months)
            const months = Array.from({ length: 6 }).map((_, i) => {
                const date = subMonths(new Date(), 5 - i);
                return {
                    name: format(date, "MMM"),
                    revenue: Math.floor(Math.random() * 500000) + 100000,
                    registrations: Math.floor(Math.random() * 200) + 50
                };
            });
            setRevenueData(months);

            // 2. User Distribution
            const usersSnap = await getDocs(collection(db, "users"));
            const roles = { runner: 0, organizer: 0, admin: 0 };
            usersSnap.docs.forEach(d => {
                const role = d.data().role as keyof typeof roles;
                if (roles[role] !== undefined) roles[role]++;
            });
            setUserDistribution([
                { name: "Runners", value: roles.runner, color: "var(--primary)" },
                { name: "Organizers", value: roles.organizer, color: "var(--cta)" },
                { name: "Admins", value: roles.admin, color: "var(--text-muted)" }
            ]);

            // 3. Category Popularity
            setEventCategories([
                { name: "5K", value: 45 },
                { name: "10K", value: 30 },
                { name: "21K", value: 15 },
                { name: "42K", value: 10 }
            ]);

        } catch (error) {
            console.error("Error fetching analytics:", error);
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
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontStyle: 'italic', fontWeight: 'bold' }} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontStyle: 'italic', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#16161a', border: '1px solid rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
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
                                <Tooltip contentStyle={{ backgroundColor: '#16161a', border: '1px solid rgba(255,255,255,0.05)' }} />
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
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontStyle: 'italic', fontWeight: 'bold' }} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontStyle: 'italic', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#16161a', border: '1px solid rgba(255,255,255,0.05)' }} />
                                <Line type="monotone" dataKey="registrations" stroke="var(--cta)" strokeWidth={3} dot={{ fill: 'var(--cta)' }} />
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
                                        className="h-full bg-primary transition-all duration-1000"
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
