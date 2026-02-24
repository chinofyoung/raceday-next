"use client";

import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useRouter } from "next/navigation";
import { RaceEvent } from "@/types/event";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserRegistrations, getCategoryCounts } from "@/lib/services/registrationService";
import { Announcement } from "@/types/announcement";
import dynamic from "next/dynamic";

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
    const { user } = useAuth();
    const [activeRouteCategoryIndex, setActiveRouteCategoryIndex] = useState(0);
    const [userRegistration, setUserRegistration] = useState<any>(null);
    const [activeSection, setActiveSection] = useState<string>("info");
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

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
        if (user?.uid && event.id) {
            getUserRegistrations(user.uid).then(regs => {
                const reg = regs.find(r => r.eventId === event.id && (r.status === 'paid' || r.status === 'pending'));
                setUserRegistration(reg);
            });
        }
    }, [user, event.id]);

    useEffect(() => {
        if (event.id) {
            getCategoryCounts(event.id).then(counts => {
                setLiveCounts(counts);
            });
        }
    }, [event.id]);

    useEffect(() => {
        if (event.id) {
            fetch(`/api/events/${event.id}/announcements`)
                .then(res => res.json())
                .then(data => setAnnouncements(data || []))
                .catch(err => console.error("Failed to fetch announcements:", err));
        }
    }, [event.id]);

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
            />

            <EventNavigation
                event={event}
                activeSection={activeSection}
                scrollToSection={scrollToSection}
                isRegistered={!!userRegistration || user?.uid === event.organizerId}
            />

            <PageWrapper className="pt-0 pb-36 lg:pb-24 max-w-7xl mx-auto flex flex-col gap-16">
                <div className="w-full space-y-24">

                    <div className="space-y-32">
                        <EventInfo event={event} />

                        <EventAnnouncements announcements={announcements} />

                        <EventCategories
                            event={event}
                            liveCounts={liveCounts}
                            formatTimeAMPM={formatTimeAMPM}
                        />

                        <EventTimeline event={event} />

                        <EventRoute
                            event={event}
                            activeRouteCategoryIndex={activeRouteCategoryIndex}
                            setActiveRouteCategoryIndex={setActiveRouteCategoryIndex}
                            RouteMapViewer={RouteMapViewer}
                        />
                    </div>
                </div>
            </PageWrapper>

            <MobileStickyCTA
                event={event}
                isRegistered={!!userRegistration || user?.uid === event.organizerId}
            />
        </div>
    );
}
