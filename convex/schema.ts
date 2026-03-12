import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        uid: v.string(), // Ext auth ID (Clerk/Convex Auth)
        email: v.string(),
        displayName: v.string(),
        photoURL: v.optional(v.string()),
        role: v.union(v.literal("runner"), v.literal("organizer"), v.literal("admin")),
        birthDate: v.optional(v.string()),

        // Profile fields
        phone: v.optional(v.string()),
        gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal(""))),
        address: v.optional(v.object({
            street: v.string(),
            city: v.string(),
            province: v.string(),
            zipCode: v.string(),
            country: v.string(),
        })),
        emergencyContact: v.optional(v.object({
            name: v.string(),
            phone: v.string(),
            relationship: v.string(),
        })),
        medicalConditions: v.optional(v.string()),
        tShirtSize: v.optional(v.union(v.literal("XS"), v.literal("S"), v.literal("M"), v.literal("L"), v.literal("XL"), v.literal("2XL"), v.literal("3XL"), v.literal(""))),
        singletSize: v.optional(v.union(v.literal("XS"), v.literal("S"), v.literal("M"), v.literal("L"), v.literal("XL"), v.literal("2XL"), v.literal("3XL"), v.literal(""))),

        // Organizer fields
        organizer: v.optional(v.object({
            name: v.string(),
            contactEmail: v.string(),
            phone: v.string(),
            organizerType: v.union(v.literal("individual"), v.literal("sports_club"), v.literal("business"), v.literal("lgu"), v.literal("school"), v.literal("nonprofit")),
            approved: v.boolean(),
            appliedAt: v.number(),
            approvedAt: v.optional(v.number()),
        })),

        // Metadata
        profileCompletion: v.number(),
        volunteerEvents: v.optional(v.array(v.id("events"))), // array of eventIds
        expoPushToken: v.optional(v.string()),
        dashboardLayout: v.optional(v.array(v.string())),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_uid", ["uid"]).index("by_email", ["email"]).index("by_role", ["role"]),

    events: defineTable({
        organizerId: v.id("users"),
        organizerName: v.string(),

        // Basic info
        name: v.string(),
        description: v.string(),
        date: v.number(),
        location: v.object({
            name: v.string(),
            address: v.string(),
            coordinates: v.optional(v.object({
                lat: v.number(),
                lng: v.number(),
            })),
        }),

        // Images
        featuredImage: v.string(),
        galleryImages: v.array(v.string()), // Up to 5 URLs

        // Vanity race number config
        vanityRaceNumber: v.object({
            enabled: v.boolean(),
            premiumPrice: v.number(),
            maxDigits: v.number(),
        }),

        // Early Bird
        earlyBird: v.optional(v.object({
            enabled: v.boolean(),
            startDate: v.number(),
            endDate: v.number(),
        })),

        registrationEndDate: v.number(),

        // Timeline
        timeline: v.array(v.object({
            id: v.string(),
            activity: v.string(),
            description: v.optional(v.string()),
            time: v.string(),
            order: v.number(),
        })),

        // Distance categories
        categories: v.array(v.object({
            id: v.string(),
            name: v.string(),
            distance: v.number(),
            distanceUnit: v.union(v.literal("km"), v.literal("mi")),
            assemblyTime: v.string(),
            gunStartTime: v.string(),
            cutOffTime: v.string(),
            price: v.number(),
            earlyBirdPrice: v.optional(v.number()),
            categoryImage: v.optional(v.string()),
            routeMap: v.optional(v.object({
                gpxFileUrl: v.string(),
            })),
            stations: v.optional(v.array(v.object({
                id: v.string(),
                type: v.union(v.literal("water"), v.literal("aid"), v.literal("first_aid")),
                label: v.string(),
                coordinates: v.object({
                    lat: v.number(),
                    lng: v.number(),
                }),
            }))),
            inclusions: v.array(v.string()),
            raceNumberFormat: v.string(),
            maxParticipants: v.optional(v.number()),
            showMaxParticipants: v.boolean(),
            showRegisteredCount: v.boolean(),
            registeredCount: v.number(),
            bibAssignment: v.optional(v.object({
                enabled: v.boolean(),
                rangeStart: v.number(),
                rangeEnd: v.number(),
                currentSequential: v.number(),
            })),
        })),

        status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed")),
        featured: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_organizer", ["organizerId"]).index("by_status", ["status"]),

    registrations: defineTable({
        userId: v.id("users"),
        eventId: v.id("events"),
        organizerId: v.optional(v.id("users")),
        categoryId: v.string(),
        status: v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
        totalPrice: v.number(),
        raceKitClaimed: v.boolean(),
        raceNumber: v.optional(v.string()),

        qrCodeUrl: v.optional(v.string()),
        paymentStatus: v.optional(v.string()),
        xenditInvoiceId: v.optional(v.string()),
        xenditInvoiceUrl: v.optional(v.string()),
        paidAt: v.optional(v.number()),
        raceKitClaimedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
        isProxy: v.optional(v.boolean()),
        registrationData: v.optional(v.object({
            participantInfo: v.optional(v.object({
                firstName: v.optional(v.string()),
                lastName: v.optional(v.string()),
                name: v.optional(v.string()),
                email: v.optional(v.string()),
                phone: v.optional(v.string()),
                gender: v.optional(v.string()),
                birthDate: v.optional(v.string()),
                tShirtSize: v.optional(v.string()),
                singletSize: v.optional(v.string()),
                emergencyContact: v.optional(v.object({
                    name: v.optional(v.string()),
                    phone: v.optional(v.string()),
                    relationship: v.optional(v.string()),
                })),
                medicalConditions: v.optional(v.string()),
            })),
            vanityNumber: v.optional(v.string()),
            vanityPremium: v.optional(v.number()),
            basePrice: v.optional(v.number()),
            totalPrice: v.optional(v.number()),
            eventId: v.optional(v.string()),
            categoryId: v.optional(v.string()),
            registrationType: v.optional(v.string()),
            userId: v.optional(v.string()),
            registeredByUserId: v.optional(v.string()),
            registeredByName: v.optional(v.string()),
            isProxy: v.optional(v.boolean()),
            termsAccepted: v.optional(v.boolean()),
        })),
    })
        .index("by_user", ["userId"])
        .index("by_event", ["eventId"])
        .index("by_user_event", ["userId", "eventId"])
        .index("by_organizer", ["organizerId"])
        .index("by_event_status", ["eventId", "status"])
        .index("by_organizer_status", ["organizerId", "status"]),
    bibCounters: defineTable({
        eventId: v.id("events"),
        categoryId: v.string(),
        count: v.number(),
    }).index("by_event_category", ["eventId", "categoryId"]),
    organizerApplications: defineTable({
        userId: v.id("users"),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
        createdAt: v.number(),
        updatedAt: v.number(),
        data: v.any(),
    }).index("by_status", ["status"]).index("by_user", ["userId"]),
    auditLogs: defineTable({
        adminId: v.string(), // Convex ID
        adminName: v.string(),
        action: v.string(),
        targetId: v.string(),
        targetName: v.string(),
        details: v.optional(v.string()),
        timestamp: v.number(),
    }).index("by_timestamp", ["timestamp"]),
    volunteers: defineTable({
        eventId: v.id("events"),
        userId: v.optional(v.id("users")),

        email: v.string(),
        displayName: v.optional(v.string()),
        photoURL: v.optional(v.string()),
        permissions: v.array(v.string()),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
        invitedBy: v.string(),
        invitedAt: v.number(),
        acceptedAt: v.optional(v.number()),
        revokedAt: v.optional(v.number()),
    }).index("by_event", ["eventId"]).index("by_email", ["email"]).index("by_user", ["userId"]).index("by_event_user", ["eventId", "userId"]).index("by_email_event", ["email", "eventId"]),
    announcements: defineTable({
        eventId: v.id("events"),
        organizerId: v.id("users"),
        title: v.string(),
        message: v.string(),
        imageUrl: v.optional(v.string()),
        sendEmail: v.boolean(),
        sentCount: v.number(),
        createdBy: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_event", ["eventId"]),
});
