"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboardMode } from "@/components/providers/DashboardModeProvider";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { getEvents } from "@/lib/services/eventService";
import { getRegistrations, getRegistrationsWithEvents } from "@/lib/services/registrationService";
import { computeProfileCompletion } from "@/lib/utils";
import { checkExistingApplication } from "@/lib/services/applicationService";

// New modular components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OrganizerView } from "@/components/dashboard/OrganizerView";
import { RunnerView } from "@/components/dashboard/RunnerView";


export default function DashboardPage() {
    const { user, firebaseUser, role, loading: authLoading } = useAuth();
    const { mode, setMode, canSwitchMode } = useDashboardMode();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, secondary: 0, revenue: 0 });
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
                const [eventsResult, regsResult] = await Promise.all([
                    getEvents({ organizerId: user.uid, limitCount: 100, status: "all" }),
                    getRegistrations({ organizerId: user.uid, status: "paid", limitCount: 200 })
                ]);

                const eventsList = eventsResult.items;
                const activeEvents = eventsList.filter((e: any) => e.status === "published");
                const myRegs = regsResult.items;
                const totalRevenue = myRegs.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

                setAllEvents(eventsList);
                setAllRegistrations(myRegs);
                setStats({
                    total: eventsList.length,
                    secondary: myRegs.length,
                    revenue: totalRevenue
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
                    revenue: 0
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


    // Derived organizer stats
    const claimedKits = useMemo(() => allRegistrations.filter(r => r.raceKitClaimed).length, [allRegistrations]);
    const claimPercentage = useMemo(() => allRegistrations.length > 0 ? Math.round((claimedKits / allRegistrations.length) * 100) : 0, [claimedKits, allRegistrations]);
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

    // Per-category revenue
    const categoryRevenue = useMemo(() => {
        const catMap = new Map<string, { name: string; count: number; revenue: number }>();
        allRegistrations.forEach(r => {
            const catId = r.categoryId || "Unknown";
            const existing = catMap.get(catId) || { name: catId, count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += r.totalPrice || 0;
            catMap.set(catId, existing);
        });
        return Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [allRegistrations]);


    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest italic animate-pulse">Loading Dashboard...</p>
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
