"use client";

import { Zap, Plus, Scan, Monitor, BarChart3, Globe } from "lucide-react";
import Link from "next/link";

interface OrganizerQuickActionsProps {
    items: any[];
}

export function OrganizerQuickActions({ items }: OrganizerQuickActionsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link
                href="/dashboard/events/create"
                className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/30 transition-all">
                    <Plus size={24} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase italic tracking-wider">Create Event</p>
                </div>
            </Link>

            {items.length > 0 && (
                <Link
                    href={`/dashboard/events/${items[0]?.id}/scanner`}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cta/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-cta/20 flex items-center justify-center text-cta group-hover:scale-110 group-hover:bg-cta/30 transition-all">
                        <Scan size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-white uppercase italic tracking-wider">Scanner</p>
                    </div>
                </Link>
            )}

            {items.length > 0 && (
                <Link
                    href={`/dashboard/events/${items[0]?.id}/kiosk`}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/30 transition-all">
                        <Monitor size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-white uppercase italic tracking-wider">Kiosk Mode</p>
                    </div>
                </Link>
            )}

            <Link
                href="/dashboard/events"
                className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white/20 transition-all">
                    <BarChart3 size={24} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase italic tracking-wider">All Events</p>
                </div>
            </Link>

            <Link
                href="/"
                className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white/20 transition-all">
                    <Globe size={24} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase italic tracking-wider">View Site</p>
                </div>
            </Link>
        </div>
    );
}
