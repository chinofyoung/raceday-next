import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type AdminActionType =
    | "approve_organizer"
    | "reject_organizer"
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
        await addDoc(collection(db, "auditLogs"), {
            adminId: adminId || "unknown",
            adminName: adminName || "Unknown Admin",
            action: action || "unknown_action",
            targetId: targetId || "unknown",
            targetName: targetName || "Unknown Target",
            details: details || "",
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging admin action:", error);
    }
}
