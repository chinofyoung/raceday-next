"use client";

import { memo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OrganizerRevenueStatsProps {
    categoryRevenue: any[];
    eventRevenue: any[];
    totalRevenue: number;
}

function OrganizerRevenueStatsComponent({ categoryRevenue, eventRevenue, totalRevenue }: OrganizerRevenueStatsProps) {
    const [view, setView] = useState<"category" | "event">("category");

    if (categoryRevenue.length === 0 && eventRevenue.length === 0) return null;

    const data = view === "category" ? categoryRevenue : eventRevenue;

    return (
        <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden flex flex-col h-full">
            <div className="absolute bottom-0 right-0 p-12 bg-green-500/10 rounded-full blur-3xl -mr-16 -mb-16 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/20">
                        <TrendingUp size={16} />
                    </div>
                    <h3 className="text-base font-bold tracking-tight text-white hidden sm:block">Revenue</h3>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                        onClick={() => setView("category")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${view === "category"
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-text-muted hover:text-white"
                            }`}
                    >
                        Category
                    </button>
                    <button
                        onClick={() => setView("event")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${view === "event"
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-text-muted hover:text-white"
                            }`}
                    >
                        Event
                    </button>
                </div>
            </div>
            <div className="space-y-4 relative z-10 flex-1">
                {data.slice(0, 5).map((item) => (
                    <div key={item.id || item.name} className="space-y-2 group">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col min-w-0 mr-4">
                                <span className="text-sm font-bold text-white truncate group-hover:text-green-400 transition-colors">{item.name}</span>
                                {item.eventInfo && (
                                    <span className="text-xs text-text-muted font-medium truncate">{item.eventInfo}</span>
                                )}
                            </div>
                            <span className="text-sm font-bold text-green-400 shrink-0">₱{item.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${data.length > 0 ? (item.revenue / (data[0]?.revenue || 1)) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-text-muted font-medium w-16 text-right">{item.count} runner{item.count !== 1 && 's'}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Revenue</span>
                    <span className="text-xl font-bold text-white drop-shadow-md">₱{totalRevenue.toLocaleString()}</span>
                </div>
            </div>
        </Card>
    );
}

export const OrganizerRevenueStats = memo(OrganizerRevenueStatsComponent);
