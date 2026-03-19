# Convex Data Model Reference

> **Source of truth:** `convex/schema.ts`
> Last updated: 2026-03-19

Convex auto-generates a system `_id` field (`Id<"tableName">`) and `_creationTime` (Unix ms) for every document. These are not listed in the field tables below — they are always present.

All timestamps are Unix milliseconds (`number`).

---

## Tables

### `users`

- **Purpose:** Persisted user profiles for all roles — runners, organizers, and admins — extending the Clerk auth record with app-specific data.

**Fields**

| Field | Type | Description |
|---|---|---|
| `uid` | `string` | External auth ID from Clerk. Used to look up the Convex user from a Clerk session. |
| `email` | `string` | User's email address. |
| `displayName` | `string` | Display name shown in the UI. |
| `photoURL` | `string` (optional) | Profile photo URL (Cloudinary). |
| `role` | `"runner" \| "organizer" \| "admin"` | Platform role controlling access and capabilities. |
| `birthDate` | `string` (optional) | ISO date string (e.g. `"1990-04-15"`). |
| `phone` | `string` (optional) | Mobile phone number. |
| `gender` | `"male" \| "female" \| "other" \| ""` (optional) | Self-reported gender. Empty string denotes unset. |
| `address.street` | `string` (optional) | Street address line. |
| `address.city` | `string` (optional) | City. |
| `address.province` | `string` (optional) | Province. |
| `address.zipCode` | `string` (optional) | Postal/ZIP code. |
| `address.country` | `string` (optional) | Country. |
| `emergencyContact.name` | `string` (optional) | Full name of emergency contact. |
| `emergencyContact.phone` | `string` (optional) | Phone number of emergency contact. |
| `emergencyContact.relationship` | `string` (optional) | Relationship to user (e.g. "Spouse", "Parent"). |
| `medicalConditions` | `string` (optional) | Free-text medical notes shared with race organizers. |
| `tShirtSize` | `"XS" \| "S" \| "M" \| "L" \| "XL" \| "2XL" \| "3XL" \| ""` (optional) | Preferred t-shirt size. |
| `singletSize` | `"XS" \| "S" \| "M" \| "L" \| "XL" \| "2XL" \| "3XL" \| ""` (optional) | Preferred singlet size. |
| `organizer.name` | `string` (optional) | Organization or individual name. Present when role is `"organizer"` or an application is pending. |
| `organizer.contactEmail` | `string` (optional) | Business contact email for the organizer. |
| `organizer.phone` | `string` (optional) | Organizer phone number. |
| `organizer.organizerType` | `"individual" \| "sports_club" \| "business" \| "lgu" \| "school" \| "nonprofit"` (optional) | Category of organizer entity. |
| `organizer.approved` | `boolean` (optional) | Whether the organizer application has been approved by an admin. |
| `organizer.appliedAt` | `number` (optional) | Timestamp when the organizer application was submitted. |
| `organizer.approvedAt` | `number` (optional) | Timestamp when the application was approved. |
| `profileCompletion` | `number` | Integer 0–100 representing profile completeness percentage. |
| `volunteerEvents` | `Id<"events">[]` (optional) | Array of event IDs where this user is a volunteer. Denormalized for fast lookup. |
| `expoPushToken` | `string` (optional) | Expo push notification token for mobile app (if applicable). |
| `dashboardLayout` | `string[]` (optional) | Ordered list of widget/section keys defining the user's dashboard layout. |
| `createdAt` | `number` | Timestamp when the user profile was created. |
| `updatedAt` | `number` | Timestamp of last profile update. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_uid` | `["uid"]` |
| `by_email` | `["email"]` |
| `by_role` | `["role"]` |

**Relationships**

- Referenced by `events.organizerId`
- Referenced by `registrations.userId`, `registrations.organizerId`
- Referenced by `organizerApplications.userId`
- Referenced by `volunteers.userId`
- Referenced by `announcements.organizerId`

---

### `events`

- **Purpose:** Race events created by organizers, containing all race configuration — categories, timeline, pricing, images, and registration settings.

**Fields**

| Field | Type | Description |
|---|---|---|
| `organizerId` | `Id<"users">` | Foreign key to the `users` table — the organizer who owns this event. |
| `organizerName` | `string` | Denormalized organizer display name. Stored to avoid a join on public event listings. |
| `name` | `string` | Event name (e.g. "BGC Night Race 2026"). |
| `description` | `string` | Rich text or markdown event description. |
| `date` | `number` | Race day timestamp (Unix ms). |
| `location.name` | `string` | Human-readable location name (e.g. "BGC, Taguig"). |
| `location.address` | `string` | Full street address. |
| `location.coordinates.lat` | `number` (optional) | Latitude for map display. |
| `location.coordinates.lng` | `number` (optional) | Longitude for map display. |
| `featuredImage` | `string` | Primary event banner image (Cloudinary URL). |
| `galleryImages` | `string[]` | Up to 5 supplementary image URLs (Cloudinary). |
| `vanityRaceNumber.enabled` | `boolean` | Whether participants can choose a vanity race number. |
| `vanityRaceNumber.premiumPrice` | `number` | Additional fee charged for a vanity number selection. |
| `vanityRaceNumber.maxDigits` | `number` | Maximum digit count allowed for a vanity number (e.g. `4`). |
| `earlyBird.enabled` | `boolean` (optional) | Whether early bird pricing is active. |
| `earlyBird.startDate` | `number` (optional) | Timestamp when early bird pricing begins. |
| `earlyBird.endDate` | `number` (optional) | Timestamp when early bird pricing ends. |
| `registrationEndDate` | `number` | Deadline for registrations (Unix ms). |
| `timeline[].id` | `string` | Unique ID for the timeline item. |
| `timeline[].activity` | `string` | Activity name (e.g. "Race Kit Collection", "Gun Start"). |
| `timeline[].description` | `string` (optional) | Additional details about the activity. |
| `timeline[].time` | `string` | Display time string (e.g. `"03:00 AM"` or `"Feb 15, 2026 3:00 AM"`). |
| `timeline[].order` | `number` | Sort order for rendering the timeline sequence. |
| `categories[].id` | `string` | Unique ID for the category within this event. Referenced by `registrations.categoryId`. |
| `categories[].name` | `string` | Category display name (e.g. "42K Full Marathon"). |
| `categories[].distance` | `number` | Numeric distance value (e.g. `42`). |
| `categories[].distanceUnit` | `"km" \| "mi"` | Unit for the distance value. |
| `categories[].assemblyTime` | `string` | Display time string for participant assembly. |
| `categories[].gunStartTime` | `string` | Display time string for the gun start. |
| `categories[].cutOffTime` | `string` | Display time string for the course cut-off. |
| `categories[].price` | `number` | Standard registration price in PHP. |
| `categories[].earlyBirdPrice` | `number` (optional) | Discounted price during the early bird window. |
| `categories[].categoryImage` | `string` (optional) | Category-specific image (Cloudinary URL). |
| `categories[].routeMap.gpxFileUrl` | `string` (optional) | URL of the uploaded GPX route file. |
| `categories[].stations[].id` | `string` (optional) | Unique ID for the aid/water station. |
| `categories[].stations[].type` | `"water" \| "aid" \| "first_aid"` (optional) | Station type. |
| `categories[].stations[].label` | `string` (optional) | Display label (e.g. "KM 5 Water", "First Aid Tent"). |
| `categories[].stations[].coordinates.lat` | `number` (optional) | Station latitude. |
| `categories[].stations[].coordinates.lng` | `number` (optional) | Station longitude. |
| `categories[].inclusions` | `string[]` | List of what is included (e.g. `["Race bib", "Finisher medal", "T-shirt"]`). |
| `categories[].raceNumberFormat` | `string` | Template for bib number formatting (e.g. `"42K-{number}"` or `"42{number}"`). |
| `categories[].maxParticipants` | `number` (optional) | Slot cap for this category. Null means unlimited. |
| `categories[].showMaxParticipants` | `boolean` | Whether to show the slot cap publicly on the event page. |
| `categories[].showRegisteredCount` | `boolean` | Whether to show the current registered count publicly. |
| `categories[].registeredCount` | `number` | Denormalized count of confirmed registrants for this category. |
| `categories[].bibAssignment.enabled` | `boolean` (optional) | Whether sequential bib assignment is active for this category. |
| `categories[].bibAssignment.rangeStart` | `number` (optional) | First bib number in the assigned range. |
| `categories[].bibAssignment.rangeEnd` | `number` (optional) | Last bib number in the assigned range. |
| `categories[].bibAssignment.currentSequential` | `number` (optional) | The next sequential bib number to assign (snapshot — authoritative counter lives in `bibCounters`). |
| `status` | `"draft" \| "published" \| "cancelled" \| "completed"` | Publication lifecycle state. Only `published` events are visible to runners. |
| `featured` | `boolean` | Whether the event is featured on the homepage or browse page. |
| `createdAt` | `number` | Timestamp when the event was created. |
| `updatedAt` | `number` | Timestamp of last event update. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_organizer` | `["organizerId"]` |
| `by_status` | `["status"]` |

