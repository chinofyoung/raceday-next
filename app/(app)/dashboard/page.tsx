"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { computeProfileCompletion } from "@/lib/utils";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RunnerView } from "@/components/dashboard/RunnerView";
import { Skeleton, EventCardSkeleton, StatCardSkeleton } from "@/components/shared/Skeleton";

export default function DashboardPage() {
    const { user, role, loading: authLoading } = useAuth();

    // Runner specific queries
    const convexRegistrations = useQuery(api.registrations.getByUserId, user ? {
        userId: user._id as any
    } : "skip");

    const items = useMemo(() => {
        return (convexRegistrations || []).map((r: any) => ({
            ...r,
            id: r._id,
            participantInfo: r.registrationData?.participantInfo || r.participantInfo,
        }));
    }, [convexRegistrations]);

    const stats = {
        total: items.length,
    };

    const loading = authLoading || convexRegistrations === undefined;
    const completion = computeProfileCompletion(user as any);

    if (loading) {
        return (
            <PageWrapper className="pt-8 pb-12 space-y-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center bg-surface/50 p-6 rounded-[2rem] border border-white/5 mb-8">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                {/* Stats Row Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

    return (
        <PageWrapper className="pt-8 pb-12 space-y-8 text-white">
            <DashboardHeader
                userName={user?.displayName || ""}
                isOrganizerView={false}
            />

            <RunnerView
                completion={completion}
                items={items}
                stats={stats}
                hasApplication={false}
                userRole={user?.role}
            />
        </PageWrapper>
    );
}
