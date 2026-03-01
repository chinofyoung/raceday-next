export type VolunteerStatus = 'pending' | 'accepted' | 'revoked';

export type VolunteerPermission = 'kiosk' | 'participants' | 'announcements';


export interface EventVolunteer {
    id: string;                          // Auto-generated doc ID
    eventId: string;                     // Parent event reference
    email: string;                       // Gmail address (normalized lowercase)
    displayName?: string;                // Populated after acceptance
    photoURL?: string;                   // Populated after acceptance
    uid?: string;                        // Clerk user ID (set on acceptance)
    permissions: VolunteerPermission[];  // Granular access control
    status: VolunteerStatus;             // Invitation lifecycle
    invitedBy: string;                   // Organizer UID who invited
    invitedAt: number;            // When invitation was created
    acceptedAt?: number;          // When volunteer accepted
    revokedAt?: number;           // When access was revoked
}

export interface VolunteerInviteFormData {
    email: string;
    permissions: VolunteerPermission[];
}
