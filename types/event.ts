import { Timestamp } from "firebase/firestore";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export interface TimelineItem {
    id: string;
    activity: string;        // e.g. "Race Kit Collection"
    description?: string;
    time: string;            // e.g. "03:00 AM" or "Feb 15, 2026 3:00 AM"
    order: number;
}

export type StationType = "water" | "aid" | "first_aid";

export interface RaceStation {
    id: string;
    type: StationType;
    label: string; // e.g. "KM 5 Water", "First Aid Tent"
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface EventCategory {
    id: string;
    name: string;            // e.g. "42K Full Marathon"
    distance: number;        // e.g. 42
    distanceUnit: "km" | "mi"; // km or mi
    assemblyTime: string;
    gunStartTime: string;
    cutOffTime: string;
    price: number;
    earlyBirdPrice?: number;
    categoryImage?: string;  // Cloudinary URL
    routeMap?: {
        gpxFileUrl: string;    // Uploaded .gpx file
    };
    stations?: RaceStation[];
    inclusions: string[];    // e.g. ["Race bib", "Finisher medal", "T-shirt"]
    raceNumberFormat: string; // e.g. "42K-{number}" or "42{number}"
    maxParticipants?: number;
    showMaxParticipants: boolean;
    showRegisteredCount: boolean;
    registeredCount: number;
    bibAssignment?: {
        enabled: boolean;
        rangeStart: number;
        rangeEnd: number;
        currentSequential: number;
    };
}

export interface RaceEvent {
    id: string;
    organizerId: string;
    organizerName: string;

    // Basic info
    name: string;
    description: string;     // Rich text / markdown
    date: Timestamp | Date;
    location: {
        name: string;           // e.g. "BGC, Taguig"
        address: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };

    // Images
    featuredImage: string;    // Cloudinary URL
    galleryImages: string[];  // Up to 5 Cloudinary URLs

    // Vanity race number config
    vanityRaceNumber: {
        enabled: boolean;
        premiumPrice: number;   // Additional cost
        maxDigits: number;      // e.g. 4
    };

    // Early Bird
    earlyBird?: {
        enabled: boolean;
        startDate: Timestamp | Date;
        endDate: Timestamp | Date;
    };

    // Registration Deadline
    registrationEndDate: Timestamp | Date;

    // Timeline
    timeline: TimelineItem[];

    // Distance categories
    categories: EventCategory[];

    // Status & metadata
    status: EventStatus;
    featured: boolean;
    isLiveTrackingEnabled?: boolean;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}
