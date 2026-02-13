import { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { EventDetailClient } from "@/components/event/EventDetailClient";
import { notFound } from "next/navigation";

interface EventPageProps {
    params: { id: string };
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
    const docRef = doc(db, "events", params.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        return {
            title: "Event Not Found",
        };
    }

    const event = snap.data() as RaceEvent;

    return {
        title: event.name,
        description: event.description.substring(0, 160),
        openGraph: {
            title: event.name,
            description: event.description,
            images: [event.featuredImage].filter(Boolean) as string[],
        },
    };
}

export default async function EventDetailPage({ params }: EventPageProps) {
    const docRef = doc(db, "events", params.id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        notFound();
    }

    const event = { id: snap.id, ...snap.data() } as RaceEvent;

    // Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.name,
        "description": event.description,
        "image": event.featuredImage,
        "startDate": event.date instanceof Date ? event.date.toISOString() : (event.date as any).toDate?.().toISOString(),
        "location": {
            "@type": "Place",
            "name": event.location.name,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": event.location.name,
                "addressRegion": "PH",
                "addressCountry": "PH"
            }
        },
        "offers": {
            "@type": "Offer",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://raceday.com"}/events/${event.id}`,
            "price": event.categories?.length > 0 ? Math.min(...event.categories.map(c => c.price)) : 0,
            "priceCurrency": "PHP",
            "availability": "https://schema.org/InStock"
        },
        "organizer": {
            "@type": "Organization",
            "name": "RaceDay"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <EventDetailClient event={event} />
        </>
    );
}
