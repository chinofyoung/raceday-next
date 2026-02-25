# Volunteer Invitation System — Implementation Plan

## Overview

Enable event organizers to invite volunteers by Gmail address. Volunteers gain access to **race kit claiming (kiosk mode)** and **participant management** for the specific events they're assigned to — without needing to apply as organizers.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data storage | Firestore subcollection `events/{eventId}/volunteers` | Scoped per-event, easy security rules, real-time capable |
| Auth approach | Existing Firebase Auth (Google sign-in) | Volunteers already need a Google/Gmail account; no new auth flow needed |
| Role model | Per-event role, not global role | A user can be a volunteer for Event A and a runner for Event B |
| Invitation flow | Email-based invite → accept on sign-in | Simple, no custom email verification needed |
| Access control | Middleware + server-side checks | Secure, follows existing patterns |

---

## Data Model

### New: `events/{eventId}/volunteers` (Firestore Subcollection)

```typescript
// types/volunteer.ts
export type VolunteerStatus = 'pending' | 'accepted' | 'revoked';

export type VolunteerPermission = 'kiosk' | 'participants' | 'announcements';

export interface EventVolunteer {
  id: string;                          // Auto-generated doc ID
  eventId: string;                     // Parent event reference
  email: string;                       // Gmail address (normalized lowercase)
  displayName?: string;                // Populated after acceptance
  photoURL?: string;                   // Populated after acceptance
  uid?: string;                        // Firebase UID (set on acceptance)
  permissions: VolunteerPermission[];  // Granular access control
  status: VolunteerStatus;             // Invitation lifecycle
  invitedBy: string;                   // Organizer UID who invited
  invitedAt: Timestamp;                // When invitation was created
  acceptedAt?: Timestamp;              // When volunteer accepted
  revokedAt?: Timestamp;               // When access was revoked
}
```

### Updated: `users` collection (minor addition)

```typescript
// Add to existing UserProfile type
volunteerEvents?: string[];  // Array of eventIds where user is a volunteer
```

---

## Implementation Steps

### Phase 1: Type Definitions & Data Layer

#### 1.1 Create Volunteer Types
- **File:** `types/volunteer.ts` (new)
- Define `EventVolunteer`, `VolunteerStatus`, `VolunteerPermission` types
- Define `VolunteerInviteFormData` for the invitation form

#### 1.2 Create Volunteer Service
- **File:** `lib/services/volunteerService.ts` (new)
- Functions:
  - `inviteVolunteer(eventId, email, permissions, invitedBy)` — Create pending invite
  - `getEventVolunteers(eventId)` — List all volunteers for an event
  - `getVolunteerByEmail(eventId, email)` — Check if already invited
  - `acceptInvitation(eventId, volunteerId, uid)` — Mark accepted, set UID
  - `revokeVolunteer(eventId, volunteerId)` — Revoke access
  - `updatePermissions(eventId, volunteerId, permissions)` — Update access
  - `getVolunteerEventsByEmail(email)` — Get all events a user is volunteering for
  - `getVolunteerEventsByUid(uid)` — Get accepted events by UID
- Use `Promise.all()` for independent Firestore reads (per `async-parallel` rule)

#### 1.3 Validation Schema
- **File:** `lib/validations/volunteer.ts` (new)
- Zod schema for invite form: email (Gmail validation), permissions array
- Schema for permission updates

---

### Phase 2: API Routes

#### 2.1 Volunteer CRUD Endpoints
- **File:** `app/api/events/[id]/volunteers/route.ts` (new)
  - `GET` — List volunteers for event (organizer + admin only)
  - `POST` — Invite a volunteer (organizer + admin only)
    - Validate email format
    - Check for duplicate invites
    - Create pending volunteer doc
    - Send invitation email via Resend

#### 2.2 Individual Volunteer Management
- **File:** `app/api/events/[id]/volunteers/[volunteerId]/route.ts` (new)
  - `PATCH` — Update permissions or status
  - `DELETE` — Revoke/remove volunteer

#### 2.3 Volunteer Acceptance
- **File:** `app/api/volunteers/accept/route.ts` (new)
  - `POST` — Accept invitation (authenticated volunteer)
  - Matches logged-in user email to pending invites
  - Updates volunteer doc with UID, sets status to 'accepted'
  - Adds eventId to user's `volunteerEvents` array

#### 2.4 My Volunteer Events
- **File:** `app/api/volunteers/my-events/route.ts` (new)
  - `GET` — Get all events where current user is an active volunteer
  - Used by volunteer dashboard

