import { z } from "zod";

export const profileSchema = z.object({
    displayName: z.string().min(2, "Name is too short"),
    phone: z.string().min(10, "Phone number is too short").or(z.literal("")),
    medicalConditions: z.string().optional(),
    tShirtSize: z.enum(["", "XS", "S", "M", "L", "XL", "2XL", "3XL"]),
    singletSize: z.enum(["", "XS", "S", "M", "L", "XL", "2XL", "3XL"]),
    address: z.object({
        street: z.string().min(1, "Required").or(z.literal("")),
        city: z.string().min(1, "Required").or(z.literal("")),
        province: z.string().min(1, "Required").or(z.literal("")),
        zipCode: z.string().min(1, "Required").or(z.literal("")),
        country: z.string().min(1, "Required").or(z.literal("")),
    }),
    emergencyContact: z.object({
        name: z.string().min(1, "Required").or(z.literal("")),
        phone: z.string().min(10, "Phone number is too short").or(z.literal("")),
        relationship: z.string().min(1, "Required").or(z.literal("")),
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const calculateCompletion = (data: ProfileFormValues): number => {
    const fields = [
        !!data.displayName,
        !!data.phone,
        !!data.address.street,
        !!data.address.city,
        !!data.address.province,
        !!data.address.zipCode,
        !!data.emergencyContact.name,
        !!data.emergencyContact.phone,
        !!data.emergencyContact.relationship,
        !!data.tShirtSize,
        !!data.singletSize,
    ];

    const filledCount = fields.filter(Boolean).length;
    // Let's add email which is always there
    const totalFields = fields.length + 1;
    return Math.round(((filledCount + 1) / totalFields) * 100);
};
