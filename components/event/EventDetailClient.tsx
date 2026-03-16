"use client";

import { useState, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RaceEvent } from "@/types/event";
import { useAuth } from "@/lib/hooks/useAuth";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Modular Components
import { EventHero } from "./EventHero";
import { EventNavigation } from "./EventNavigation";
import { EventInfo } from "./EventInfo";
import { EventAnnouncements } from "./EventAnnouncements";
import { EventCategories } from "./EventCategories";
import { EventTimeline } from "./EventTimeline";
import { EventRoute } from "./EventRoute";
import { MobileStickyCTA } from "./MobileStickyCTA";

const RouteMapViewer = dynamic(
    () => import("@/components/shared/RouteMapViewer").then(mod => mod.RouteMapViewer),
    { ssr: false, loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center italic text-text-muted">Loading Map...</div> }
);

interface EventDetailClientProps {
    event: RaceEvent;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
    const { user, loading: authLoading } = useAuth();
    const [activeRouteCategoryIndex, setActiveRouteCategoryIndex] = useState(0);
    const [activeSection, setActiveSection] = useState<string>("info");
    const [showMap, setShowMap] = useState(false);
    const mapSectionRef = useRef<HTMLDivElement>(null);

    const announcements = useQuery(api.announcements.listByEvent, {
        eventId: event.id as Id<"events">
    });

    // Replace service call with a direct Convex query — avoids a round-trip through getUserRegistrations
    const userRegistrationData = useQuery(
        api.registrations.getByUserAndEvent,
        user?._id && event.id
            ? { userId: user._id as Id<"users">, eventId: event.id as Id<"events"> }
            : "skip"
    );
    // While authLoading or the query is still in-flight (undefined), treat as checking
    const isCheckingRegistration = authLoading || (!!user?._id && userRegistrationData === undefined);
    const userRegistration = userRegistrationData ?? null;

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            // Trigger when the element crosses the middle of the viewport
            rootMargin: '-140px 0px -60% 0px'
        });

        const sections = ["info", "announcements", "categories", "timeline", "route"];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            sections.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 180;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const el = mapSectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShowMap(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const formatTimeAMPM = (timeStr: string) => {
        if (!timeStr) return "TBD";
        if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) return timeStr;
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    return (
        <div className="relative">
            <EventHero
                event={event}
                userRegistration={userRegistration}
                loadingAuth={isCheckingRegistration}
                isOrganizer={user?._id === event.organizerId}
            />

            <EventNavigation
                event={event}
                activeSection={activeSection}
                scrollToSection={scrollToSection}
                isRegistered={!!userRegistration || user?._id === event.organizerId}
            />

            <PageWrapper className="pt-0 max-w-7xl mx-auto flex flex-col gap-16 mt-8">
                <div className="w-full space-y-24">

                    <div className="space-y-32">
                        <EventInfo event={event} />

                        <EventAnnouncements announcements={announcements ?? []} />

                        <EventCategories
                            event={event}
                            formatTimeAMPM={formatTimeAMPM}
                        />

                        <EventTimeline event={event} />

                        <div ref={mapSectionRef}>
                            {showMap && (
                                <EventRoute
                                    event={event}
                                    activeRouteCategoryIndex={activeRouteCategoryIndex}
                                    setActiveRouteCategoryIndex={setActiveRouteCategoryIndex}
                                    RouteMapViewer={RouteMapViewer}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PageWrapper>

            <MobileStickyCTA
                event={event}
                isRegistered={!!userRegistration || user?._id === event.organizerId}
                loadingAuth={isCheckingRegistration}
            />
        </div>
    );
}
