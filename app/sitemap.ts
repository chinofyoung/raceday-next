import { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

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
        // Dynamic event routes
        const eventsSnap = await getDocs(
            query(collection(db, "events"), where("status", "==", "published"))
        );

        const eventRoutes = eventsSnap.docs.map((doc) => ({
            url: `${baseUrl}/events/${doc.id}`,
            lastModified: new Date(), // Ideally use doc.data().updatedAt
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

        return [...routes, ...eventRoutes];
    } catch (error) {
        console.error("Error generating sitemap:", error);
        return routes;
    }
}
