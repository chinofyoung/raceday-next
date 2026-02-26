"use client";

import { useState } from "react";
import { LayoutDashboard, CalendarDays, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

import { OrganizerQuickActions } from "./organizer/OrganizerQuickActions";
import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";
import { OrganizerWallet } from "./organizer/OrganizerWallet";
import { OrganizerBalanceCard } from "./organizer/OrganizerBalanceCard";

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
    const [activeTab, setActiveTab] = useState<"overview" | "events" | "participants" | "wallet">("overview");

    const TABS = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "events", label: "Events", icon: CalendarDays },
        { id: "participants", label: "Participants", icon: Users },
        { id: "wallet", label: "Wallet", icon: Wallet },
    ] as const;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <OrganizerQuickActions items={items} />

            {/* Tab Navigation */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 w-full sm:w-fit mx-auto lg:mx-0 overflow-x-auto no-scrollbar scroll-smooth">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-white/10 text-white shadow-lg border border-white/5"
                                : "text-text-muted hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon size={16} className={cn(activeTab === tab.id ? "text-primary" : "opacity-50")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
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
            )}

            {/* Events Tab */}
            {activeTab === "events" && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />
                            <OrganizerActiveEvents
                                items={items}
                                eventKitStats={eventKitStats}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
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
            )}

            {/* Wallet Tab */}
            {activeTab === "wallet" && (
                <OrganizerWallet />
            )}
        </div>
    );
}
