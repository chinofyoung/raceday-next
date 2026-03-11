"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface OrganizerDraftsNoticeProps {
    draftEventsCount: number;
}

export function OrganizerDraftsNotice({ draftEventsCount }: OrganizerDraftsNoticeProps) {
    if (draftEventsCount === 0) return null;

    return (
        <div className="flex justify-start">
            <Link href="/dashboard/organizer/events?status=draft" className="group block">
                <Card className="p-6 w-48 aspect-square bg-amber-500/5 border border-amber-500/20 flex flex-col items-center justify-center text-center gap-3 hover:bg-amber-500/10 transition-all active:scale-95 relative overflow-hidden cursor-pointer">
                    <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors" />
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 relative z-10">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-2xl font-black italic text-white leading-none">
                            {draftEventsCount}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-2">
                            Draft Event{draftEventsCount > 1 ? "s" : ""}
                        </p>
                        <p className="text-[9px] text-text-muted font-bold italic uppercase tracking-wider mt-1">Awaiting Publishing</p>
                    </div>
                </Card>
            </Link>
        </div>
    );
}
