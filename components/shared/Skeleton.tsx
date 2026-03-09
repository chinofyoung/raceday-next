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

export function RegistrationFormSkeleton() {
    return (
        <div className="space-y-8">
            {/* Back link */}
            <Skeleton className="h-4 w-24" />

            {/* Title area */}
            <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
            </div>

            {/* Form card */}
            <div className="bg-surface/30 border border-white/5 rounded-2xl p-8 space-y-6">
                {/* Row: first + last name */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                </div>

                {/* Row: phone + age */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                </div>

                {/* Category select */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                </div>

                {/* Emergency contact */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                </div>

                {/* Submit button */}
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Why Register card */}
            <div className="bg-surface/30 border border-white/5 rounded-2xl p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 text-center">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function RegistrationSuccessSkeleton() {
    return (
        <div className="flex flex-col items-center space-y-8">
            {/* Check icon */}
            <Skeleton className="w-20 h-20 rounded-full" />

            {/* Title */}
            <div className="space-y-2 text-center">
                <Skeleton className="h-9 w-64 mx-auto" />
                <Skeleton className="h-5 w-48 mx-auto" />
            </div>

            {/* Ticket card */}
            <div className="w-full max-w-lg rounded-[2.5rem] bg-[#0A0D10]/80 border border-white/5 overflow-hidden">
                {/* Ticket header */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Perforated divider */}
                <div className="flex items-center gap-2 px-4 py-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-px flex-1" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                </div>

                {/* Ticket body */}
                <div className="p-6 flex gap-6 items-start">
                    {/* QR code */}
                    <Skeleton className="w-[220px] h-[220px] rounded-2xl shrink-0" />

                    {/* Athlete info */}
                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                    </div>
                </div>

                {/* Ticket footer */}
                <div className="p-6 pt-0">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>

            {/* Share card */}
            <div className="w-full max-w-lg bg-surface/30 border border-white/5 rounded-2xl p-6 space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-10 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AdminKPICardSkeleton() {
    return (
        <div className="p-6 bg-surface border border-white/5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-16" />
                </div>
            </div>
        </div>
    );
}

export function AuditLogSkeleton() {
    return (
        <div className="p-6 bg-surface/30 border border-white/5 rounded-2xl">
            <div className="flex items-start gap-4">
                {/* Clock icon placeholder */}
                <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />

                {/* Content */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
        </div>
    );
}

export function VolunteerInviteSkeleton() {
    return (
        <div className="space-y-8">
            {/* Icon */}
            <Skeleton className="w-20 h-20 rounded-3xl" />

            {/* Title + subtitle */}
            <div className="space-y-2 text-center">
                <Skeleton className="h-8 w-56 mx-auto" />
                <Skeleton className="h-5 w-72 mx-auto" />
            </div>

            {/* Event card */}
            <div className="w-full bg-surface/30 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>

            {/* Permissions section */}
            <div className="w-full bg-surface/30 border border-white/5 rounded-2xl p-6 space-y-4">
                <Skeleton className="h-4 w-32 mb-2" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                        <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Button */}
            <Skeleton className="h-12 w-full rounded-xl" />
        </div>
    );
}

export function EventDetailManagementSkeleton() {
    return (
        <div className="space-y-8">
            {/* Back link */}
            <Skeleton className="h-4 w-28" />

            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-12 w-2/3" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-32 rounded-xl" />
                ))}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-5 bg-surface/40 border border-white/5 rounded-2xl space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="w-8 h-8 rounded-lg mt-1" />
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 border-b border-white/5 pb-0">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-t-lg rounded-b-none" />
                ))}
            </div>

            {/* Table */}
            <div className="bg-surface/30 border border-white/5 rounded-2xl overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/5">
                    {["w-16", "w-20", "w-12", "w-16", "w-20"].map((w, i) => (
                        <Skeleton key={i} className={`h-3 ${w}`} />
                    ))}
                </div>

                {/* Body rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/5 last:border-0">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-20 self-center" />
                        <Skeleton className="h-4 w-10 self-center" />
                        <Skeleton className="h-6 w-16 rounded-full self-center" />
                        <Skeleton className="h-6 w-16 rounded-full self-center" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function EditEventSkeleton() {
    return (
        <div className="space-y-8">
            {/* Back link */}
            <Skeleton className="h-4 w-28" />

            {/* Title area */}
            <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>

            {/* Form sections */}
            <div className="space-y-6">
                {/* Section: Basic Info */}
                <div className="bg-surface/30 border border-white/5 rounded-2xl p-8 space-y-6">
                    <Skeleton className="h-5 w-28" />

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-28 w-full rounded-xl" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Section: Location & Date */}
                <div className="bg-surface/30 border border-white/5 rounded-2xl p-8 space-y-6">
                    <Skeleton className="h-5 w-32" />

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Section: Categories */}
                <div className="bg-surface/30 border border-white/5 rounded-2xl p-8 space-y-6">
                    <Skeleton className="h-5 w-24" />

                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section: Image upload */}
                <div className="bg-surface/30 border border-white/5 rounded-2xl p-8 space-y-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>

                {/* Submit button row */}
                <div className="flex justify-end gap-3">
                    <Skeleton className="h-11 w-24 rounded-xl" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
