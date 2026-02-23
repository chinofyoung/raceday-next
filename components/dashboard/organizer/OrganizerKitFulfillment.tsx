"use client";

import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface OrganizerKitFulfillmentProps {
    claimPercentage: number;
    claimedKits: number;
    totalParticipants: number;
}

export function OrganizerKitFulfillment({ claimPercentage, claimedKits, totalParticipants }: OrganizerKitFulfillmentProps) {
    return (
        <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <ShieldCheck size={14} className="text-amber-500" />
                <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Kit Fulfillment</h3>
            </div>
            <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                            <circle
                                cx="48" cy="48" r="38"
                                stroke="currentColor" strokeWidth="6" fill="transparent"
                                strokeDasharray={2 * Math.PI * 38}
                                strokeDashoffset={2 * Math.PI * 38 * (1 - claimPercentage / 100)}
                                strokeLinecap="round"
                                className="text-amber-500 transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black italic text-white">{claimPercentage}%</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-background/50 rounded-xl border border-white/5">
                        <div className="text-lg font-black italic text-cta">{claimedKits}</div>
                        <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Claimed</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-xl border border-white/5">
                        <div className="text-lg font-black italic text-text-muted">{totalParticipants - claimedKits}</div>
                        <div className="text-[8px] uppercase font-black text-text-muted italic tracking-widest">Remaining</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
