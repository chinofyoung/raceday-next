import { Timestamp } from "firebase/firestore";

export interface Announcement {
    id: string;
    eventId: string;
    eventName?: string;
    organizerId: string;
    title: string;
    message: string;         // Support for rich text or multiline text
    imageUrl?: string;
    sendEmail: boolean;
    sentCount?: number;      // Number of emails sent if sendEmail was true
    createdAt: Timestamp | Date;
    createdBy: string;       // User ID of the organizer who created it
}

export type CreateAnnouncementInput = Omit<Announcement, "id" | "createdAt" | "sentCount">;
