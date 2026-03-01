import { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventDetailClient } from "@/components/event/EventDetailClient";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RaceEvent } from "@/types/event";

interface EventPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(props: EventPageProps): Promise<Metadata> {
    const params = await props.params;
    try {
        const event = await fetchQuery(api.events.getById, { id: params.id as Id<"events"> });
        if (!event) return { title: "Event Not Found" };

        return {
            title: event.name,
            description: event.description.substring(0, 160),
            openGraph: {
                title: event.name,
                description: event.description,
                images: [event.featuredImage].filter(Boolean) as string[],
            },
        };
    } catch (e) {
        return { title: "Event Not Found" };
    }
}

const toISOString = (date: any): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date;

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
    } catch {
        return null;
    }
};


export default async function EventDetailPage(props: EventPageProps) {
    const params = await props.params;
    let eventData;
    try {
        eventData = await fetchQuery(api.events.getById, { id: params.id as Id<"events"> });
    } catch (e) {
        notFound();
    }

    if (!eventData) {
        notFound();
    }

    const event = {
        ...eventData,
        id: eventData._id,
    } as unknown as RaceEvent;

    // Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.name,
        "description": event.description,
        "image": event.featuredImage,
        "startDate": event.date,
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
