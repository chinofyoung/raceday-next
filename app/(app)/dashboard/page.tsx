"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboardMode } from "@/components/providers/DashboardModeProvider";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { getEvents } from "@/lib/services/eventService";
import { getRegistrations, getRegistrationsWithEvents, getOrganizerStats, getCategoryCounts } from "@/lib/services/registrationService";
import { computeProfileCompletion } from "@/lib/utils";
import { checkExistingApplication } from "@/lib/services/applicationService";

// New modular components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OrganizerView } from "@/components/dashboard/OrganizerView";
import { RunnerView } from "@/components/dashboard/RunnerView";
import { Skeleton, EventCardSkeleton, StatCardSkeleton } from "@/components/shared/Skeleton";

export default function DashboardPage() {
    const { user, firebaseUser, role, loading: authLoading } = useAuth();
    const { mode, setMode, canSwitchMode } = useDashboardMode();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, secondary: 0, revenue: 0, claimedKits: 0 });
    const [items, setItems] = useState<any[]>([]);
    const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasApplication, setHasApplication] = useState(false);


    const completion = computeProfileCompletion(user as any);
    const isOrganizerView = mode === "organizer";

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                fetchDashboardData();
                checkApp();
            } else {
                setLoading(false);
            }
        }
    }, [user, authLoading, mode]);

    const fetchDashboardData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            if (isOrganizerView) {
                // Fetch stats via aggregate queries + small batch of recent registrations
                const [eventsResult, regsResult, aggregateStats] = await Promise.all([
                    getEvents({ organizerId: user.uid, limitCount: 100, status: "all" }),
                    getRegistrations({ organizerId: user.uid, status: "paid", limitCount: 50 }), // Only fetch 50 for the feed and basic category estimation if needed
                    getOrganizerStats(user.uid)
                ]);

                const eventsList = eventsResult.items;
                const activeEvents = eventsList.filter((e: any) => e.status === "published");
                const myRegs = regsResult.items;

                setAllEvents(eventsList);
                setAllRegistrations(myRegs);
                setStats({
                    total: eventsList.length,
                    secondary: aggregateStats.totalRegistrations,
                    revenue: aggregateStats.totalRevenue,
                    claimedKits: aggregateStats.claimedKits
                });
                setItems(activeEvents.slice(0, 5));
            } else {
                const result = await getRegistrationsWithEvents({
                    userId: user.uid,
                    limitCount: 100
                });

                setStats({
                    total: result.items.filter((r: any) => r.status === "paid").length,
                    secondary: 0,
                    revenue: 0,
                    claimedKits: 0
                });
                setItems(result.items);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError("Failed to load your dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const checkApp = async () => {
        if (!user) return;
        try {
            const app = await checkExistingApplication(user.uid);
            setHasApplication(!!app);
        } catch (error) {
            console.error("Error checking app:", error);
        }
    };


    // Derived organizer stats (using aggregate queries from backend now)
    const claimedKits = stats.claimedKits || 0;
    const totalRegistrations = stats.secondary || 0;
    const claimPercentage = totalRegistrations > 0 ? Math.round((claimedKits / totalRegistrations) * 100) : 0;
    const publishedEvents = useMemo(() => allEvents.filter(e => e.status === "published"), [allEvents]);
    const draftEvents = useMemo(() => allEvents.filter(e => e.status === "draft"), [allEvents]);

    // Recent registrations (sorted by createdAt desc)
    const recentRegistrations = useMemo(() => {
        return [...allRegistrations]
            .sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            })
            .slice(0, 6);
    }, [allRegistrations]);

    // Per-event kit stats
    const eventKitStats = useMemo(() => {
        return items.map(event => {
            const eventRegs = allRegistrations.filter(r => r.eventId === event.id);
            const claimed = eventRegs.filter(r => r.raceKitClaimed).length;
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
        allRegistrations.forEach(r => {
            const eventId = r.eventId;
            const event = allEvents.find(e => e.id === eventId);
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
        allRegistrations.forEach(r => {
            const catId = r.categoryId || "Unknown";
            const eventId = r.eventId || "Unknown";
            const event = allEvents.find(e => e.id === eventId);
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
                    <Button variant="outline" onClick={fetchDashboardData}>
                        Try Again
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
