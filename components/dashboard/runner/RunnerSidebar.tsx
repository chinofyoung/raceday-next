"use client";

import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RunnerAnnouncements } from "@/components/dashboard/RunnerAnnouncements";

interface RunnerSidebarProps {
    upcomingCount: number;
    pastCount: number;
}

export function RunnerSidebar({ upcomingCount, pastCount }: RunnerSidebarProps) {
    return (
        <div className="space-y-4 lg:space-y-8">
            {/* Announcements - TOP OF SIDEBAR */}
            <RunnerAnnouncements />

            {/* Athlete Stats */}
            <Card className="p-6 bg-surface/50 border border-white/5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 p-12 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                <h3 className="font-semibold uppercase text-xs text-primary mb-6 tracking-wider text-center relative z-10">
                    ATHLETE STATS
                </h3>
                <div className="grid grid-cols-2 gap-4 relative z-10 text-white">
                    <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                        <div className="text-3xl font-bold text-white tracking-tight">{upcomingCount}</div>
                        <div className="text-xs uppercase font-semibold text-text-muted tracking-wider">Upcoming</div>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-2xl border border-white/5">
                        <div className="text-3xl font-bold text-white tracking-tight">{pastCount}</div>
                        <div className="text-xs uppercase font-semibold text-text-muted tracking-wider">Finished</div>
                    </div>
                </div>
                <div className="mt-4 p-4 bg-cta/5 border border-cta/20 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center text-cta shrink-0">
                        <CheckCircle2 size={16} />
                    </div>
                    <p className="text-xs font-semibold text-white uppercase leading-tight">You have {upcomingCount} upcoming races scheduled!</p>
                </div>
            </Card>
        </div>
    );
}
