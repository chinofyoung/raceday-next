"use client";

import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/button";
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
        <div className="sticky top-[84px] z-40 bg-background/95 backdrop-blur-2xl border-b border-white/5 py-4 w-full">
            <div className="flex items-center justify-between max-w-7xl mx-auto px-4 md:px-0">
                <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-2 -my-2 no-scrollbar mask-linear-fade flex-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => scrollToSection(tab)}
                            className={cn(
                                "px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap hover:cursor-pointer",
                                activeSection === tab
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {!isEventOver(event) && !isRegistrationClosed(event) && (
                    <div className="hidden lg:flex ml-8 items-center gap-4">
                        <Button
                            onClick={() => scrollToSection("categories")}
                            variant="primary"
                            size="sm"
                            className="h-10 px-6 font-semibold text-sm bg-cta hover:bg-cta/90 border-none"
                        >
                            Register Now
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