**Best Practice Notes:**
- Authenticate all API routes with session verification (per `server-auth-actions`)
- Use `Promise.all()` for parallel Firestore operations (per `async-parallel`)
- Return minimal data to client (per `server-serialization`)

---

### Phase 3: Email Notification

#### 3.1 Volunteer Invitation Email
- **File:** Update `lib/services/emailService.ts`
- Add `sendVolunteerInvitation(email, eventName, organizerName, acceptUrl)` method
- Email content:
  - Event name & date
  - Organizer name
  - CTA button: "Accept Invitation" → links to `/volunteer/accept?eventId=xxx`
  - Permissions granted summary

---

### Phase 4: Organizer UI — Volunteer Management

#### 4.1 Volunteer Management Tab
- **File:** `components/dashboard/organizer/VolunteerManagement.tsx` (new)
- Features:
  - Invite form (email input + permission checkboxes)
  - Volunteer list table:
    - Email, name (if accepted), status badge, permissions
    - Actions: Edit permissions, Revoke access
  - Empty state for no volunteers
  - Loading states with Suspense boundaries

#### 4.2 Invite Volunteer Dialog
- **File:** `components/dashboard/organizer/InviteVolunteerDialog.tsx` (new)
- Modal with:
  - Email input (validated as Gmail)
  - Permission checkboxes:
    - ☑ Race Kit Claiming (Kiosk Mode)
    - ☑ View & Manage Participants
    - ☐ Send Announcements (optional future)
  - Invite button
  - Success/error feedback

#### 4.3 Integration into Event Dashboard
- **File:** Update existing organizer event detail page
- Add "Volunteers" tab alongside existing tabs (Registrations, Announcements, etc.)
- Show volunteer count badge on tab

**Best Practice Notes:**
- Use `next/dynamic` for VolunteerManagement to reduce initial bundle (per `bundle-dynamic-imports`)
- Extract static JSX elements outside component bodies (per `rendering-hoist-jsx`)
- Use ternary operators for conditional renders (per `rendering-conditional-render`)

---

### Phase 5: Volunteer UI — Dashboard & Access

#### 5.1 Volunteer Dashboard Section
- **File:** `components/dashboard/volunteer/VolunteerDashboard.tsx` (new)
- Shows events where user is an active volunteer
- Event cards with:
  - Event name, date, image
  - Permission badges
  - Quick action buttons (Go to Kiosk, View Participants)

#### 5.2 Volunteer Acceptance Flow
- **File:** `app/(app)/volunteer/accept/page.tsx` (new)
- When volunteer clicks email link:
  1. If not logged in → redirect to auth with return URL
  2. If logged in → show invitation details with "Accept" button
  3. On accept → call accept API, redirect to volunteer dashboard
  4. If email mismatch → show error message

#### 5.3 Volunteer Event View
- **File:** `app/(app)/volunteer/events/[eventId]/page.tsx` (new)
- Restricted view of event based on permissions:
  - **Kiosk permission:** Access to kiosk mode (race kit claiming)
  - **Participants permission:** View participant list, search, filter
- Reuse existing components:
  - `KioskMode` component (already exists)
  - Participant list components (already exist)
- Add permission checks before rendering each section

#### 5.4 Navigation Updates
- **File:** Update sidebar/nav components
- Show "Volunteer" section in dashboard if user has active volunteer events
- Volunteer navigation items:
  - My Volunteer Events
  - Per-event: Kiosk Mode, Participants

**Best Practice Notes:**
- Load kiosk/participant components with `next/dynamic` since they're heavy (per `bundle-dynamic-imports`)
- Use Suspense boundaries for streaming volunteer data (per `async-suspense-boundaries`)

---

### Phase 6: Access Control & Security

#### 6.1 Volunteer Access Utility
- **File:** `lib/volunteerAccess.ts` (new)
- Helper functions:
  - `isEventVolunteer(uid, eventId)` — Check if user is active volunteer
  - `hasVolunteerPermission(uid, eventId, permission)` — Check specific permission
  - `getVolunteerPermissions(uid, eventId)` — Get all permissions
- Use `React.cache()` for per-request deduplication (per `server-cache-react`)

#### 6.2 Middleware Updates
- **File:** Update `middleware.ts`
- Add volunteer route protection:
  - `/volunteer/*` routes require authentication
  - Volunteer-specific pages check volunteer status server-side

