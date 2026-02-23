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

    return (
        <LiveTrackingClient event={event} />
    );
}
