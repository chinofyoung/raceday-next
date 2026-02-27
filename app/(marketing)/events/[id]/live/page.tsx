import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RaceEvent } from "@/types/event";
import { notFound } from "next/navigation";
import { LiveTrackingClient } from "@/components/event/LiveTrackingClient";

interface LiveEventPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(props: LiveEventPageProps): Promise<Metadata> {
    const params = await props.params;
    const event = await fetchQuery(api.events.getById, { id: params.id as Id<"events"> });

    if (!event) {
        return { title: "Live Tracking Not Found" };
    }

    return {
        title: `Live Tracking - ${event.name}`,
        description: `Follow participants live for ${event.name}`,
    };
}

export default async function LiveTrackingPage(props: LiveEventPageProps) {
    const params = await props.params;
    const eventData = await fetchQuery(api.events.getById, { id: params.id as Id<"events"> });

    if (!eventData) {
        notFound();
    }

    const event = {
        ...eventData,
        id: eventData._id,
    } as any as RaceEvent;

    if (event.isLiveTrackingEnabled === false) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background p-6">
                <div className="bg-surface/40 p-10 rounded-3xl border border-white/10 text-center max-w-md w-full shadow-2xl space-y-6">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Live Tracking Disabled</h2>
                    <p className="text-text-muted font-medium italic">
                        The organizer has disabled the Live Tracking feature for this event.
                    </p>
                    <div className="pt-4">
                        <a href={`/events/${event.id}`} className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-black italic uppercase rounded-lg transition-colors border border-white/10">
                            Go Back to Event
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <LiveTrackingClient event={event} />
    );
}
