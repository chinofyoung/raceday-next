"use client";

import { LayoutDashboard, CalendarDays, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <OrganizerQuickActions items={items} />

            <Tabs defaultValue="overview">
                <TabsList className="bg-black/40 border border-white/10 p-1.5 rounded-2xl h-auto w-full sm:w-fit mx-auto lg:mx-0 flex overflow-x-auto no-scrollbar scroll-smooth">
                    <TabsTrigger value="overview" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/5 text-text-muted hover:text-white hover:bg-white/5 whitespace-nowrap">
                        <LayoutDashboard size={16} className="data-[state=active]:text-primary" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="events" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/5 text-text-muted hover:text-white hover:bg-white/5 whitespace-nowrap">
                        <CalendarDays size={16} />
                        Events
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/5 text-text-muted hover:text-white hover:bg-white/5 whitespace-nowrap">
                        <Users size={16} />
                        Participants
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-8">
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
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
                    </div>
                </TabsContent>

                <TabsContent value="events" className="mt-8">
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />
                        <OrganizerActiveEvents
                            items={items}
                            eventKitStats={eventKitStats}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="participants" className="mt-8">
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2">
                                <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />
                            </div>
                            <div className="space-y-8">
                                <OrganizerKitFulfillment
                                    claimPercentage={claimPercentage}
                                    claimedKits={claimedKits}
                                    totalParticipants={stats.secondary}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
