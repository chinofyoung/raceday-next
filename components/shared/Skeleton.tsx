import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/5", className)}
            {...props}
        />
    );
}

export function EventCardSkeleton() {
    return (
        <div className="rounded-[2rem] bg-surface/30 border border-white/5 overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="p-6 bg-surface/40 border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
        </div>
    );
}
