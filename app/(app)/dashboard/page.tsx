"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDashboardMode } from "@/components/providers/DashboardModeProvider";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { computeProfileCompletion } from "@/lib/utils";

// New modular components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OrganizerView } from "@/components/dashboard/OrganizerView";
import { RunnerView } from "@/components/dashboard/RunnerView";
import { Skeleton, EventCardSkeleton, StatCardSkeleton } from "@/components/shared/Skeleton";

export default function DashboardPage() {
    const { user, role, loading: authLoading } = useAuth();
    const { mode, setMode, canSwitchMode } = useDashboardMode();

    const isOrganizerView = mode === "organizer";

    // Use Convex hooks
    const convexEvents = useQuery(api.events.list, isOrganizerView ? {
        organizerId: user?._id as any,
        status: "all",
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    const convexRegistrations = useQuery(api.registrations.getByUserId, !isOrganizerView && user ? {
        userId: user._id as any
    } : "skip");

    const organizerRegistrations = useQuery(api.registrations.list, isOrganizerView && user ? {
        organizerId: user._id as any,
        status: "all",
        paginationOpts: { numItems: 1000, cursor: null }
    } : "skip");

    const allRegistrations: any[] = useMemo(() => {
        if (isOrganizerView) {
            return (organizerRegistrations?.page || []).map((r: any) => ({
                ...r,
                id: r._id,
            }));
        } else {
            return (convexRegistrations || []).map((r: any) => ({
                ...r,
                id: r._id,
            }));
        }
    }, [isOrganizerView, convexRegistrations, organizerRegistrations]);

    const stats = {
        total: (convexEvents?.page || []).length,
        secondary: allRegistrations.filter((r: any) => r.status === "paid").length,
        revenue: allRegistrations.reduce((acc: any, r: any) => acc + (r.totalPrice || 0), 0),
        claimedKits: allRegistrations.filter((r: any) => r.raceKitClaimed).length
    };

    const items = useMemo(() => {
        const rawItems = isOrganizerView ? (convexEvents?.page || []).slice(0, 5) : allRegistrations;
        return rawItems.map((item: any) => ({
            ...item,
            id: item._id || item.id
        }));
    }, [isOrganizerView, convexEvents, allRegistrations]);

    const allEvents = useMemo(() => {
        return (convexEvents?.page || []).map(e => ({
            ...e,
            id: e._id
        }));
    }, [convexEvents]);

    const loading = authLoading ||
        (isOrganizerView ? (convexEvents === undefined || organizerRegistrations === undefined) : (convexRegistrations === undefined));
    const error = null;
    const hasApplication = false;


    const completion = computeProfileCompletion(user as any);


    // Derived organizer stats (using aggregate queries from backend now)
    const claimedKits = stats.claimedKits || 0;
    const totalRegistrations = stats.secondary || 0;
    const claimPercentage = totalRegistrations > 0 ? Math.round((claimedKits / totalRegistrations) * 100) : 0;
    const publishedEvents = useMemo(() => allEvents.filter(e => e.status === "published"), [allEvents]);
    const draftEvents = useMemo(() => allEvents.filter(e => e.status === "draft"), [allEvents]);

    // Recent registrations (sorted by createdAt desc)
    const recentRegistrations = useMemo(() => {
        return [...allRegistrations]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 6);
    }, [allRegistrations]);

    // Per-event kit stats
    const eventKitStats = useMemo(() => {
        return items.map((event: any) => {
            const eventRegs = allRegistrations.filter((r: any) => r.eventId === event.id);
            const claimed = eventRegs.filter((r: any) => r.raceKitClaimed).length;
            return {
                ...event,
                regCount: eventRegs.length,
                claimedCount: claimed,
                claimPercent: eventRegs.length > 0 ? Math.round((claimed / eventRegs.length) * 100) : 0
            };
        });
    }, [items, allRegistrations]);

    // Per-event revenue
    const eventRevenue = useMemo(() => {
        const eventMap = new Map<string, { id: string, name: string; count: number; revenue: number }>();
        allRegistrations.forEach((r: any) => {
            const eventId = r.eventId;
            const event = allEvents.find(e => e._id === eventId);
            const eventTitle = event?.name || "Unknown Event";

            const existing = eventMap.get(eventId) || { id: eventId, name: eventTitle, count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += r.totalPrice || 0;
            eventMap.set(eventId, existing);
        });
        return Array.from(eventMap.values()).sort((a, b) => b.revenue - a.revenue);
    }, [allRegistrations, allEvents]);

    // Per-category revenue
    const categoryRevenue = useMemo(() => {
        const catMap = new Map<string, { name: string; eventInfo: string; count: number; revenue: number }>();
        allRegistrations.forEach((r: any) => {
            const catId = r.categoryId || "Unknown";
            const eventId = r.eventId || "Unknown";
            const event = allEvents.find(e => e._id === eventId);
            const eventTitle = event?.name || "Unknown Event";
            const category = event?.categories?.find((c: any) => c.id === catId);
            const categoryName = category?.name || catId;

            const key = `${eventId}_${catId}`;
            const existing = catMap.get(key) || { name: categoryName, eventInfo: eventTitle, count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += r.totalPrice || 0;
            catMap.set(key, existing);
        });
        return Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [allRegistrations, allEvents]);


    if (loading) {
        return (
            <PageWrapper className="pt-8 pb-12 space-y-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center bg-surface/50 p-6 rounded-[2rem] border border-white/5 mb-8">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                {/* Stats Row Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-8 w-48 mt-2" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <EventCardSkeleton />
                            <EventCardSkeleton />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-40 mt-2" />
                        <Skeleton className="h-80 w-full rounded-2xl" />
                    </div>
                </div>
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <p className="text-red-400 font-bold italic uppercase">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-8 text-white">
            <DashboardHeader
                userName={user?.displayName || ""}
                isOrganizerView={isOrganizerView}
                mode={mode}
                setMode={setMode}
                canSwitchMode={canSwitchMode}
            />

            {isOrganizerView ? (
                <OrganizerView
                    items={items}
                    allEvents={allEvents}
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
            ) : (
                <RunnerView
                    completion={completion}
                    items={items}
                    stats={stats}
                    hasApplication={hasApplication}
                    userRole={user?.role}
                />
            )}
        </PageWrapper>
    );
}
