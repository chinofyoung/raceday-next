"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface OrganizerDraftsNoticeProps {
    draftEventsCount: number;
}

export function OrganizerDraftsNotice({ draftEventsCount }: OrganizerDraftsNoticeProps) {
    if (draftEventsCount === 0) return null;

    return (
        <Link href="/dashboard/organizer/events?status=draft" className="group block">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-all">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <p className="text-xs font-bold text-amber-500 italic">
                    {draftEventsCount} draft event{draftEventsCount > 1 ? "s" : ""} awaiting publishing
                </p>
            </div>
        </Link>
    );
}
