"use client";

import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";

interface OrganizerViewProps {
    items: any[];
    publishedEvents: any[];
    draftEvents: any[];
    stats: { total: number; secondary: number; revenue: number };
    claimedKits: number;
    claimPercentage: number;
    eventKitStats: any[];
    recentRegistrations: any[];
    categoryRevenue: any[];
    eventRevenue: any[];
}

export function OrganizerView({
    items,
    publishedEvents,
    draftEvents,
    stats,
    claimedKits,
    claimPercentage,
    eventKitStats,
    recentRegistrations,
    categoryRevenue,
    eventRevenue
}: OrganizerViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />

            <OrganizerStats
                stats={stats}
                publishedEventsCount={publishedEvents.length}
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <OrganizerRevenueStats
                    categoryRevenue={categoryRevenue}
                    eventRevenue={eventRevenue}
                    totalRevenue={stats.revenue}
                />
                <OrganizerKitFulfillment
                    claimPercentage={claimPercentage}
                    claimedKits={claimedKits}
                    totalParticipants={stats.secondary}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <OrganizerActiveEvents
                        items={items}
                        eventKitStats={eventKitStats}
                    />
                </div>
                <div>
                    <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />
                </div>
            </div>
        </div>
    );
}
