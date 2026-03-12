import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export type AdminActionType =
    | "approve_organizer"
    | "reject_organizer"
    | "request_info_organizer"
    | "change_user_role"
    | "feature_event"
    | "unfeature_event"
    | "cancel_event"
    | "delete_event"
    | "ban_user";

export async function logAdminAction(
    adminId: string,
    adminName: string,
    action: AdminActionType,
    targetId: string,
    targetName: string,
    details?: string
) {
    try {
        await fetchMutation(api.audit.log, {
            adminId: adminId || "unknown",
            adminName: adminName || "Unknown Admin",
            action: action || "unknown_action",
            targetId: targetId || "unknown",
            targetName: targetName || "Unknown Target",
            details: details || "",
            serverSecret: process.env.CONVEX_ADMIN_SECRET || "",
        });
    } catch (error) {
        console.error("Error logging admin action:", error);
    }
}
