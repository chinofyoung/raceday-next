import { MetadataRoute } from "next";
import { getEvents } from "@/lib/services/eventService";
import { toDate } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://raceday.com";

    // Base routes
    const routes = [
        "",
        "/events",
        "/organizers",
        "/about",
        "/login",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    try {
        // Dynamic event routes - Capped at 1000 most recent published events
        const { items: events } = await getEvents({
            status: "published",
            limitCount: 1000
        });

        const eventRoutes = events.map((event) => ({
            url: `${baseUrl}/events/${event.id}`,
            lastModified: toDate((event as any).updatedAt || (event as any).createdAt || new Date()),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

        return [...routes, ...eventRoutes];
    } catch (error) {
        console.error("Error generating sitemap:", error);
        return routes;
    }
}
