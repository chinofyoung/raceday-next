import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { EventVolunteer, VolunteerPermission, VolunteerStatus } from "@/types/volunteer";

export async function inviteVolunteer(
    eventId: string,
    email: string,
    permissions: VolunteerPermission[],
    invitedBy: string
): Promise<EventVolunteer> {
    const id = await fetchMutation(api.volunteers.invite, {
        eventId: eventId as Id<"events">,
        email,
        permissions: permissions as string[],
        invitedBy,
    });

    return {
        id,
        eventId,
        email,
        permissions,
        status: "pending",
        invitedBy,
        invitedAt: Date.now(),
    } as unknown as EventVolunteer;
}

export async function getEventVolunteers(eventId: string): Promise<EventVolunteer[]> {
    const volunteers = await fetchQuery(api.volunteers.listByEvent, {
        eventId: eventId as Id<"events">
    });
    return volunteers.map((v: any) => ({ ...v, id: v._id })) as unknown as EventVolunteer[];
}

export async function getVolunteerByEmail(eventId: string, email: string): Promise<EventVolunteer | null> {
    const volunteer = await fetchQuery(api.volunteers.getByEmail, {
        eventId: eventId as Id<"events">,
        email
    });
    if (!volunteer) return null;
    return { ...volunteer, id: volunteer._id } as unknown as EventVolunteer;
}

export async function acceptInvitation(
    eventId: string,
    volunteerId: string,
    userId: string, // Changed from uid to userId
    displayName?: string,
    photoURL?: string
): Promise<void> {
    await fetchMutation(api.volunteers.accept, {
        id: volunteerId as Id<"volunteers">,
        userId: userId as Id<"users">,
    });
}

export async function revokeVolunteer(eventId: string, volunteerId: string): Promise<void> {
    await fetchMutation(api.volunteers.revoke, {
        id: volunteerId as Id<"volunteers">
    });
}

export async function getVolunteerEventsByEmail(email: string): Promise<EventVolunteer[]> {
    const result = await fetchQuery(api.volunteers.getPendingByEmail, { email });
    return result.map((v: any) => ({ ...v, id: v._id })) as unknown as EventVolunteer[];
}

export async function getVolunteerEventsByUid(userId: string): Promise<EventVolunteer[]> {
    const result = await fetchQuery(api.volunteers.listByUser, {
        userId: userId as Id<"users">
    });
    return result.map((v: any) => ({ ...v, id: v._id })) as unknown as EventVolunteer[];
}
