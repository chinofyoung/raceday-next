"use client";

import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";
import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isEventOver, isRegistrationClosed } from "@/lib/earlyBirdUtils";

interface MobileStickyCTAProps {
    event: RaceEvent;
    isRegistered?: boolean;
    loadingAuth?: boolean;
}

export function MobileStickyCTA({ event, isRegistered, loadingAuth }: MobileStickyCTAProps) {
    if (isEventOver(event) || isRegistrationClosed(event)) return null;

    if (loadingAuth) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-[2000] p-4 bg-background/95 backdrop-blur-md border-t border-white/10 lg:hidden flex gap-3">
                <div className="w-full h-14 bg-white/5 rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[2000] p-4 bg-background/95 backdrop-blur-md border-t border-white/10 lg:hidden flex gap-3">
            {isRegistered && event.isLiveTrackingEnabled !== false && (
                <Button
                    asChild
                    variant="outline"
                    className="h-14 px-6 text-sm font-black italic uppercase tracking-wider border-primary/30 text-primary bg-background shadow-xl hover:bg-primary/5 group shrink-0"
                >
                    <Link href={`/events/${event.id}/live`}>
                        <Activity className="animate-pulse" size={20} />
                    </Link>
                </Button>
            )}
            <Button
                asChild
                variant="primary"
                className="w-full h-14 text-lg font-black italic uppercase tracking-wider bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20 group flex-1"
            >
                <Link href={`/events/${event.id}/register`}>
                    Register Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
            </Button>
        </div>
    );
}
