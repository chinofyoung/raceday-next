"use client";

import { Clock } from "lucide-react";
import { RunnerEventCard } from "./RunnerEventCard";

interface PendingPaymentSectionProps {
    registrations: any[];
}

export function PendingPaymentSection({ registrations }: PendingPaymentSectionProps) {
    if (registrations.length === 0) return null;

    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Section header with amber accent */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-amber-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Awaiting Payment</h2>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mt-0.5">
                        {registrations.length} registration{registrations.length > 1 ? "s" : ""} pending
                    </p>
                </div>
            </div>

            {/* Cards grid with subtle amber tint container */}
            <div className="relative rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registrations.map((reg) => (
                        <RunnerEventCard key={reg.id} reg={reg} isPending />
                    ))}
                </div>
            </div>
        </div>
    );
}
