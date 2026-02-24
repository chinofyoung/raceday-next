"use client";

import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";
import { Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isEventOver, isRegistrationClosed } from "@/lib/earlyBirdUtils";

interface EventNavigationProps {
    event: RaceEvent;
    activeSection: string;
    scrollToSection: (id: string) => void;
    isRegistered?: boolean;
}

export function EventNavigation({ event, activeSection, scrollToSection, isRegistered }: EventNavigationProps) {
    const tabs = ["info", "announcements", "categories", "timeline", "route"] as const;

    return (
        <div className="sticky top-[84px] z-40 bg-background/95 backdrop-blur-2xl border-b border-white/5 py-4 max-w-7xl mx-auto w-full px-4 md:px-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-2 -my-2 no-scrollbar mask-linear-fade flex-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => scrollToSection(tab)}
                            className={cn(
                                "px-4 py-2 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap hover:cursor-pointer hover:scale-105 active:scale-95",
                                activeSection === tab
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                    : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {!isEventOver(event) && !isRegistrationClosed(event) && (
                    <div className="hidden lg:flex ml-8 items-center gap-4">
                        {isRegistered && event.isLiveTrackingEnabled !== false && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-10 px-6 uppercase italic font-black text-xs border-primary/30 text-primary hover:bg-primary/10 tracking-widest hidden xl:flex"
                            >
                                <Link href={`/events/${event.id}/live`}>
                                    <Activity size={14} className="mr-2 animate-pulse" /> Live Track
                                </Link>
                            </Button>
                        )}
                        <Button
                            onClick={() => scrollToSection("categories")}
                            variant="primary"
                            size="sm"
                            className="h-10 px-6 uppercase italic font-black text-xs shadow-lg shadow-cta/20 bg-cta hover:bg-cta-hover border-none"
                        >
                            Register Now
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