#### 6.3 Kiosk Mode Access Update
- **File:** Update existing kiosk mode component/page
- Allow access if user is:
  - Event organizer (existing), OR
  - Active volunteer with `kiosk` permission (new)

#### 6.4 Participant Management Access Update
- **File:** Update existing participant management views
- Allow access if user is:
  - Event organizer (existing), OR
  - Active volunteer with `participants` permission (new)

---

### Phase 7: Auto-Detection on Sign-In

#### 7.1 Post-Login Volunteer Check
- **File:** Update auth flow / session creation
- After successful Google sign-in:
  1. Query all pending volunteer invites matching user's email
  2. If found, show notification banner: "You have X pending volunteer invitations"
  3. Link to acceptance page
- This ensures volunteers who sign up independently still see their invites

---

## File Summary

### New Files (12)
| File | Purpose |
|------|---------|
| `types/volunteer.ts` | Type definitions |
| `lib/services/volunteerService.ts` | Firestore CRUD operations |
| `lib/validations/volunteer.ts` | Zod validation schemas |
| `lib/volunteerAccess.ts` | Permission checking utilities |
| `app/api/events/[id]/volunteers/route.ts` | List & invite API |
| `app/api/events/[id]/volunteers/[volunteerId]/route.ts` | Manage individual volunteer |
| `app/api/volunteers/accept/route.ts` | Accept invitation API |
| `app/api/volunteers/my-events/route.ts` | Get volunteer's events |
| `components/dashboard/organizer/VolunteerManagement.tsx` | Organizer volunteer tab |
| `components/dashboard/organizer/InviteVolunteerDialog.tsx` | Invite modal |
| `components/dashboard/volunteer/VolunteerDashboard.tsx` | Volunteer dashboard |
| `app/(app)/volunteer/accept/page.tsx` | Acceptance page |

### Modified Files (5-7)
| File | Change |
|------|--------|
| `types/user.ts` | Add `volunteerEvents` field |
| `lib/services/emailService.ts` | Add invitation email template |
| `middleware.ts` | Add volunteer route protection |
| Organizer event detail page | Add Volunteers tab |
| Dashboard sidebar/nav | Add volunteer navigation |
| Kiosk mode page | Add volunteer access check |
| Participant management page | Add volunteer access check |

---

## UI Flow Diagrams

### Organizer Inviting a Volunteer
```
Organizer Dashboard → Event Detail → Volunteers Tab
  → Click "Invite Volunteer"
  → Enter Gmail + Select Permissions
  → Send Invitation
  → Volunteer appears in list as "Pending"
  → Email sent to volunteer
```

### Volunteer Accepting & Using
```
Volunteer receives email → Clicks "Accept Invitation"
  → Signs in with Google (if not already)
  → Sees invitation details → Clicks "Accept"
  → Redirected to Volunteer Dashboard
  → Sees assigned event(s)
  → Can access Kiosk Mode / Participant Management
```

### Existing User Gets Invited
```
User logs in → System checks for pending invites
  → Banner: "You have pending volunteer invitations"
  → Click to review → Accept/Decline
  → Volunteer features appear in dashboard
```

---

## Performance Considerations (Vercel Best Practices)

1. **Parallel data fetching** (`async-parallel`): Use `Promise.all()` when fetching volunteer data alongside event data
2. **Dynamic imports** (`bundle-dynamic-imports`): Lazy-load VolunteerManagement, KioskMode, and ParticipantList components
3. **Suspense boundaries** (`async-suspense-boundaries`): Wrap volunteer data sections in Suspense for streaming
4. **Minimal serialization** (`server-serialization`): Only pass necessary volunteer fields to client components
5. **Server-side auth** (`server-auth-actions`): All volunteer API routes verify session before processing
6. **Request dedup** (`server-cache-react`): Use `React.cache()` for volunteer permission checks that may be called multiple times per request
7. **Conditional rendering** (`rendering-conditional-render`): Use ternary for permission-based UI sections

---

## Implementation Order

| Order | Phase | Estimated Complexity |
|-------|-------|---------------------|
| 1 | Phase 1: Types & Data Layer | Low |
| 2 | Phase 2: API Routes | Medium |
| 3 | Phase 3: Email Notification | Low |
| 4 | Phase 4: Organizer UI | Medium |
| 5 | Phase 6: Access Control | Medium |
| 6 | Phase 5: Volunteer UI | Medium |
| 7 | Phase 7: Auto-Detection | Low |

> Phase 6 is done before Phase 5 intentionally — access control should be in place before volunteer-facing pages are built.
