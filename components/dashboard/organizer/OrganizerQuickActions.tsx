"use client";

import { Zap, Plus, Scan, Monitor, BarChart3, Globe } from "lucide-react";
import Link from "next/link";

interface OrganizerQuickActionsProps {
    items: any[];
}

export function OrganizerQuickActions({ items }: OrganizerQuickActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Link
                href="/dashboard/events/create"
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all group"
            >
                <Plus size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest italic text-white">Create Event</span>
            </Link>

            <Link
                href="/dashboard/events"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
            >
                <BarChart3 size={16} className="text-white opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-widest italic text-white">All Events</span>
            </Link>

            <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
            >
                <Globe size={16} className="text-white opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-widest italic text-white">View Site</span>
            </Link>

            {items.length > 0 && (
                <Link
                    href={`/dashboard/events/${items[0]?.id}/kiosk`}
                    className="flex items-center gap-2 px-4 py-2 bg-cta/10 border border-cta/20 rounded-xl hover:bg-cta/20 transition-all group"
                >
                    <Monitor size={16} className="text-cta" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic text-white">Kiosk Mode</span>
                </Link>
            )
            }

            {
                items.length > 0 && (
                    <Link
                        href={`/dashboard/events/${items[0]?.id}/scanner`}
                        className="flex items-center gap-2 px-4 py-2 bg-cta/10 border border-cta/20 rounded-xl hover:bg-cta/20 transition-all group"
                    >
                        <Scan size={16} className="text-cta" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic text-white">Scanner</span>
                    </Link>
                )
            }
        </div >
    );
}
