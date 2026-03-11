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
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />

            <OrganizerStats
                stats={stats}
                publishedEventsCount={publishedEvents.length}
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                    <OrganizerRevenueStats
                        categoryRevenue={categoryRevenue}
                        eventRevenue={eventRevenue}
                        totalRevenue={stats.revenue}
                    />
                </div>
                <div className="md:col-span-2">
                    <OrganizerKitFulfillment
                        claimPercentage={claimPercentage}
                        claimedKits={claimedKits}
                        totalParticipants={stats.secondary}
                    />
                </div>

                <div className="md:col-span-2">
                    <OrganizerActiveEvents
                        items={items}
                        eventKitStats={eventKitStats}
                    />
                </div>
                <div className="md:col-span-2">
                    <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />
                </div>
            </div>
        </div>
    );
}
