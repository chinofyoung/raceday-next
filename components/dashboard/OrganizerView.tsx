"use client";

import { OrganizerQuickActions } from "./organizer/OrganizerQuickActions";
import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";

interface OrganizerViewProps {
    items: any[];
    allEvents: any[];
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
    allEvents,
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <OrganizerQuickActions items={items} />

            <OrganizerStats
                stats={stats}
                publishedEventsCount={publishedEvents.length}
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <OrganizerActiveEvents
                        items={items}
                        eventKitStats={eventKitStats}
                    />

                    <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />
                </div>

                <div className="space-y-6">
                    <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />

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
            </div>
        </div>
    );
}
