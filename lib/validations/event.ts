import * as z from "zod";

export const timelineItemSchema = z.object({
    id: z.string(),
    activity: z.string().min(3, "Activity name is too short"),
    description: z.string().optional(),
    time: z.string().min(2, "Time is required"),
    order: z.number(),
});

export const eventCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(3, "Category name is too short"),
    distance: z.string().min(1, "Distance is required"),
    assemblyTime: z.string().min(1, "Assembly time is required"),
    gunStartTime: z.string().min(1, "Gun start time is required"),
    cutOffTime: z.string().min(1, "Cut off time is required"),
    price: z.number().min(0, "Price cannot be negative"),
    categoryImage: z.string().optional(),
    routeMap: z.object({
        gpxFileUrl: z.string(),
    }).optional(),
    inclusions: z.array(z.string()).min(1, "Add at least one inclusion"),
    raceNumberFormat: z.string().min(1, "Format is required"),
    maxParticipants: z.number().optional(),
    registeredCount: z.number().default(0),
});

export const eventSchema = z.object({
    name: z.string().min(5, "Event name is too short"),
    description: z.string().min(20, "Description is too short"),
    date: z.date({
        message: "Event date is required",
    }),
    location: z.object({
        name: z.string().min(3, "Location name is required"),
        address: z.string().min(5, "Full address is required"),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }).optional(),
    }),
    featuredImage: z.string().min(1, "Featured image is required"),
    galleryImages: z.array(z.string()).max(5, "Maximum 5 gallery images"),
    vanityRaceNumber: z.object({
        enabled: z.boolean().default(false),
        premiumPrice: z.number().min(0).default(0),
    }),
    timeline: z.array(timelineItemSchema),
    categories: z.array(eventCategorySchema).min(1, "Add at least one distance category"),
    status: z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
    featured: z.boolean().default(false),
});

export type EventFormValues = z.infer<typeof eventSchema>;
