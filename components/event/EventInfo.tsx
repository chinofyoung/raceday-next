"use client";

import { RaceEvent } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";
import { EventGallery } from "./EventGallery";

interface EventInfoProps {
    event: RaceEvent;
}

export function EventInfo({ event }: EventInfoProps) {
    return (
        <div id="info" className="space-y-10 px-4 md:px-0">
            <div className="space-y-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">About the <span className="text-primary">Race</span></h2>
                <p className="text-lg text-text-muted leading-relaxed font-medium">
                    {event.description}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-surface/30 border-white/5 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h4 className="font-black italic uppercase text-white">Medals & Loot</h4>
                        <p className="text-xs text-text-muted mt-1 font-medium italic leading-relaxed">Exclusive finisher medals and race kits for all valid participants.</p>
                    </div>
                </Card>
                <Card className="p-6 bg-surface/30 border-white/5 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center text-cta shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 className="font-black italic uppercase text-white">Community</h4>
                        <p className="text-xs text-text-muted mt-1 font-medium italic leading-relaxed">Join thousands of runners in an unforgettable shared experience.</p>
                    </div>
                </Card>
            </div>
            <div className="mt-10">
                <EventGallery images={event.galleryImages} eventName={event.name} />
            </div>
        </div>
    );
}
