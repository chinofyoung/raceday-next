"use client";

import { useMemo } from "react";
import { VolunteerDashboard } from "@/components/dashboard/volunteer/VolunteerDashboard";
import { RunnerQuickActions } from "@/components/dashboard/RunnerQuickActions";
import { RunnerAnnouncements } from "@/components/dashboard/RunnerAnnouncements";
import { toDate } from "@/lib/utils";
import { ProfileCompletionCard } from "./runner/ProfileCompletionCard";
import { EventRegistrationList } from "./runner/EventRegistrationList";
import { NextRaceHero } from "./runner/NextRaceHero";

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
    const { heroEvent, otherUpcoming, pastEvents } = useMemo(() => {
        const now = new Date();

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
            return dB - dA;
        });

        // First upcoming with a valid event is the hero
        const hero = upcoming.find(reg => reg.event) || null;
        const others = hero ? upcoming.filter(reg => reg.id !== hero.id) : upcoming;

        return { heroEvent: hero, otherUpcoming: others, pastEvents: past };
    }, [items]);

    return (
        <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
            <div className="space-y-6 lg:space-y-8">
                {/* Profile Completion Card */}
                <ProfileCompletionCard completion={completion} />

                {/* Next Race Hero */}
                {heroEvent && heroEvent.event && (
                    <NextRaceHero registration={heroEvent} />
                )}

                {/* Quick Actions + Announcements Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                        <h3 className="text-sm font-bold uppercase tracking-tight text-white mb-4">Quick Actions</h3>
                        <RunnerQuickActions hasApplication={hasApplication} userRole={userRole} />
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                        <RunnerAnnouncements />
                    </div>
                </div>

                {/* Volunteer Dashboard */}
                <VolunteerDashboard />

                {/* Other Upcoming Events */}
                {otherUpcoming.length > 0 && (
                    <EventRegistrationList
                        title="Other Upcoming Events"
                        events={otherUpcoming}
                    />
                )}

                {/* Empty state when no upcoming events at all */}
                {!heroEvent && otherUpcoming.length === 0 && (
                    <EventRegistrationList
                        title="My Registered Events"
                        events={[]}
                    />
                )}

                {/* Past Events */}
                <EventRegistrationList
                    title="My Past Events"
                    events={pastEvents}
                    isPast
                />
            </div>
        </div>
    );
}
