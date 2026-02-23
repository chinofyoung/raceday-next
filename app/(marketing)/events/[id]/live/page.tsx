import { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { notFound } from "next/navigation";
import { LiveTrackingClient } from "@/components/event/LiveTrackingClient";

interface LiveEventPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(props: LiveEventPageProps): Promise<Metadata> {
    const params = await props.params;
    const docRef = doc(db, "events", params.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        return {
            title: "Live Tracking Not Found",
        };
    }

    const event = snap.data() as RaceEvent;

    return {
        title: `Live Tracking - ${event.name}`,
        description: `Follow participants live for ${event.name}`,
    };
}

const toISOString = (date: any): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    if (typeof date.toDate === 'function') { // Firestore Timestamp
        try {
            return date.toDate().toISOString();
        } catch (e) {
            return null;
        }
    }
    if (date instanceof Date) {
        return date.toISOString();
    }
    return null;
};

export default async function LiveTrackingPage(props: LiveEventPageProps) {
    const params = await props.params;
    const docRef = doc(db, "events", params.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        notFound();
    }

    const data = snap.data();
    const event = {
        ...data,
        id: snap.id,
        date: toISOString(data?.date) || data?.date,
        registrationEndDate: toISOString(data?.registrationEndDate),
        earlyBird: data?.earlyBird ? {
            ...data.earlyBird,
            startDate: toISOString(data.earlyBird.startDate),
            endDate: toISOString(data.earlyBird.endDate),
        } : undefined,
        createdAt: toISOString(data?.createdAt),
        updatedAt: toISOString(data?.updatedAt),
    } as unknown as RaceEvent;

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