**Relationships**

- References `users` via `organizerId`
- Referenced by `registrations.eventId`
- Referenced by `bibCounters.eventId`
- Referenced by `volunteers.eventId`
- Referenced by `announcements.eventId`
- Referenced by `users.volunteerEvents[]`

---

### `registrations`

- **Purpose:** Records a participant's registration for a specific event category, including payment state, race kit claim status, and full participant data captured at registration time.

**Fields**

| Field | Type | Description |
|---|---|---|
| `userId` | `Id<"users">` | The Convex user who owns (is registered for) this registration. |
| `eventId` | `Id<"events">` | The event this registration belongs to. |
| `organizerId` | `Id<"users">` (optional) | Denormalized organizer ID — enables efficient organizer-scoped queries without joining `events`. |
| `categoryId` | `string` | ID of the event category (`events.categories[].id`). |
| `status` | `"pending" \| "paid" \| "cancelled"` | Overall registration status. |
| `totalPrice` | `number` | Total amount charged for this registration (base + vanity premium). |
| `raceKitClaimed` | `boolean` | Whether the participant has picked up their race kit. |
| `raceNumber` | `string` (optional) | Assigned bib/race number string. |
| `qrCodeUrl` | `string` (optional) | URL of the generated QR code for race kit claim verification. |
| `paymentStatus` | `string` (optional) | Raw payment status string from the payment provider. |
| `xenditInvoiceId` | `string` (optional) | Xendit invoice/payment request ID. |
| `xenditInvoiceUrl` | `string` (optional) | Xendit-hosted payment page URL sent to the participant. |
| `paidAt` | `number` (optional) | Timestamp when payment was confirmed. |
| `raceKitClaimedAt` | `number` (optional) | Timestamp when the race kit was claimed. |
| `createdAt` | `number` | Timestamp when the registration was created. |
| `updatedAt` | `number` | Timestamp of last registration update. |
| `isProxy` | `boolean` (optional) | `true` if this registration was created on behalf of another person by an organizer or staff. |
| `registrationData.participantInfo.firstName` | `string` (optional) | Participant's first name (snapshot at time of registration). |
| `registrationData.participantInfo.lastName` | `string` (optional) | Participant's last name. |
| `registrationData.participantInfo.name` | `string` (optional) | Full name (used when first/last are not split). |
| `registrationData.participantInfo.email` | `string` (optional) | Participant's email at registration time. |
| `registrationData.participantInfo.phone` | `string` (optional) | Participant's phone number at registration time. |
| `registrationData.participantInfo.gender` | `string` (optional) | Participant's gender at registration time. |
| `registrationData.participantInfo.birthDate` | `string` (optional) | Participant's birth date at registration time. |
| `registrationData.participantInfo.tShirtSize` | `string` (optional) | T-shirt size chosen at registration. |
| `registrationData.participantInfo.singletSize` | `string` (optional) | Singlet size chosen at registration. |
| `registrationData.participantInfo.emergencyContact.name` | `string` (optional) | Emergency contact name at registration time. |
| `registrationData.participantInfo.emergencyContact.phone` | `string` (optional) | Emergency contact phone at registration time. |
| `registrationData.participantInfo.emergencyContact.relationship` | `string` (optional) | Emergency contact relationship at registration time. |
| `registrationData.participantInfo.medicalConditions` | `string` (optional) | Medical notes at registration time. |
| `registrationData.vanityNumber` | `string` (optional) | The vanity number chosen by the participant. |
| `registrationData.vanityPremium` | `number` (optional) | Extra fee paid for the vanity number. |
| `registrationData.basePrice` | `number` (optional) | Category base price at time of registration. |
| `registrationData.totalPrice` | `number` (optional) | Total price at time of registration (may duplicate top-level `totalPrice`). |
| `registrationData.eventId` | `string` (optional) | Event ID snapshot stored inside `registrationData` (string, not `Id`). |
| `registrationData.categoryId` | `string` (optional) | Category ID snapshot stored inside `registrationData`. |
| `registrationData.registrationType` | `string` (optional) | Describes how the registration was made (e.g. `"self"`, `"proxy"`). |
| `registrationData.userId` | `string` (optional) | User ID snapshot inside `registrationData`. |
| `registrationData.registeredByUserId` | `string` (optional) | User ID of the person who submitted the registration (differs from `userId` for proxy registrations). |
| `registrationData.registeredByName` | `string` (optional) | Display name of the person who submitted the registration. |
| `registrationData.isProxy` | `boolean` (optional) | Proxy flag mirrored inside `registrationData`. |
| `registrationData.termsAccepted` | `boolean` (optional) | Whether the participant accepted the event terms and conditions. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_user` | `["userId"]` |
| `by_event` | `["eventId"]` |
| `by_user_event` | `["userId", "eventId"]` |
| `by_organizer` | `["organizerId"]` |
| `by_event_status` | `["eventId", "status"]` |
| `by_organizer_status` | `["organizerId", "status"]` |
| `by_status` | `["status"]` |

**Relationships**

- References `users` via `userId` (the participant)
- References `users` via `organizerId` (the event's organizer, denormalized)
- References `events` via `eventId`
- `categoryId` is a string key matching `events.categories[].id` — not a foreign key

---

### `bibCounters`

- **Purpose:** Authoritative sequential counter for bib number assignment per event category, ensuring no two participants in the same category receive the same bib number even under concurrent writes.

**Fields**

| Field | Type | Description |
|---|---|---|
| `eventId` | `Id<"events">` | The event this counter belongs to. |
| `categoryId` | `string` | The category within the event this counter tracks. Matches `events.categories[].id`. |
| `count` | `number` | The number of bibs issued so far for this event+category combination. The next bib is derived from `rangeStart + count`. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_event_category` | `["eventId", "categoryId"]` |

