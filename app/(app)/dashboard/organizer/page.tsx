"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OrganizerView } from "@/components/dashboard/OrganizerView";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizerDashboardPage() {
    const { user, loading: authLoading } = useAuth();

    const convexEvents = useQuery(api.events.list, user ? {
        organizerId: user?._id as any,
        status: "all",
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    const dashboardStats = useQuery(api.registrations.getOrganizerDashboardStats, user ? {
        organizerId: user._id as any,
    } : "skip");

    const allEvents = useMemo(() => {
        return (convexEvents?.page || []).map(e => ({
            ...e,
            id: e._id
        }));
    }, [convexEvents]);

    const loading = authLoading || convexEvents === undefined || dashboardStats === undefined;

    const stats = {
        total: (convexEvents?.page || []).length,
        secondary: dashboardStats?.totalRegistrations ?? 0,
        revenue: dashboardStats?.totalRevenue ?? 0,
    };

    const claimedKits = dashboardStats?.claimedKits ?? 0;
    const claimPercentage = dashboardStats?.claimPercentage ?? 0;

    const publishedEvents = useMemo(() => allEvents.filter(e => e.status === "published"), [allEvents]);
    const draftEvents = useMemo(() => allEvents.filter(e => e.status === "draft"), [allEvents]);

    // Top 5 published events for the active events widget
    const items = useMemo(() => {
        return allEvents
            .filter((e: any) => e.status === "published")
            .slice(0, 5);
    }, [allEvents]);

    // Enrich recent registrations with event/category name and participantInfo
    const recentRegistrations = useMemo(() => {
        const recent = dashboardStats?.recentRegistrations ?? [];
        return recent.map((r: any) => {
            const event = allEvents.find(e => e._id === r.eventId);
            const category = event?.categories?.find((c: any) => (c.id || "0") === r.categoryId);
            return {
                ...r,
                id: r._id,
                participantInfo: r.registrationData?.participantInfo ?? r.participantInfo,
                eventName: event?.name ?? "Unknown Event",
                categoryName: category?.name ?? r.categoryId,
            };
        });
    }, [dashboardStats, allEvents]);

    // Build eventKitStats for active (published) events using server-side eventStats
    const eventKitStats = useMemo(() => {
        const serverEventStats = dashboardStats?.eventStats ?? {};
        return items.map((event: any) => {
            const eStats = serverEventStats[event._id] ?? { total: 0, claimed: 0, revenue: 0 };
            return {
                ...event,
                regCount: eStats.total,
                claimedCount: eStats.claimed,
                claimPercent: eStats.total > 0 ? Math.round((eStats.claimed / eStats.total) * 100) : 0,
            };
        });
    }, [items, dashboardStats]);

    // Build eventRevenue from server-side eventStats, merging event name
    const eventRevenue = useMemo(() => {
        const serverEventStats = dashboardStats?.eventStats ?? {};
        return Object.entries(serverEventStats)
            .map(([eventId, eStats]) => {
                const event = allEvents.find(e => e._id === eventId);
                return {
                    id: eventId,
                    name: event?.name ?? "Unknown Event",
                    count: (eStats as any).total,
                    revenue: (eStats as any).revenue,
                };
            })
            .sort((a, b) => b.revenue - a.revenue);
    }, [dashboardStats, allEvents]);

    // Build categoryRevenue from server-side categoryStats, merging names
    const categoryRevenue = useMemo(() => {
        const serverCategoryStats = dashboardStats?.categoryStats ?? {};
        return Object.values(serverCategoryStats)
            .map((cStats: any) => {
                const event = allEvents.find(e => e._id === cStats.eventId);
                const category = event?.categories?.find((c: any) => c.id === cStats.categoryId);
                return {
                    name: category?.name ?? cStats.categoryId,
                    eventInfo: event?.name ?? "Unknown Event",
                    count: cStats.count,
                    revenue: cStats.revenue,
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [dashboardStats, allEvents]);

    if (loading) {
        return (
            <div className="space-y-8 text-white">
                {/* Header */}
                <div className="space-y-1">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-80" />
                </div>

                {/* Stats row */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="w-12 h-12 rounded-2xl" />
                                    <Skeleton className="h-5 w-12 rounded-full" />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-10 w-20" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Widgets grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-48 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-white">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                    Hello, <span className="text-primary">{user?.displayName?.split(' ')[0] || "there"}</span>
                </h1>
                <p className="text-text-muted font-medium">Your race command center. Everything at a glance.</p>
            </div>

            <OrganizerView
                items={items}
                publishedEvents={publishedEvents}
                draftEvents={draftEvents}
                stats={stats}
                claimedKits={claimedKits}
                claimPercentage={claimPercentage}
                eventKitStats={eventKitStats}
                recentRegistrations={recentRegistrations}
                categoryRevenue={categoryRevenue}
                eventRevenue={eventRevenue}
            />
        </div>
    );
}
