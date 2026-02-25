"use client";

import { Zap, Plus, Scan, Monitor, BarChart3, Globe } from "lucide-react";
import { BaseQuickAction } from "../shared/BaseQuickAction";

interface OrganizerQuickActionsProps {
    items: any[];
}

export function OrganizerQuickActions({ items }: OrganizerQuickActionsProps) {
    return (
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">

            <BaseQuickAction
                href="/dashboard/events/create"
                icon={Plus}
                label="Create Event"
                variant="primary"
            />

            <BaseQuickAction
                href="/dashboard/events"
                icon={BarChart3}
                label="All Events"
                variant="secondary"
            />

            <BaseQuickAction
                href="/"
                icon={Globe}
                label="View Site"
                variant="secondary"
            />

            {items.length > 0 && (
                <BaseQuickAction
                    href={`/dashboard/events/${items[0]?.id}/kiosk`}
                    icon={Monitor}
                    label="Kiosk Mode"
                    variant="cta"
                />
            )}

            {items.length > 0 && (
                <BaseQuickAction
                    href={`/dashboard/events/${items[0]?.id}/scanner`}
                    icon={Scan}
                    label="Scanner"
                    variant="cta"
                />
            )}
        </div>
    );
}
