"use client";

import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RunnerEventCard } from "./RunnerEventCard";

interface EventRegistrationListProps {
    title: string;
    events: any[];
    isPast?: boolean;
}

export function EventRegistrationList({ title, events, isPast }: EventRegistrationListProps) {
    if (events.length === 0 && isPast) return null;

    return (
        <div className={isPast ? "space-y-6 pt-6" : "space-y-6"}>
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">{title}</h2>

            {events.length > 0 ? (
                <div className={isPast ? "grid grid-cols-1 gap-4 lg:gap-4 opacity-90" : "grid grid-cols-1 gap-4 lg:gap-4"}>
                    {events.map((reg) => (
                        <RunnerEventCard key={reg.id} reg={reg} isPast={isPast} />
                    ))}
                </div>
            ) : (
                <Card className="p-10 md:p-16 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-6 text-white rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cta/5 rounded-full blur-3xl group-hover:bg-cta/10 transition-colors duration-700" />
                    <div className="relative z-10 space-y-5">
                        <div className="w-20 h-20 mx-auto bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                            <Calendar className="text-text-muted opacity-40 group-hover:text-cta group-hover:opacity-100 transition-colors duration-500" size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white drop-shadow-sm">No Upcoming Races</h3>
                            <p className="text-sm md:text-base text-text-muted italic font-medium max-w-md mx-auto leading-relaxed">Your race calendar is currently empty. Find your next challenge and start training today!</p>
                        </div>
                        <Button variant="primary" asChild className="italic font-black uppercase text-white bg-cta hover:bg-cta-hover border-none shadow-lg shadow-cta/20 h-12 px-8">
                            <Link href="/events">Explore Races <ArrowRight size={18} className="ml-2" /></Link>
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