**Relationships**

- References `events` via `eventId`
- `categoryId` matches `events.categories[].id`

---

### `organizerApplications`

- **Purpose:** Tracks pending, approved, and rejected applications from users seeking organizer status. Admin reviews take place against these records.

**Fields**

| Field | Type | Description |
|---|---|---|
| `userId` | `Id<"users">` | The user who submitted this organizer application. |
| `status` | `"pending" \| "approved" \| "rejected"` | Current review status of the application. |
| `createdAt` | `number` | Timestamp when the application was submitted. |
| `updatedAt` | `number` | Timestamp of the last status change or data update. |
| `data` | `any` | Full application payload (see `OrganizerApplication` in `types/user.ts`). Stored as an untyped blob to allow the form schema to evolve without a migration. Contains: organizer name, type, description, contact details, address, verification documents (government ID, TIN, DTI/SEC registration), past events history, and estimated annual event count. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_status` | `["status"]` |
| `by_user` | `["userId"]` |

**Relationships**

- References `users` via `userId`
- On approval, `users.organizer` is populated and `users.role` is set to `"organizer"`

---

### `auditLogs`

- **Purpose:** Immutable log of admin actions for accountability and compliance. Every significant admin operation should produce an entry here.

**Fields**

| Field | Type | Description |
|---|---|---|
| `adminId` | `string` | Convex document ID of the admin user who performed the action. Stored as a plain string (not a typed `Id`) to remain readable even if the user record is deleted. |
| `adminName` | `string` | Display name of the admin at the time of the action. Denormalized to preserve history. |
| `action` | `string` | Verb describing what was done (e.g. `"approved_organizer"`, `"cancelled_event"`). |
| `targetId` | `string` | ID of the affected record (event, user, application, etc.). Plain string for cross-table flexibility. |
| `targetName` | `string` | Human-readable name of the affected record at the time of the action. |
| `details` | `string` (optional) | Free-text additional context or reason for the action. |
| `timestamp` | `number` | Unix ms timestamp of when the action was performed. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_timestamp` | `["timestamp"]` |

