import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { OrganizerApplication } from "@/types/user";
import { OrganizerFormValues } from "@/lib/validations/organizer";

export interface GetApplicationsOptions {
    status?: "all" | "pending" | "approved" | "rejected" | "needs_info";
    limitCount?: number;
    cursor?: string | null;
}

export async function getOrganizerApplications(options: GetApplicationsOptions = {}) {
    const { status = "pending", limitCount = 20, cursor = null } = options;

    try {
        const result = await fetchQuery(api.applications.list, {
            status,
            paginationOpts: {
                numItems: limitCount,
                cursor,
            },
        });

        return {
            items: result.page.map((d: any) => ({
                id: d._id,
                ...d,
                ...d.data,
                createdAt: d.createdAt
            })) as unknown as OrganizerApplication[],
            lastDoc: result.continueCursor || null
        };
    } catch (error) {
        console.error("Error fetching applications:", error);
        throw error;
    }
}

export async function submitOrganizerApplication(
    userId: string,
    data: OrganizerFormValues
): Promise<string> {
    return fetchMutation(api.applications.submit, {
        userId: userId as Id<"users">,
        data,
    });
}

export async function updateOrganizerApplication(
    applicationId: string,
    userId: string,
    data: OrganizerFormValues
): Promise<void> {
    await fetchMutation(api.applications.update, {
        id: applicationId as Id<"organizerApplications">,
        userId: userId as Id<"users">,
        data,
    });
}

export async function checkExistingApplication(userId: string): Promise<OrganizerApplication | null> {
    try {
        const app = await fetchQuery(api.applications.getByUserId, {
            userId: userId as Id<"users">
        });
        if (!app) return null;
        return { id: app._id, ...app, ...app.data } as unknown as OrganizerApplication;
    } catch (error) {
        console.error("Error checking existing application:", error);
        return null;
    }
}

export async function reviewApplication(
    id: string,
    status: "approved" | "rejected" | "needs_info",
    options: { reason?: string; adminNotes?: string } = {}
) {
    if (status === "needs_info") {
        // Needs info logic not fully implemented in Convex yet, fallback to rejected or handled specifically
        console.warn("needs_info status mapped to rejected for now");
    }

    return fetchMutation(api.applications.review, {
        id: id as Id<"organizerApplications">,
        status: status === "approved" ? "approved" : "rejected",
        reason: options.reason,
    });
}
