"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OrganizerView } from "@/components/dashboard/OrganizerView";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizerDashboardPage() {
    const { user, loading: authLoading } = useAuth();

    // Organizer specific queries
    const convexEvents = useQuery(api.events.list, user ? {
        organizerId: user?._id as any,
        status: "all",
        paginationOpts: { numItems: 100, cursor: null }
    } : "skip");

    const organizerRegistrations = useQuery(api.registrations.list, user ? {
        organizerId: user._id as any,
        status: "all",
        paginationOpts: { numItems: 1000, cursor: null }
    } : "skip");

    const allEvents = useMemo(() => {
        return (convexEvents?.page || []).map(e => ({
            ...e,
            id: e._id
        }));
    }, [convexEvents]);

    const allRegistrations: any[] = useMemo(() => {
        const rawRegs = organizerRegistrations?.page || [];

        return rawRegs.map((r: any) => {
            const event = allEvents.find(e => e._id === r.eventId);
            const category = event?.categories?.find((c: any) => (c.id || "0") === r.categoryId);

            return {
                ...r,
                id: r._id,
                participantInfo: r.registrationData?.participantInfo || r.participantInfo,
                eventName: event?.name || "Unknown Event",
                categoryName: category?.name || r.categoryId
            };
        });
    }, [organizerRegistrations, allEvents]);

    const stats = {
        total: (convexEvents?.page || []).length,
        secondary: allRegistrations.filter((r: any) => r.status === "paid").length,
        revenue: allRegistrations.reduce((acc: any, r: any) => acc + (r.totalPrice || 0), 0),
        claimedKits: allRegistrations.filter((r: any) => r.raceKitClaimed).length
    };

    const items = useMemo(() => {
        const rawItems = (convexEvents?.page || []).filter((e: any) => e.status === "published").slice(0, 5);
        return rawItems.map((item: any) => ({
            ...item,
            id: item._id || item.id
        }));
    }, [convexEvents]);

    const loading = authLoading || convexEvents === undefined || organizerRegistrations === undefined;

    // Derived organizer stats
    const claimedKits = stats.claimedKits || 0;
    const totalRegistrations = stats.secondary || 0;
    const claimPercentage = totalRegistrations > 0 ? Math.round((claimedKits / totalRegistrations) * 100) : 0;
    const publishedEvents = useMemo(() => allEvents.filter(e => e.status === "published"), [allEvents]);
    const draftEvents = useMemo(() => allEvents.filter(e => e.status === "draft"), [allEvents]);

    const recentRegistrations = useMemo(() => {
        return [...allRegistrations]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 6);
    }, [allRegistrations]);

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
            <div className="space-y-8">
                <div className="flex justify-between items-center bg-surface/50 p-6 rounded-[2rem] border border-white/5 mb-8">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-card">
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-8 w-48 mt-2" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                                    <Skeleton className="h-40 w-full" />
                                    <div className="p-4 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-40 mt-2" />
                        <Skeleton className="h-80 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-white">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                    Hello, <span className="text-primary">{user?.displayName?.split(' ')[0] || "there"}</span>
                </h1>
                <p className="text-text-muted font-medium italic">Your race command center. Everything at a glance.</p>
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
