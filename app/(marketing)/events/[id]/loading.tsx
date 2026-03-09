import { Skeleton } from "@/components/shared/Skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function EventLoading() {
    return (
        <div className="min-h-screen">
            {/* Hero image skeleton */}
            <Skeleton className="w-full h-[40vh] md:h-[50vh] rounded-none" />
            <PageWrapper className="py-12 space-y-10">
                {/* Title & meta */}
                <div className="space-y-4">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-12 w-3/4 md:w-1/2" />
                    <div className="flex gap-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <Skeleton className="h-5 w-full max-w-2xl" />
                    <Skeleton className="h-5 w-2/3 max-w-xl" />
                </div>
                {/* Categories grid */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-40" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
                {/* Map/Route section */}
                <Skeleton className="h-64 w-full rounded-2xl" />
            </PageWrapper>
        </div>
    );
}
