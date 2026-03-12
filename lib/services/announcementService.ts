import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { Announcement, CreateAnnouncementInput } from "@/types/announcement";

export async function getAnnouncementsByEventId(eventId: string): Promise<Announcement[]> {
    const event = await fetchQuery(api.events.getById, { id: eventId as Id<"events"> });
    const eventName = event?.name || "Event";

    const result = await fetchQuery(api.announcements.listByEvent, {
        eventId: eventId as Id<"events">
    });

    return result.map(d => ({
        id: d._id,
        eventId: d.eventId,
        eventName,
        organizerId: d.organizerId,
        title: d.title,
        message: d.message,
        imageUrl: d.imageUrl,
        sendEmail: d.sendEmail,
        sentCount: d.sentCount,
        createdBy: d.createdBy,
        createdAt: typeof d.createdAt === 'number' ? d.createdAt : new Date(d.createdAt).getTime(),
    })) as Announcement[];
}

export async function createAnnouncement(data: CreateAnnouncementInput & { sentCount?: number }): Promise<Announcement> {
    const id = await fetchMutation(api.announcements.create, {
        eventId: data.eventId as Id<"events">,
        organizerId: data.organizerId as Id<"users">,
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl,
        sendEmail: data.sendEmail,
        createdBy: data.createdBy,
    });

    return {
        id,
        ...data,
        createdAt: Date.now(),
    } as unknown as Announcement;
}

export async function updateAnnouncement(eventId: string, announcementId: string, data: Partial<Announcement>): Promise<void> {
    await fetchMutation(api.announcements.update, {
        id: announcementId as Id<"announcements">,
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl,
    });
}

export async function deleteAnnouncement(eventId: string, announcementId: string): Promise<void> {
    await fetchMutation(api.announcements.remove, {
        id: announcementId as Id<"announcements">
    });
}

export async function getParticipantAnnouncements(userId: string, email?: string): Promise<Announcement[]> {
    // 1. Fetch user's direct registered events from Convex
    const registrations = await fetchQuery(api.registrations.list, {
        userId: userId as Id<"users">,
        status: "paid",
        paginationOpts: { numItems: 50, cursor: null }
    });

    const eventIds = [...new Set(registrations.page.map((r: any) => r.eventId as string))] as string[];

    if (eventIds.length === 0) {
        return [];
    }

    const allAnnouncements: Announcement[] = [];

    await Promise.all(
        eventIds.map(async (eventId: string) => {
            const announcements = await getAnnouncementsByEventId(eventId);
            allAnnouncements.push(...announcements);
        })
    );

    // Sort by createdAt descending
    allAnnouncements.sort((a, b) => {
        const dateA = new Date(a.createdAt as any).getTime();
        const dateB = new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });

    return allAnnouncements;
}
