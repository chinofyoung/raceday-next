"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { computeProfileCompletion } from "@/lib/utils";

interface NormalizedRegistration {
    _id: string;
    id: string;
    eventId: string;
    status: string;
    participantInfo: Record<string, unknown>;
    [key: string]: unknown;
}

// Components
import { RunnerView } from "@/components/dashboard/RunnerView";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
    const { user, role, loading: authLoading } = useAuth();

    // Runner specific queries
    const convexRegistrations = useQuery(api.registrations.getByUserId, user ? {
        userId: user._id as any
    } : "skip");

    const items = useMemo((): NormalizedRegistration[] => {
        return (convexRegistrations || []).map((r) => ({
            ...r,
            id: r._id,
            participantInfo: (r as any).registrationData?.participantInfo || (r as any).participantInfo,
        }));
    }, [convexRegistrations]);

    const stats = {
        total: items.length,
    };

    const loading = authLoading || convexRegistrations === undefined;
    const completion = computeProfileCompletion(user as any);

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-8">
                {/* Header Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>

                {/* Profile Completion Skeleton */}
                <Skeleton className="h-32 w-full rounded-2xl" />

                {/* Hero Card Skeleton */}
                <div className="bg-surface/40 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <Skeleton className="aspect-[16/9] md:min-h-[280px]" />
                        <div className="p-6 md:p-8 space-y-4">
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-12 w-48" />
                            <div className="flex gap-2">
                                <Skeleton className="h-7 w-28 rounded-md" />
                                <Skeleton className="h-7 w-24 rounded-md" />
                            </div>
                            <div className="flex-1" />
                            <div className="flex gap-2 pt-4">
                                <Skeleton className="h-10 w-32 rounded-lg" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions + Announcements Row Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>

                {/* Event List Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-56" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-8 text-white">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                    Hello, <span className="text-primary">{user?.displayName?.split(' ')[0] || "there"}</span>
                </h1>
                <p className="text-text-muted font-medium">Welcome back to your race command center.</p>
            </div>

            <RunnerView
                completion={completion}
                items={items}
                stats={stats}
            />
        </div>
    );
}
