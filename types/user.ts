import { Timestamp } from "firebase/firestore";

export type UserRole = "runner" | "organizer" | "admin";

export type OrganizerType =
    | "individual"        // Solo race director
    | "sports_club"       // Running club, triathlon club, etc.
    | "business"          // Registered business (e.g. events company)
    | "lgu"               // Local Government Unit (city/municipality)
    | "school"            // School or university
    | "nonprofit";        // NGO, foundation, charity

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
        organizerType: OrganizerType;
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

    // === Step 1: Basic Info ===
    organizerName: string;          // Organization or individual name
    organizerType: OrganizerType;   // Type of organization
    description: string;            // Brief description of the org (what they do)

    // === Step 2: Contact Details ===
    contactPerson: string;          // Full name of the contact person
    contactEmail: string;           // Business email
    phone: string;                  // PH mobile (e.g. 09XX XXX XXXX)
    alternatePhone?: string;        // Optional landline or alternate mobile
    website?: string;               // Optional website or social media link

    // === Step 3: Address & Location ===
    address: {
        street: string;
        barangay: string;           // PH-specific: barangay
        city: string;               // City / Municipality
        province: string;           // Province
        region: string;             // Region (e.g. NCR, Region IV-A)
        zipCode: string;
    };

    // === Step 4: Verification Documents ===
    organizerTIN?: string;          // BIR Tax Identification Number
    dtiSecRegistration?: string;    // DTI (sole prop) or SEC (corp) reg number
    governmentId: {
        type: string;               // e.g. "Philippine National ID", "Driver's License", "Passport"
        idNumber: string;
        // File uploads stored as Cloudinary URLs
        frontImageUrl: string;
        backImageUrl?: string;
    };
    businessPermitUrl?: string;     // Scanned business/mayor's permit (optional but encouraged)
    pastEventsDescription?: string; // Free text describing past events organized
    estimatedEventsPerYear?: number;

    // === Meta ===
    status: "pending" | "approved" | "rejected" | "needs_info";
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
    rejectionReason?: string;
    adminNotes?: string;            // Internal admin notes
}
