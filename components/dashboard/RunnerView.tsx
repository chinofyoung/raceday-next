"use client";

import { useMemo } from "react";
import { VolunteerDashboard } from "@/components/dashboard/volunteer/VolunteerDashboard";
import { toDate } from "@/lib/utils";
import { ProfileCompletionCard } from "./runner/ProfileCompletionCard";
import { EventRegistrationList } from "./runner/EventRegistrationList";
import { NextRaceHero } from "./runner/NextRaceHero";
import { PendingPaymentSection } from "./runner/PendingPaymentSection";

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
    const { heroEvent, pendingPayment, otherUpcoming, pastEvents } = useMemo(() => {
        const now = new Date();

        // Extract all pending-payment registrations first (show regardless of event date)
        const pending = items.filter(reg => reg.status === "pending");
        const pendingIds = new Set(pending.map(reg => reg.id));

        // Non-pending registrations split into upcoming vs past
        const nonPending = items.filter(reg => !pendingIds.has(reg.id));

        const upcoming = nonPending.filter(reg => {
            if (!reg.event) return true;
            const eventDate = toDate(reg.event.date);
            return eventDate >= now && reg.event?.status !== "completed";
        }).sort((a, b) => {
            const dA = toDate(a.event?.date).getTime();
            const dB = toDate(b.event?.date).getTime();
            return dA - dB;
        });

        const past = nonPending.filter(reg => {
            if (!reg.event) return false;
            const eventDate = toDate(reg.event.date);
            return eventDate < now || reg.event?.status === "completed";
        }).sort((a, b) => {
            const dA = toDate(a.event?.date).getTime();
            const dB = toDate(b.event?.date).getTime();
            return dB - dA;
        });

        // Hero is the first upcoming registration with a valid event
        const hero = upcoming.find(reg => reg.event) || null;
        const others = hero ? upcoming.filter(reg => reg.id !== hero.id) : upcoming;

        return { heroEvent: hero, pendingPayment: pending, otherUpcoming: others, pastEvents: past };
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

                {/* Pending Payment Registrations */}
                <PendingPaymentSection registrations={pendingPayment} />

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
                {!heroEvent && otherUpcoming.length === 0 && pendingPayment.length === 0 && (
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
