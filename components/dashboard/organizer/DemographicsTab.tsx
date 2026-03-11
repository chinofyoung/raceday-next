"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { RaceEvent } from "@/types/event";
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    Legend
} from "recharts";
import { Users, User, UserPlus, Milestone, Shirt } from "lucide-react";

interface DemographicsTabProps {
    event: RaceEvent;
    registrations: any[];
}

const COLORS = ["#00F2FF", "#FF3B30", "#FFCC00", "#34C759", "#AF52DE", "#5856D6"];

export function DemographicsTab({ event, registrations }: DemographicsTabProps) {
    const paidRegistrations = useMemo(() =>
        registrations.filter(r => r.status === "paid"),
        [registrations]);

    const stats = useMemo(() => {
        const categories: Record<string, number> = {};
        const gender: Record<string, number> = { male: 0, female: 0, other: 0, unknown: 0 };
        const singlet: Record<string, number> = {};
        const tshirt: Record<string, number> = {};
        const ageGroups: Record<string, number> = {
            "Below 30": 0,
            "30-39": 0,
            "40 & Above": 0,
            "N/A": 0
        };

        paidRegistrations.forEach(reg => {
            // Category
            const catName = event.categories.find(c => (c.id || "0") === reg.categoryId)?.name || "Unknown";
            categories[catName] = (categories[catName] || 0) + 1;

            // Gender
            const g = reg.participantInfo?.gender?.toLowerCase() || "unknown";
            gender[g] = (gender[g] || 0) + 1;

            // Sizes
            const sSize = reg.participantInfo?.singletSize || "N/A";
            singlet[sSize] = (singlet[sSize] || 0) + 1;

            const tSize = reg.participantInfo?.tShirtSize || "N/A";
            tshirt[tSize] = (tshirt[tSize] || 0) + 1;

            // Age
            const bDate = reg.participantInfo?.birthDate;
            if (bDate) {
                const birth = new Date(bDate);
                const age = new Date().getFullYear() - birth.getFullYear();
                if (age < 30) ageGroups["Below 30"]++;
                else if (age < 40) ageGroups["30-39"]++;
                else ageGroups["40 & Above"]++;
            } else {
                ageGroups["N/A"]++;
            }
        });

        return {
            categories: Object.entries(categories).map(([name, value]) => ({ name, value })),
            gender: Object.entries(gender)
                .filter(([_, value]) => value > 0)
                .map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    value
                })),
            singlet: Object.entries(singlet).map(([name, value]) => ({ name, value })),
            tshirt: Object.entries(tshirt).map(([name, value]) => ({ name, value })),
            ageGroups: Object.entries(ageGroups).map(([name, value]) => ({ name, value }))
        };
    }, [paidRegistrations, event.categories]);

    if (paidRegistrations.length === 0) {
        return (
            <Card className="p-12 border border-white/5 border-dashed bg-transparent text-center space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-white font-bold italic uppercase">No Data Available</p>
                    <p className="text-text-muted text-sm max-w-sm mx-auto">
                        Demographic stats will appear here once participants start registering for your event.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Row: Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-surface border-white/5 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Users size={48} className="text-primary" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Paid Entries</p>
                    <h3 className="text-3xl font-black italic text-white">
                        {paidRegistrations.length}
                    </h3>
                </Card>
                <Card className="p-6 bg-surface border-white/5 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <User size={48} className="text-cta" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Top Category</p>
                    <h3 className="text-2xl font-black italic text-white uppercase truncate">
                        {stats.categories.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
                    </h3>
                </Card>
                <Card className="p-6 bg-surface border-white/5 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Shirt size={48} className="text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Common Shirt</p>
                    <h3 className="text-3xl font-black italic text-white">
                        {stats.tshirt.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
                    </h3>
                </Card>
                <Card className="p-6 bg-surface border-white/5 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <UserPlus size={48} className="text-green-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Male/Female Ratio</p>
                    <h3 className="text-2xl font-black italic text-white">
                        {stats.gender.find(g => g.name === "Male")?.value || 0} : {stats.gender.find(g => g.name === "Female")?.value || 0}
                    </h3>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gender Distribution */}
                <Card className="p-8 bg-surface border-white/5 space-y-6">
                    <div className="flex items-center gap-2">
                        <User className="text-primary" size={20} />
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Gender Distribution</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.gender}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.gender.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Age Groups */}
                <Card className="p-8 bg-surface border-white/5 space-y-6">
                    <div className="flex items-center gap-2">
                        <Milestone className="text-cta" size={20} />
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Age Demographics</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.ageGroups}>
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" fill="#00F2FF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Categories */}
                <Card className="p-8 bg-surface border-white/5 space-y-6">
                    <div className="flex items-center gap-2">
                        <Milestone className="text-green-500" size={20} />
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Category Split</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={stats.categories}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="rgba(255,255,255,0.5)"
                                    fontSize={10}
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" fill="#FF3B30" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Apparel Sizes */}
                <Card className="p-8 bg-surface border-white/5 space-y-6">
                    <div className="flex items-center gap-2">
                        <Shirt className="text-amber-500" size={20} />
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Apparel Requirements</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.tshirt}>
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar name="T-Shirt" dataKey="value" fill="#FFCC00" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold italic uppercase text-center">T-Shirt size distributions for fulfillment planning</p>
                </Card>
            </div>
        </div>
    );
}
