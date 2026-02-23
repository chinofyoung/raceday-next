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
            <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar size={20} />
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase italic tracking-widest">
                            <span>{publishedEventsCount} live</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black italic tracking-tight text-white">{stats.total}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Events</p>
                    </div>
                </div>
            </Card>

            <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-cta/30 transition-all">
                <div className="absolute top-0 right-0 p-8 bg-cta/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cta/10 transition-colors" />
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-cta/10 flex items-center justify-center text-cta">
                            <Users size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black italic tracking-tight text-white">{stats.secondary}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Runners</p>
                    </div>
                </div>
            </Card>

            <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all">
                <div className="absolute top-0 right-0 p-8 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors" />
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black italic tracking-tight text-white">₱{stats.revenue.toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total Revenue</p>
                    </div>
                </div>
            </Card>

            <Card className="p-5 bg-surface border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors" />
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Package size={20} />
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase italic tracking-widest">
                            <span>{claimPercentage}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black italic tracking-tight text-white">{claimedKits}<span className="text-lg text-text-muted font-bold">/{stats.secondary}</span></p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Kits Claimed</p>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                            style={{ width: `${claimPercentage}%` }}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
