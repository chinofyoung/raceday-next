import * as z from "zod";

export const registrationSchema = z.object({
    eventId: z.string(),
    categoryId: z.string().min(1, "Please select a category"),
    participantInfo: z.object({
        name: z.string().min(2, "Name is required"),
        email: z.string().email("Invalid email"),
        phone: z.string().min(10, "Invalid phone number"),
        tShirtSize: z.string().min(1, "Required"),
        singletSize: z.string().min(1, "Required"),
        emergencyContact: z.object({
            name: z.string().min(2, "Required"),
            phone: z.string().min(10, "Required"),
            relationship: z.string().min(2, "Required"),
        }),
        medicalConditions: z.string().optional(),
    }),
    vanityNumber: z.string().optional().refine(val => !val || /^[0-9]+$/.test(val), {
        message: "Vanity number must contain only digits",
    }),
    basePrice: z.number(),
    vanityPremium: z.number(),
    totalPrice: z.number(),
    termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and waiver"),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
