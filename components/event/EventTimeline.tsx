"use client";

import { RaceEvent } from "@/types/event";
import { Clock } from "lucide-react";

interface EventTimelineProps {
    event: RaceEvent;
}

export function EventTimeline({ event }: EventTimelineProps) {
    return (
        <div id="timeline" className="space-y-8 max-w-7xl mx-auto px-4 md:px-0">
            <h2 className="text-3xl font-bold tracking-tight text-white text-center">Event <span className="text-primary">Timeline</span></h2>
            <div className="space-y-0">
                {event.timeline?.map((item, i) => (
                    <div key={`${item.time}-${item.activity}-${i}`} className="flex gap-8 group">
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(249,115,22,.5)] group-hover:scale-125 transition-transform" />
                            {i !== (event.timeline?.length || 0) - 1 && <div className="w-0.5 flex-1 bg-white/5 my-2" />}
                        </div>
                        <div className="pb-12 space-y-1">
                            <p className="text-primary font-semibold leading-none">{item.time}</p>
                            <h4 className="text-xl font-bold text-white">{item.activity}</h4>
                            {item.description && <p className="text-text-muted text-sm font-normal">{item.description}</p>}
                        </div>
                    </div>
                )) || (
                        <div className="py-24 text-center bg-surface/20 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-4">
                            <Clock className="text-text-muted opacity-20" size={48} />
                            <p className="text-text-muted font-medium">Schedule coming soon</p>
                        </div>
                    )}
            </div>
        </div>
    );
}
