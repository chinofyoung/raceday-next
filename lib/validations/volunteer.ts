import * as z from "zod";

export const volunteerInviteSchema = z.object({
    email: z.string()
        .email("Invalid email address")
        .trim()
        .toLowerCase()
        .refine((email) => email.endsWith("@gmail.com"), {
            message: "Volunteers must use a Gmail address (@gmail.com)",
        }),
    permissions: z.array(z.enum(["kiosk", "participants", "announcements"]))
        .min(1, "Select at least one permission"),
});

export const volunteerPermissionUpdateSchema = z.object({
    permissions: z.array(z.enum(["kiosk", "participants", "announcements"]))
        .min(1, "Select at least one permission"),
});

export type VolunteerInviteFormValues = z.infer<typeof volunteerInviteSchema>;
export type VolunteerPermissionUpdateValues = z.infer<typeof volunteerPermissionUpdateSchema>;
