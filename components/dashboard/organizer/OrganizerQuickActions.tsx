"use client";

import { Zap, Plus, Scan, Monitor, BarChart3, Globe } from "lucide-react";
import Link from "next/link";

interface OrganizerQuickActionsProps {
    items: any[];
}

export function OrganizerQuickActions({ items }: OrganizerQuickActionsProps) {
    return (
        <div className="bg-surface/60 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-cta" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Link
                    href="/dashboard/events/create"
                    className="flex items-center gap-3 p-3.5 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 hover:border-primary/40 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white uppercase italic leading-tight">Create Event</p>
                        <p className="text-[9px] text-text-muted font-medium italic">New race</p>
                    </div>
                </Link>
                {items.length > 0 && (
                    <Link
                        href={`/dashboard/events/${items[0]?.id}/scanner`}
                        className="flex items-center gap-3 p-3.5 bg-cta/10 border border-cta/20 rounded-xl hover:bg-cta/20 hover:border-cta/40 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-cta/20 flex items-center justify-center text-cta group-hover:scale-110 transition-transform">
                            <Scan size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white uppercase italic leading-tight">Scanner</p>
                            <p className="text-[9px] text-text-muted font-medium italic">Race kit scan</p>
                        </div>
                    </Link>
                )}
                {items.length > 0 && (
                    <Link
                        href={`/dashboard/events/${items[0]?.id}/kiosk`}
                        className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 hover:border-amber-500/40 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Monitor size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white uppercase italic leading-tight">Kiosk Mode</p>
                            <p className="text-[9px] text-text-muted font-medium italic">Tablet station</p>
                        </div>
                    </Link>
                )}
                <Link
                    href="/dashboard/events"
                    className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white uppercase italic leading-tight">All Events</p>
                        <p className="text-[9px] text-text-muted font-medium italic">Manage</p>
                    </div>
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white uppercase italic leading-tight">View Site</p>
                        <p className="text-[9px] text-text-muted font-medium italic">Public page</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