**Relationships**

- Loosely references `users` via `adminId` (string, not a typed foreign key)
- `targetId` may point to any table — the relationship is untyped by design

---

### `volunteers`

- **Purpose:** Manages event volunteer invitations and their granted permissions. A volunteer may be an existing platform user or an invited external email that has not yet signed up.

**Fields**

| Field | Type | Description |
|---|---|---|
| `eventId` | `Id<"events">` | The event this volunteer is associated with. |
| `userId` | `Id<"users">` (optional) | Convex user ID, set once the invited person accepts and their account is linked. `null` until accepted. |
| `email` | `string` | Email address the invitation was sent to (normalized to lowercase). Used as the primary invite key. |
| `displayName` | `string` (optional) | Volunteer's display name, populated after the invitation is accepted. |
| `photoURL` | `string` (optional) | Profile photo URL, populated after acceptance. |
| `permissions` | `string[]` | Array of permission keys granted to this volunteer. Known values (from `types/volunteer.ts`): `"kiosk"` (race kit claim terminal), `"participants"` (view participant list), `"announcements"` (send event announcements). |
| `status` | `"pending" \| "accepted" \| "revoked"` | Lifecycle state of the invitation. |
| `invitedBy` | `string` | UID (Clerk ID) of the organizer who sent the invitation. |
| `invitedAt` | `number` | Timestamp when the invitation was created. |
| `acceptedAt` | `number` (optional) | Timestamp when the volunteer accepted the invitation. |
| `revokedAt` | `number` (optional) | Timestamp when the volunteer's access was revoked. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_event` | `["eventId"]` |
| `by_email` | `["email"]` |
| `by_user` | `["userId"]` |
| `by_event_user` | `["eventId", "userId"]` |
| `by_email_event` | `["email", "eventId"]` |

