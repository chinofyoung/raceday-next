# Key Concepts — RaceDay Next

Philippine race event management platform. These concepts map directly to the Convex schema in `convex/schema.ts`.

---

## Roles

Every user has a single `role` field on the `users` table.

| Role | Description |
|------|-------------|
| `runner` | Default role on signup. Can browse events and register. |
| `organizer` | Approved by an admin. Can create and manage events, invite volunteers, post announcements. |
| `admin` | Platform-level access. Reviews organizer applications, manages all users and events. |
| `volunteer` | Not a `role` value — volunteer access is event-scoped via the `volunteers` table and a `volunteerEvents` array on the user record. |

---

## Event Lifecycle

```
draft → published → completed
                 ↘ cancelled
```

- **draft**: Visible only to the organizer. Not listed publicly.
- **published**: Visible on the events listing. Registration is open until `registrationEndDate`.
- **completed**: Past event. Registration closed.
- **cancelled**: Organizer or admin cancelled the event.

Status is stored as `events.status`. Organizers control the transition from `draft` to `published`. Admins can cancel any event.

---

## Registration Lifecycle

```
pending → paid → (optionally) cancelled
       ↘ cancelled
```

- **pending**: Registration submitted; payment invoice created via Xendit but not yet paid.
- **paid**: Payment confirmed via Xendit webhook. Race kit claiming becomes possible.
- **cancelled**: Runner or organizer cancelled the registration.

### Race Kit Claiming

Tracked on `registrations.raceKitClaimed` (boolean) and `registrations.raceKitClaimedAt` (timestamp).

- Starts as `false` (unclaimed).
- Flips to `true` when organizer or volunteer scans the runner's QR code at kiosk/scanner.
- Only `paid` registrations can be claimed.

### Payment Integration

Xendit handles checkout. Relevant fields: `xenditInvoiceId`, `xenditInvoiceUrl`, `paidAt`. The webhook at `app/api/payments/webhook/route.ts` updates registration status on payment confirmation.

---

## Organizer Application Flow

1. Runner navigates to **Become an Organizer** (`/dashboard/become-organizer`).
2. Fills a multi-step form (org info → contact → address → verification).
3. Submission creates a record in `organizerApplications` with `status: "pending"`.
4. Admin reviews the application at `/dashboard/admin/applications`.
5. Admin approves or rejects:
   - **Approved**: `organizerApplications.status` → `"approved"`, user `role` → `"organizer"`, `users.organizer` object populated with `approved: true` and `approvedAt` timestamp.
   - **Rejected**: `organizerApplications.status` → `"rejected"`. User role remains `"runner"`.
6. All admin decisions are written to `auditLogs`.

Organizer types: `individual`, `sports_club`, `business`, `lgu`, `school`, `nonprofit`.

---

## Volunteer System

Volunteers are event-scoped, not platform-scoped.

1. Organizer invites a person by email via `InviteVolunteerDialog` (`components/dashboard/organizer/InviteVolunteerDialog.tsx`).
2. A `volunteers` record is created with `status: "pending"` and a `permissions` array (e.g., `["scan_qr", "view_registrations"]`).
3. Invitee receives an email with an acceptance link (`/volunteer/accept`).
4. On acceptance: `volunteers.status` → `"accepted"`, `volunteers.acceptedAt` set, and the event ID is added to `users.volunteerEvents` if the user has an account.
5. Organizer can revoke access at any time: `status` → `"revoked"`, `revokedAt` set.

Access control for volunteer-specific pages is checked via `lib/volunteerAccess.ts`.

---

## Categories

Each event has a `categories` array. Every runner registers into exactly one category.

Key category fields:

| Field | Purpose |
|-------|---------|
| `name` | Display label (e.g., "21K Finisher") |
| `distance` + `distanceUnit` | Race distance in km or mi |
| `price` | Standard registration price |
| `earlyBirdPrice` | Discounted price when early bird is active |
| `maxParticipants` | Optional slot cap |
| `registeredCount` | Live count of paid registrations |
| `bibAssignment` | Bib number range config (`rangeStart`, `rangeEnd`, `currentSequential`) |
| `inclusions` | List of items in the registration package |
| `assemblyTime` / `gunStartTime` / `cutOffTime` | Race timing per category |
| `stations` | Water, aid, and first-aid station coordinates |
| `routeMap` | Optional GPX file URL for the category route |

---

## Vanity Race Numbers

A premium feature allowing runners to pick their own bib number instead of receiving a sequential one.

Configured at the event level:

```
events.vanityRaceNumber: {
  enabled: boolean,
  premiumPrice: number,   // extra fee on top of category price
  maxDigits: number,      // max digits the chosen number can have
}
```

During registration (Step 3 — `components/forms/registration/Step3Vanity.tsx`), if enabled, the runner can enter a preferred bib number. Availability is checked via `app/api/registrations/check-vanity/route.ts`. The chosen number is stored in `registrationData.vanityNumber` and the extra charge in `registrationData.vanityPremium`.

---

## Early Bird Pricing

Time-based discount configured at two levels:

1. **Event level** — `events.earlyBird`: defines the active window (`startDate`, `endDate`).
2. **Category level** — `categories[n].earlyBirdPrice`: the discounted price for that category.

When the current date falls inside the event's early bird window, `earlyBirdPrice` applies instead of `price`. Logic lives in `lib/earlyBirdUtils.ts`.

---

## QR Code Check-In

Flow:

1. After a registration is paid, a QR code is generated (via `lib/qr.ts`) encoding the registration ID.
2. The QR URL is stored in `registrations.qrCodeUrl`.
3. Runners can view their QR at `/dashboard/events/[id]/qr`.
4. At race day, organizers or volunteers open the **Kiosk** (`/dashboard/organizer/events/[id]/kiosk`) or **Scanner** (`/dashboard/organizer/events/[id]/scanner`).
5. Scanning resolves the registration, verifies `status === "paid"`, and sets `raceKitClaimed: true` + `raceKitClaimedAt` timestamp.

The camera/scan UI is `components/shared/QRScannerWrapper.tsx`.

---

## Announcements

Organizers post announcements scoped to a specific event.

- Stored in the `announcements` table with `eventId` and `organizerId`.
- `sendEmail: boolean` — if true, an email is sent to all paid registrants of that event. `sentCount` records how many emails were dispatched.
- **AI drafting**: The announcement assistant at `app/api/ai/announcement-assistant/route.ts` can draft message copy given a prompt. Logic sits in `lib/services/aiService.ts`.
- Runners see announcements on the event detail page (`components/event/EventAnnouncements.tsx`) and in their runner dashboard (`components/dashboard/RunnerAnnouncements.tsx`).

---

## Audit Logs

Every significant admin action (approving organizers, cancelling events, managing users) writes a record to `auditLogs`.

Fields: `adminId`, `adminName`, `action`, `targetId`, `targetName`, `details`, `timestamp`.

Viewable by admins at `/dashboard/admin/logs`. Utility helpers live in `lib/admin/audit.ts`.
