"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface OrganizerDraftsNoticeProps {
    draftEventsCount: number;
}

export function OrganizerDraftsNotice({ draftEventsCount }: OrganizerDraftsNoticeProps) {
    if (draftEventsCount === 0) return null;

    return (
        <Card className="p-4 bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <AlertTriangle size={16} />
                </div>
                <div>
                    <p className="text-sm font-bold italic text-white">
                        {draftEventsCount} draft event{draftEventsCount > 1 ? "s" : ""} awaiting publishing
                    </p>
                    <p className="text-[10px] text-text-muted font-medium italic">Finish setting up and publish to start accepting registrations.</p>
                </div>
            </div>
            <Button size="sm" variant="outline" asChild className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-bold italic uppercase text-[10px] shrink-0">
                <Link href="/dashboard/events">View Drafts</Link>
            </Button>
        </Card>
    );
}
