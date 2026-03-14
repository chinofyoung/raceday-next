"use client";

import { useMemo } from "react";
import { VolunteerDashboard } from "@/components/dashboard/volunteer/VolunteerDashboard";
import { toDate } from "@/lib/utils";
import { ProfileCompletionCard } from "./runner/ProfileCompletionCard";
import { EventRegistrationList } from "./runner/EventRegistrationList";
import { NextRaceHero } from "./runner/NextRaceHero";

interface RunnerViewProps {
    completion: number;
    items: any[];
    stats: { total: number };
}

export function RunnerView({
    completion,
    items,
    stats,
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
