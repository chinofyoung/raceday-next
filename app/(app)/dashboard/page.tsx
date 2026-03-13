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
                <div className="flex justify-between items-center bg-surface/50 p-6 rounded-2xl border border-white/5">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full sm:w-36 rounded-xl" />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-6 lg:space-y-12">
                        {/* Profile Completion Skeleton */}
                        <Skeleton className="h-32 w-full rounded-2xl" />

                        {/* Event List Section */}
                        <div className="space-y-4 lg:space-y-6">
                            <Skeleton className="h-8 w-56" />
                            {/* Horizontal Event Card Skeletons */}
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="p-4 sm:p-5 bg-surface/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-4 lg:gap-5">
                                    <Skeleton className="w-full sm:w-40 lg:w-56 aspect-[2/1] sm:aspect-[3/4] lg:aspect-[4/3] rounded-xl shrink-0" />
                                    <div className="flex flex-col flex-1 gap-3 sm:py-1">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <Skeleton className="h-7 w-3/4" />
                                                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Skeleton className="h-7 w-36 rounded-lg" />
                                                <Skeleton className="h-7 w-24 rounded-lg" />
                                                <Skeleton className="h-7 w-20 rounded-lg" />
                                            </div>
                                        </div>
                                        <div className="flex-1" />
                                        <div className="flex gap-3">
                                            <Skeleton className="h-10 w-32 rounded-lg" />
                                            <Skeleton className="h-10 w-24 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-4 lg:space-y-8">
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <div className="p-6 bg-surface/50 border border-white/5 rounded-2xl space-y-6">
                            <Skeleton className="h-4 w-24 mx-auto" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-20 rounded-2xl" />
                                <Skeleton className="h-20 rounded-2xl" />
                            </div>
                            <Skeleton className="h-14 w-full rounded-2xl" />
                        </div>
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
                hasApplication={false}
                userRole={user?.role}
            />
        </div>
    );
}
