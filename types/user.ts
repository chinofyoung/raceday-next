import { Timestamp } from "firebase/firestore";

export type UserRole = "runner" | "organizer" | "admin";

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: UserRole;

    // Profile fields
    phone: string;
    address: {
        street: string;
        city: string;
        province: string;
        zipCode: string;
        country: string;
    };
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalConditions: string;
    tShirtSize: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "";
    singletSize: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "";

    // Organizer fields (populated if role is organizer or application pending)
    organizer?: {
        name: string;
        contactEmail: string;
        phone: string;
        approved: boolean;
        appliedAt: Timestamp;
        approvedAt?: Timestamp;
    };

    // Metadata
    profileCompletion: number; // 0–100
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface OrganizerApplication {
    id: string;
    userId: string;
    organizerName: string;
    contactEmail: string;
    phone: string;
    status: "pending" | "approved" | "rejected";
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string; // admin UID
    rejectionReason?: string;
}
