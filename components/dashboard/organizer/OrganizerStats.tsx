"use client";

import { Card } from "@/components/ui/Card";
import { Calendar, Users, DollarSign, Package } from "lucide-react";

interface OrganizerStatsProps {
    stats: { total: number; secondary: number; revenue: number };
    publishedEventsCount: number;
    claimPercentage: number;
    claimedKits: number;
}

export function OrganizerStats({ stats, publishedEventsCount, claimPercentage, claimedKits }: OrganizerStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors">
                <div className="absolute top-0 right-0 p-8 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                            <Calendar size={24} />
                        </div>
                        <div className="px-2 py-1 bg-primary/10 rounded-full border border-primary/20">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{publishedEventsCount} live</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black italic tracking-tight text-white">{stats.total}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted italic mt-1">Total Events</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors">
                <div className="absolute top-0 right-0 p-8 bg-cta/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cta/20 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-cta/20 flex items-center justify-center text-cta border border-cta/20">
                            <Users size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black italic tracking-tight text-white">{stats.secondary}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted italic mt-1">Total Runners</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors">
                <div className="absolute top-0 right-0 p-8 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-green-500/20 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/20">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black italic tracking-tight text-green-400">
                            <span className="text-2xl mr-1">₱</span>
                            {stats.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted italic mt-1">Total Revenue</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors">
                <div className="absolute top-0 right-0 p-8 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Package size={24} />
                        </div>
                        <div className="px-2 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{claimPercentage}%</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-4xl font-black italic tracking-tight text-white">{claimedKits}</p>
                            <span className="text-xl text-text-muted font-bold opacity-50">/{stats.secondary}</span>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted italic mt-1">Kits Claimed</p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-out"
                        style={{ width: `${claimPercentage}%` }}
                    />
                </div>
            </Card>
        </div>
    );
}