**Relationships**

- References `events` via `eventId`
- References `users` via `userId` (optional — not set until acceptance)

---

### `announcements`

- **Purpose:** Event announcements created by organizers or authorized volunteers, optionally delivered to registered participants via email.

**Fields**

| Field | Type | Description |
|---|---|---|
| `eventId` | `Id<"events">` | The event this announcement is scoped to. |
| `organizerId` | `Id<"users">` | The organizer who owns the event this announcement belongs to. |
| `title` | `string` | Announcement title/subject line. |
| `message` | `string` | Announcement body — supports rich text or multiline plain text. |
| `imageUrl` | `string` (optional) | Optional image attached to the announcement (Cloudinary URL). |
| `sendEmail` | `boolean` | Whether this announcement was sent via email to registered participants at creation time. |
| `sentCount` | `number` | Number of emails successfully dispatched. `0` when `sendEmail` is `false`. |
| `createdBy` | `string` | User ID (Clerk UID) of the organizer or volunteer who authored the announcement. |
| `createdAt` | `number` | Timestamp when the announcement was created. |
| `updatedAt` | `number` | Timestamp of last update to the announcement. |

**Indexes**

| Index Name | Fields |
|---|---|
| `by_event` | `["eventId"]` |

**Relationships**

- References `events` via `eventId`
- References `users` via `organizerId`

---

## Entity Relationships

Convex uses typed `Id<"tableName">` values for foreign keys. String fields named `*Id` that are **not** typed as `Id<"...">` are intentionally untyped (e.g. `auditLogs.adminId`, `auditLogs.targetId`) to allow cross-table flexibility or to survive record deletion.

```
users
 ├─ one-to-many ──► events            (events.organizerId → users._id)
 ├─ one-to-many ──► registrations     (registrations.userId → users._id)
 ├─ one-to-many ──► registrations     (registrations.organizerId → users._id, denormalized)
 ├─ one-to-many ──► organizerApplications  (organizerApplications.userId → users._id)
 ├─ one-to-many ──► volunteers        (volunteers.userId → users._id, optional)
 └─ one-to-many ──► announcements     (announcements.organizerId → users._id)

events
 ├─ one-to-many ──► registrations     (registrations.eventId → events._id)
 ├─ one-to-many ──► bibCounters       (bibCounters.eventId → events._id)
 ├─ one-to-many ──► volunteers        (volunteers.eventId → events._id)
 └─ one-to-many ──► announcements     (announcements.eventId → events._id)

registrations
 └─ categoryId (string) ────────────► events.categories[].id  (logical FK, not typed Id)

bibCounters
 └─ categoryId (string) ────────────► events.categories[].id  (logical FK, not typed Id)

volunteers
 └─ categoryId (string) ────────────► events.categories[].id  (logical FK, not typed Id)

auditLogs
 ├─ adminId (string) ───────────────► users._id  (untyped, survives user deletion)
 └─ targetId (string) ──────────────► any table  (untyped, cross-table reference)
```

### Denormalization notes

Several fields are intentionally duplicated to avoid cross-table reads on hot paths:

| Denormalized field | Lives in | Source of truth |
|---|---|---|
| `events.organizerName` | `events` | `users.displayName` |
| `registrations.organizerId` | `registrations` | `events.organizerId` |
| `users.volunteerEvents[]` | `users` | `volunteers` table |
| `events.categories[].registeredCount` | `events` | count of `registrations` by category |
| `auditLogs.adminName`, `auditLogs.targetName` | `auditLogs` | point-in-time snapshots, never updated |

### Category as a sub-document

`events.categories` is an embedded array rather than a separate table. Each element has a string `id` field that acts as a logical foreign key from `registrations.categoryId` and `bibCounters.categoryId`. There is no Convex `Id<>` type enforcement on this relationship — application code is responsible for consistency.
