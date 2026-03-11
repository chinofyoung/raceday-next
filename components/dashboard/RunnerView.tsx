"use client";

import { useMemo } from "react";
import { RunnerQuickActions } from "@/components/dashboard/RunnerQuickActions";
import { VolunteerDashboard } from "@/components/dashboard/volunteer/VolunteerDashboard";
import { toDate } from "@/lib/utils";
import { ProfileCompletionCard } from "./runner/ProfileCompletionCard";
import { EventRegistrationList } from "./runner/EventRegistrationList";

interface RunnerViewProps {
    completion: number;
    items: any[];
    stats: { total: number };
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerView({
    completion,
    items,
    stats,
    hasApplication,
    userRole
}: RunnerViewProps) {
    const now = useMemo(() => new Date(), []);

    // Sort items so most recent/upcoming makes sense.
    const { upcomingEvents, pastEvents } = useMemo(() => {
        const upcoming = items.filter(reg => {
            if (!reg.event) return true;
            const eventDate = toDate(reg.event.date);
            return eventDate >= now && reg.event?.status !== "completed";
        }).sort((a, b) => {
            const dA = toDate(a.event?.date).getTime();
            const dB = toDate(b.event?.date).getTime();
            return dA - dB;
        });

        const past = items.filter(reg => {
            if (!reg.event) return false;
            const eventDate = toDate(reg.event.date);
            return eventDate < now || reg.event?.status === "completed";
        }).sort((a, b) => {
            const dA = toDate(a.event?.date).getTime();
            const dB = toDate(b.event?.date).getTime();
            return dB - dA; // most recent past first
        });

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [items, now]);

    return (
        <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
            <RunnerQuickActions hasApplication={hasApplication} userRole={userRole} />

            <div className="space-y-6 lg:space-y-12">
                {/* Profile Completion Card */}
                <ProfileCompletionCard completion={completion} />

                {/* Volunteer Dashboard */}
                <VolunteerDashboard />

                {/* My Registered Events */}
                <EventRegistrationList
                    title="My Registered Events"
                    events={upcomingEvents}
                />

                {/* My Past Events */}
                <EventRegistrationList
                    title="My Past Events"
                    events={pastEvents}
                    isPast
                />
            </div>
        </div>
    );
}
