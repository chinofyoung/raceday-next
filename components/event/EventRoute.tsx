"use client";

import { RaceEvent } from "@/types/event";
import { Info, MapPin } from "lucide-react";
import { cn, formatDistance } from "@/lib/utils";

interface EventRouteProps {
    event: RaceEvent;
    activeRouteCategoryIndex: number;
    setActiveRouteCategoryIndex: (index: number) => void;
    RouteMapViewer: any; // Dynamic component type
}

export function EventRoute({ event, activeRouteCategoryIndex, setActiveRouteCategoryIndex, RouteMapViewer }: EventRouteProps) {
    return (
        <div id="route" className="space-y-8 px-4 md:px-0 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[100%] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Race <span className="text-primary">Course</span></h2>

                {event.categories && event.categories.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                        {event.categories.map((cat, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveRouteCategoryIndex(i)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all border",
                                    activeRouteCategoryIndex === i
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-text-muted border-white/5 hover:border-white/20 hover:text-white"
                                )}
                            >
                                {formatDistance(cat.distance, cat.distanceUnit)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {event.categories?.[activeRouteCategoryIndex]?.routeMap?.gpxFileUrl ? (
                <div key={activeRouteCategoryIndex} className="space-y-6 animate-in fade-in duration-500">
                    <div className="aspect-square md:aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl relative isolate">
                        <RouteMapViewer
                            // Key is important to force re-render when switching GPX files
                            key={event.categories[activeRouteCategoryIndex].routeMap.gpxFileUrl}
                            gpxUrl={event.categories[activeRouteCategoryIndex].routeMap.gpxFileUrl}
                            zoom={14}
                            theme="dark"
                            stations={event.categories[activeRouteCategoryIndex].stations}
                        />
                        <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-lg">
                            <p className="text-xs font-black uppercase italic tracking-wider text-white">
                                Showing: <span className="text-primary">{event.categories[activeRouteCategoryIndex].name}</span>
                            </p>
                        </div>
                    </div>
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                        <Info className="text-primary shrink-0" size={24} />
                        <p className="text-xs text-text-muted leading-relaxed font-medium italic">
                            Interactive map shows the official course for {event.categories[activeRouteCategoryIndex].name}. Use the zoom controls to explore terrain and elevation. Station locations are marked on the map above.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                    <MapPin className="text-text-muted opacity-20" size={48} />
                    <p className="text-text-muted font-bold uppercase italic tracking-widest">
                        Route details for {event.categories?.[activeRouteCategoryIndex]?.name || "this category"} coming soon
                    </p>
                </div>
            )}
        </div>
    );
}
