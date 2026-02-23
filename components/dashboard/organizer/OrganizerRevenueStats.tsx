"use client";

import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface OrganizerRevenueStatsProps {
    categoryRevenue: any[];
    totalRevenue: number;
}

export function OrganizerRevenueStats({ categoryRevenue, totalRevenue }: OrganizerRevenueStatsProps) {
    if (categoryRevenue.length === 0) return null;

    return (
        <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-12 bg-green-500/5 rounded-full blur-3xl -mr-16 -mb-16" />
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <TrendingUp size={14} className="text-green-500" />
                <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Revenue by Category</h3>
            </div>
            <div className="space-y-3 relative z-10">
                {categoryRevenue.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase italic truncate">{cat.name}</span>
                            <span className="text-xs font-black text-green-500 italic">₱{cat.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${categoryRevenue.length > 0 ? (cat.revenue / (categoryRevenue[0]?.revenue || 1)) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-[9px] text-text-muted font-bold italic">{cat.count} runners</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Total</span>
                    <span className="text-sm font-black text-white italic">₱{totalRevenue.toLocaleString()}</span>
                </div>
            </div>
        </Card>
    );
}
