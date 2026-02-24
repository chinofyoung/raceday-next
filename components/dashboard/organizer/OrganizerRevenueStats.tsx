"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface OrganizerRevenueStatsProps {
    categoryRevenue: any[];
    eventRevenue: any[];
    totalRevenue: number;
}

export function OrganizerRevenueStats({ categoryRevenue, eventRevenue, totalRevenue }: OrganizerRevenueStatsProps) {
    const [view, setView] = useState<"category" | "event">("category");

    if (categoryRevenue.length === 0 && eventRevenue.length === 0) return null;

    const data = view === "category" ? categoryRevenue : eventRevenue;

    return (
        <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-12 bg-green-500/5 rounded-full blur-3xl -mr-16 -mb-16" />
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-500" />
                    <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Revenue Stats</h3>
                </div>
                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                        onClick={() => setView("category")}
                        className={`px-3 py-1 rounded-md text-[10px] font-black italic uppercase transition-all ${view === "category"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-text-muted hover:text-white"
                            }`}
                    >
                        Category
                    </button>
                    <button
                        onClick={() => setView("event")}
                        className={`px-3 py-1 rounded-md text-[10px] font-black italic uppercase transition-all ${view === "event"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-text-muted hover:text-white"
                            }`}
                    >
                        Event
                    </button>
                </div>
            </div>
            <div className="space-y-3 relative z-10">
                {data.slice(0, 5).map((item) => (
                    <div key={item.id || item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col min-w-0 mr-4">
                                <span className="text-xs font-bold text-white uppercase italic truncate">{item.name}</span>
                                {item.eventInfo && (
                                    <span className="text-[9px] text-text-muted font-bold italic truncate">{item.eventInfo}</span>
                                )}
                            </div>
                            <span className="text-xs font-black text-green-500 italic shrink-0">₱{item.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${data.length > 0 ? (item.revenue / (data[0]?.revenue || 1)) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-[9px] text-text-muted font-bold italic w-12 text-right">{item.count} runner{item.count !== 1 && 's'}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total (All Events)</span>
                    <span className="text-sm font-black text-white italic">₱{totalRevenue.toLocaleString()}</span>
                </div>
            </div>
        </Card>
    );
}
