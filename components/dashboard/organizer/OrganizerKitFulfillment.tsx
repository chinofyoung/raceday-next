"use client";

import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OrganizerKitFulfillmentProps {
    claimPercentage: number;
    claimedKits: number;
    totalParticipants: number;
}

export function OrganizerKitFulfillment({ claimPercentage, claimedKits, totalParticipants }: OrganizerKitFulfillmentProps) {
    const validPercentage = isNaN(claimPercentage) ? 0 : claimPercentage;
    return (
        <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden group flex flex-col h-full">
            <div className="absolute top-0 right-0 p-12 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors duration-500 pointer-events-none" />
            <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <ShieldCheck size={16} />
                </div>
                <h3 className="text-base font-black uppercase italic tracking-tight text-white">Kit Fulfillment</h3>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                            <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/40" />
                            <circle
                                cx="64" cy="64" r="54"
                                stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={2 * Math.PI * 54}
                                strokeDashoffset={2 * Math.PI * 54 * (1 - validPercentage / 100)}
                                strokeLinecap="round"
                                className="text-amber-500 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black italic text-white">{validPercentage}%</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="text-center p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="text-2xl font-black italic text-amber-500 mb-1">{claimedKits}</div>
                        <div className="text-[10px] uppercase font-bold text-text-muted italic tracking-widest">Claimed</div>
                    </div>
                    <div className="text-center p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="text-2xl font-black italic text-white mb-1">{Math.max(0, totalParticipants - claimedKits)}</div>
                        <div className="text-[10px] uppercase font-bold text-text-muted italic tracking-widest">Remaining</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
