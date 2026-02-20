import * as z from "zod";

const phPhoneRegex = /^(09|\+639)\d{9}$/;

export const organizerStep1Schema = z.object({
    organizerName: z.string().min(3, "Organization name must be at least 3 characters"),
    organizerType: z.enum(["individual", "sports_club", "business", "lgu", "school", "nonprofit"], {
        error: "Please select your organization type"
    } as any),
    description: z.string().min(20, "Please provide at least a brief description (20 characters)")
        .max(500, "Description is too long (max 500 characters)"),
});

export const organizerStep2Schema = z.object({
    contactPerson: z.string().min(3, "Contact person name is required"),
    contactEmail: z.string().email("Please enter a valid email address"),
    phone: z.string().regex(phPhoneRegex, "Please enter a valid PH mobile number (e.g. 09171234567)"),
    alternatePhone: z.string().optional().or(z.literal("")),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export const organizerStep3Schema = z.object({
    address: z.object({
        street: z.string().min(3, "Street address is required"),
        barangay: z.string().min(2, "Barangay is required"),
        city: z.string().min(2, "City / Municipality is required"),
        province: z.string().min(2, "Province is required"),
        region: z.string().min(2, "Region is required"),
        zipCode: z.string().length(4, "Philippine ZIP codes are 4 digits"),
    }),
});

export const organizerStep4Schema = z.object({
    organizerTIN: z.string()
        .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, "TIN format: XXX-XXX-XXX-XXX")
        .optional()
        .or(z.literal("")),
    dtiSecRegistration: z.string().optional().or(z.literal("")),
    governmentId: z.object({
        type: z.string().min(1, "Please select an ID type"),
        idNumber: z.string().min(3, "ID number is required"),
        frontImageUrl: z.string().url("Please upload the front of your ID"),
        backImageUrl: z.string().url().optional().or(z.literal("")),
    }),
    businessPermitUrl: z.string().url().optional().or(z.literal("")),
    pastEventsDescription: z.string().max(1000).optional().or(z.literal("")),
    estimatedEventsPerYear: z.coerce.number().min(1).max(100).optional(),
});

export const fullOrganizerSchema = organizerStep1Schema
    .merge(organizerStep2Schema)
    .merge(organizerStep3Schema)
    .merge(organizerStep4Schema);

export type OrganizerFormValues = z.infer<typeof fullOrganizerSchema>;
