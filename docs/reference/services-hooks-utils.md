# Services, Hooks, Utilities & Validations Reference

## 1. Service Layer (`lib/services/`)

Services are async functions that wrap Convex `fetchQuery` / `fetchMutation` for **server-side usage** (Server Components and API routes). Do not import these in client components — use `useQuery` / `useMutation` from `convex/react` there instead.

All service files import from `@/convex/_generated/api` and cast plain `string` IDs to typed Convex `Id<"table">` values at the boundary.

---

### `announcementService.ts`

| Function | Description |
|---|---|
| `getAnnouncementsByEventId(eventId)` | Fetches all announcements for an event, resolves event name, normalizes `createdAt` to a Unix timestamp. Returns `Announcement[]`. |
| `createAnnouncement(data)` | Creates an announcement via Convex mutation. Returns the new `Announcement` with a synthesized `id` and `createdAt`. |
| `updateAnnouncement(eventId, announcementId, data)` | Updates `title`, `message`, and `imageUrl` on an existing announcement. |
| `deleteAnnouncement(eventId, announcementId)` | Hard-deletes an announcement by ID. |
| `getParticipantAnnouncements(userId, email?)` | Fetches all announcements across every event the user is registered for (paid registrations, up to 50 events). Results are sorted newest-first. |

---

### `applicationService.ts`

| Function | Description |
|---|---|
| `getOrganizerApplications(options?)` | Lists paginated organizer applications. Accepts `status` (`all` / `pending` / `approved` / `rejected` / `needs_info`), `limitCount`, and `cursor`. Returns `{ items, lastDoc }`. |
| `submitOrganizerApplication(userId, data)` | Submits a new organizer application. `data` must conform to `OrganizerFormValues`. Returns the new document ID string. |
| `updateOrganizerApplication(applicationId, userId, data)` | Updates an existing application with revised `OrganizerFormValues`. |
| `checkExistingApplication(userId)` | Returns the user's existing application or `null` if none exists. Safe — catches and returns `null` on error. |
| `reviewApplication(id, status, options?)` | Approves or rejects an application. `needs_info` is currently mapped to `rejected`. Accepts optional `reason` and `adminNotes`. |

---

### `eventService.ts`

| Function | Description |
|---|---|
| `getEvents(options?)` | Lists paginated events. Accepts `status` (defaults to `"published"`), `organizerId`, `limitCount`, `cursor`. Returns `{ items: RaceEvent[], lastDoc }`. |
| `getEventById(id)` | Fetches a single event by ID. Returns `RaceEvent` or `null`. |
| `updateEventStatus(id, status)` | Updates only the status field. Valid values: `draft`, `published`, `cancelled`, `completed`. |
| `updateEvent(id, updates)` | Partial update of any event fields. |
| `deleteEvent(id)` | Hard-deletes an event. |

---

### `registrationService.ts`

| Function | Description |
|---|---|
| `getRegistrations(options?)` | Lists paginated registrations. Accepts `userId`, `eventId`, `organizerId`, `status` (defaults to `"all"`), `limitCount`, `cursor`. Returns `{ items: Registration[], lastDoc }`. |
| `getRegistrationsWithEvents(options?)` | Same as `getRegistrations` but enriches each registration with its parent `event` object fetched via `api.events.getByIds`. Returns `{ items, lastDoc }`. |
| `getUserRegistrations(userId)` | Fetches all registrations for a user via `api.registrations.getByUserId`. Returns `Registration[]`. Safe — returns `[]` on error. |
| `getCategoryCounts(eventId)` | Returns a map of `{ [categoryId]: count }` for an event. Safe — returns `{}` on error. |

---

### `statsService.ts`

| Function | Description |
|---|---|
| `getPlatformStats()` | Returns aggregate platform stats: `totalUsers`, `totalEvents`, `totalRegistrations`, `totalRevenue`, `pendingApplications`, and `usersByRole` breakdown (`runner`, `organizer`, `admin`). |

**`PlatformStats` interface** is defined in this file and exported alongside the function.

---

### `volunteerService.ts`

| Function | Description |
|---|---|
| `inviteVolunteer(eventId, email, permissions, invitedBy)` | Creates a volunteer invitation record. Returns an `EventVolunteer` with `status: "pending"`. |
| `getEventVolunteers(eventId)` | Lists all volunteers for an event. Returns `EventVolunteer[]`. |
| `getVolunteerByEmail(eventId, email)` | Looks up a single volunteer record by event + email. Returns `EventVolunteer` or `null`. |
| `acceptInvitation(eventId, volunteerId, userId, displayName?, photoURL?)` | Marks an invitation as accepted and links it to a Convex user ID. |
| `revokeVolunteer(eventId, volunteerId)` | Revokes volunteer access for a specific record. |
| `getVolunteerEventsByEmail(email)` | Returns all **pending** invitations for a given email address. |
| `getVolunteerEventsByUid(userId)` | Returns all active volunteer assignments for a Convex user ID. |

Internal helper `toEventVolunteer(v)` normalizes raw Convex documents to `EventVolunteer` shape.

---

### `announcementService.ts` — Email Layer (`emailService.ts`)

> Note: `emailService.ts` is a standalone email module, not strictly part of the Convex service layer. It uses the Resend SDK directly.

| Function | Description |
|---|---|
| `sendEmailBlast({ to, subject, html, from?, replyTo? })` | Sends a batch email to one or more recipients using Resend's batch API (100 recipients per batch). Gracefully mocks if `RESEND_API_KEY` is not set. |
| `sendVolunteerInvitation({ to, eventName, organizerName, acceptUrl, permissions })` | Sends a styled HTML email invitation to a prospective volunteer. Internally calls `sendEmailBlast`. |

---

### `aiService.ts`

Client-side fetch wrappers for the `/api/ai/event-suggest` route. All functions accept an optional `token` for auth headers.

| Function | Description |
|---|---|
| `getAISuggestions(prompt, token?)` | Requests a complete event suggestion (title, description, categories) from Claude AI. Returns `AISuggestion`. |
| `getAITimeline(eventInfo, token?)` | Requests a suggested event day timeline. Returns `{ timeline: { time, activity, description }[] }`. |
| `improveText(text, token?)` | Submits text for AI copy improvement. Returns `{ improvedText: string }`. |

**`AISuggestion` interface** is exported from this file.

---

## 2. Custom Hooks

### `lib/hooks/useAuth.ts`

Unified auth state combining Clerk and Convex. Use this everywhere authentication state is needed in client components — do not read from Clerk and Convex separately.

```ts
const { user, clerkUser, loading, role, signOut } = useAuth();
```

| Return value | Type | Description |
|---|---|---|
| `user` | `User \| null` | The Convex user document (full profile). |
| `clerkUser` | `UserResource \| null` | The raw Clerk user object. |
| `loading` | `boolean` | `true` while either Clerk or Convex has not yet resolved. |
| `role` | `UserRole \| null` | Shorthand for `user?.role`. Values: `"runner"`, `"organizer"`, `"admin"`. |
| `signOut` | `() => void` | Clerk sign-out function. |
| `refreshUser` | `async () => void` | No-op — Convex queries are reactive. Kept for API compatibility. |

---

### `lib/hooks/useFormSteps.ts`

Multi-step form navigation with per-step field validation. Requires a parent `FormProvider` from react-hook-form.

```ts
const { currentStep, setCurrentStep, nextStep, prevStep } = useFormSteps<MyFormValues>(
  totalSteps,
  { 0: ["fieldA", "fieldB"], 1: ["fieldC"] }
);
```

| Parameter | Description |
|---|---|
| `totalSteps` | Total number of steps (integer). |
| `stepFields` | Map of step index → array of field paths to validate before advancing. |

| Return value | Description |
|---|---|
| `currentStep` | Zero-based current step index. |
| `setCurrentStep` | Direct step setter (for jumping). |
| `nextStep()` | Triggers `trigger()` on the current step's fields. Advances on success. On failure, scrolls to and focuses the first invalid field. |
| `prevStep()` | Moves back one step (no validation). |

---

### `lib/hooks/usePaginatedQuery.ts`

Wrapper around Convex's `usePaginatedQuery` that provides a normalized interface with mapped IDs and simpler status flags.

```ts
const { data, loading, hasMore, loadMore } = usePaginatedQuery<MyType>({
  apiQuery: api.myTable.list,
  args: { filter: "value" },
  pageSize: 20,
});
```

| Return value | Type | Description |
|---|---|---|
| `data` | `T[]` | Results with `_id` normalized to `id`. Memoized. |
| `loading` | `boolean` | `true` during first page load or when loading more. |
| `error` | `null` | Always `null` — Convex handles errors internally. |
| `hasMore` | `boolean` | `false` when Convex status is `"Exhausted"`. |
| `loadMore()` | `() => void` | Loads the next page. No-op if not `"CanLoadMore"`. |
| `refresh()` | `() => void` | No-op — Convex is real-time. |

---

### `hooks/use-mobile.ts`

Responsive breakpoint detection hook.

```ts
const isMobile = useIsMobile(); // true if viewport < 768px
```

- Breakpoint: `768px` (same as Tailwind's `md` breakpoint).
- Uses a `matchMedia` listener — updates reactively on resize.
- Returns `false` on the server (SSR-safe via `undefined` initial state coerced with `!!`).

---

## 3. Utilities (`lib/`)

### `lib/utils.ts`

General-purpose utility functions. All are pure / side-effect-free.

| Function | Signature | Description |
|---|---|---|
| `cn(...inputs)` | `ClassValue[] → string` | Merges Tailwind class names using `clsx` + `tailwind-merge`. Use everywhere conditional classes are needed. |
| `toDate(value)` | `any → Date` | Normalizes a `Date`, Unix timestamp (number), or ISO string to a `Date`. Returns `new Date()` on null/invalid input. |
| `toInputDate(date)` | `any → string` | Converts any date-like value to `YYYY-MM-DD` string for native `<input type="date">`. |
| `formatDate(date, format?)` | `any, "short"\|"long"\|"full" → string` | Formats a date for display. `"short"` = "Mar 19, 2026", `"long"` = "March 19, 2026", `"full"` = "March 19, 2026, 10:00 AM". Returns `""` on null. |
| `formatCurrency(amount)` | `number → string` | Formats as Philippine Peso with no decimal places (e.g., `"₱1,500"`). Uses `en-PH` locale. |
| `formatDistance(distance, distanceUnit?)` | `number\|string, string? → string` | Returns `"42 km"` from numeric + unit. Passes legacy string distances through unchanged. |
| `generateId()` | `() → string` | Returns a UUID via `crypto.randomUUID()` with a fallback for non-secure contexts. |
| `computeProfileCompletion(user)` | `User\|null → number` | Returns a 0–100 score based on weighted profile field presence. Weights: phone 15%, emergency contact name 15%, display name 10%, email 10%, address street 10%, address city 10%, t-shirt size 10%, emergency contact phone 10%, photo 5%, medical conditions 5%. |

---

### `lib/bibUtils.ts`

Bib number generation and formatting helpers. Server-side (wraps Convex mutations).

| Function | Signature | Description |
|---|---|---|
| `isBibTaken(eventId, raceNumber)` | `string, string → Promise<boolean>` | Checks if a bib number is already assigned in an event. |
| `generateBibNumber(eventId, categoryId, vanityNumber?)` | `string, string, string? → Promise<string>` | Calls `api.bibs.generate` to assign the next sequential (or vanity) bib number. |
| `generateBibAndQR(registrationId, eventId, categoryId, runnerName, vanityNumber?)` | `... → Promise<{ raceNumber, qrCodeUrl }>` | Generates a bib number then produces a QR code data URL encoding `{ registrationId, eventId, runnerName, raceNumber }`. |
| `getRaceNumberFormat(eventId, categoryId)` | `string, string → Promise<string>` | Looks up the category's `raceNumberFormat` string (e.g., `"42K-{number}"`). Defaults to `"{number}"`. |
| `formatBibNumber(format, number)` | `string, string → string` | Substitutes `{number}` in a format template with the given number string. Pure function — no async. |

---

### `lib/earlyBirdUtils.ts`

Pure functions for early bird pricing logic. All accept `RaceEvent` (and optionally `EventCategory`) from `@/types/event`.

| Function | Signature | Description |
|---|---|---|
| `isEarlyBirdActive(event)` | `RaceEvent → boolean` | Returns `true` if `earlyBird.enabled` is set and the current date/time falls within `[startDate 00:00, endDate 23:59:59]`. |
| `getEffectivePrice(event, category)` | `RaceEvent, EventCategory → number` | Returns early bird price if active and numerically lower than the regular price; otherwise returns the regular price. |
| `getEarlyBirdDaysRemaining(event)` | `RaceEvent → number \| null` | Returns the number of days (ceiling) until the early bird ends. Returns `null` if not active or already expired. |
| `isRegistrationClosed(event)` | `RaceEvent → boolean` | Returns `true` if the current date is past `registrationEndDate 23:59:59`. |
| `isEventOver(event)` | `RaceEvent → boolean` | Returns `true` if the current date is past the event date at `23:59:59`. |
| `isCategoryFull(category)` | `EventCategory → boolean` | Returns `true` if `registeredCount >= maxParticipants` (and `maxParticipants > 0`). |

---

### `lib/volunteerAccess.ts`

Server-side permission checks for volunteers. Uses `React.cache` so repeated calls within a single request are deduplicated.

| Function | Signature | Description |
|---|---|---|
| `getVolunteerRecord(userId, eventId)` | `string, string → Promise<doc\|null>` | Cached fetch of the volunteer record for a user+event pair. |
| `isEventVolunteer(userId, eventId)` | `string, string → Promise<boolean>` | Returns `true` if the user has any volunteer record for the event. |
| `hasVolunteerPermission(userId, eventId, permission)` | `string, string, VolunteerPermission → Promise<boolean>` | Returns `true` if the user's volunteer record includes the specified permission. |
| `getVolunteerPermissions(userId, eventId)` | `string, string → Promise<VolunteerPermission[]>` | Returns the full permissions array, or `[]` if no record exists. |

---

### `lib/dashboard-nav.ts`

Navigation configuration for the dashboard sidebar. Exports pre-built nav arrays and helper functions.

**Exported constants:**

| Export | Type | Description |
|---|---|---|
| `runnerNav` | `NavGroup[]` | Nav groups for the runner dashboard: Overview, Profile, Find Races, View Site, Settings. |
| `organizerNav` | `NavGroup[]` | Nav groups for the organizer dashboard: Overview, Events, Registrations, Create Event, Kiosk Mode, Scanner, Settings. |
| `adminNav` | `NavGroup[]` | Nav groups for the admin dashboard: Overview, Users, Events, Applications, Analytics, Audit Logs. |
| `roleOptions` | `RoleOption[]` | All three roles with label, value, href, and icon — used for role-switching UI. |

**Exported functions:**

| Function | Signature | Description |
|---|---|---|
| `getNavForRole(role)` | `string → NavGroup[]` | Returns the correct nav array for `"admin"`, `"organizer"`, or any other value (defaults to runner nav). |
| `getActiveRole(pathname)` | `string → string` | Infers the active role from the current pathname. |
| `getAvailableRoles(userRole)` | `string → RoleOption[]` | Returns only the roles a user can switch to. Admins see all three; organizers see runner and organizer; runners see only runner. |

**Interfaces:**

```ts
interface NavItem  { title: string; href: string; icon: LucideIcon; }
interface NavGroup { label: string; items: NavItem[]; }
interface RoleOption { label: string; value: string; href: string; icon: LucideIcon; }
```

---

### `lib/qr.ts`

| Function | Signature | Description |
|---|---|---|
| `generateQRCode(text)` | `string → Promise<string>` | Generates a QR code from any string and returns a base64 data URL. Uses `qrcode` npm package. Options: 2-cell margin, scale 10, black-on-white. Throws on failure. |

---

### `lib/cloudinary/config.ts`

| Export | Description |
|---|---|
| `CLOUDINARY_CONFIG` | Object with `cloudName`, `uploadPreset`, `apiKey` from `NEXT_PUBLIC_*` env vars. |
| `cloudinaryLoader` | Next.js image loader function. Accepts `{ src, width, quality? }` and returns an optimized Cloudinary URL using `f_auto`, `c_limit`, `w_`, `q_` transforms. Use as the `loader` prop on `<Image>`. |

---

## 4. Validation Schemas (`lib/validations/`)

All schemas use [Zod](https://zod.dev). Inferred form value types are exported alongside each schema.

---

### `event.ts`

Top-level export: `eventSchema`, `EventFormValues`, `EventFormInput`.

**Key sub-schemas:**

| Schema | Key fields |
|---|---|
| `timelineItemSchema` | `id`, `activity` (min 3), `description?`, `time` (min 2), `order` |
| `raceStationSchema` | `id`, `type` (`water`/`aid`/`first_aid`), `label` (min 1), `coordinates: { lat, lng }` |
| `eventCategorySchema` | `id`, `name` (min 3), `distance` (positive number), `distanceUnit` (`km`/`mi`), `assemblyTime`, `gunStartTime`, `cutOffTime`, `price` (≥0), `earlyBirdPrice?` (≥0), `inclusions` (min 1 item), `raceNumberFormat` (min 1), `maxParticipants?`, `showMaxParticipants` (bool), `showRegisteredCount` (bool), `registeredCount` |

**`eventSchema` fields:**

| Field | Validation |
|---|---|
| `name` | min 5 chars |
| `description` | min 20 chars |
| `date` | coerced to `Date`, required |
| `location` | `{ name (min 3), address (min 5), coordinates?: { lat, lng } }` |
| `featuredImage` | min 1 char (URL required) |
| `galleryImages` | max 5 items |
| `vanityRaceNumber` | `{ enabled (bool), premiumPrice (≥0), maxDigits (1–10) }` |
| `earlyBird` | Optional. If `enabled`, `startDate` and `endDate` are required, and `startDate <= endDate`. |
| `registrationEndDate` | Coerced to `Date`. Must be ≤ `date`. |
| `timeline` | Array of `timelineItemSchema` |
| `categories` | Min 1 item. If early bird is enabled, every category must have `earlyBirdPrice < price`. |
| `status` | `draft`/`published`/`cancelled`/`completed` |
| `featured` | `boolean` |

`EventFormInput` is a variant where `date`, `registrationEndDate`, and early bird dates are typed as `string` (YYYY-MM-DD) for use with `<input type="date">`.

---

### `registration.ts`

Top-level export: `registrationSchema`, `RegistrationFormValues`.

| Field | Validation |
|---|---|
| `registrationType` | `"self"` or `"proxy"` |
| `eventId` | string |
| `categoryId` | min 1 char |
| `participantInfo.name` | min 2 chars |
| `participantInfo.email` | valid email |
| `participantInfo.phone` | min 10 chars |
| `participantInfo.gender` | `"male"` / `"female"` / `"other"` |
| `participantInfo.birthDate` | min 1 char |
| `participantInfo.tShirtSize` | min 1 char |
| `participantInfo.singletSize` | min 1 char |
| `participantInfo.emergencyContact` | `{ name (min 2), phone (min 10), relationship (min 2) }` |
| `participantInfo.medicalConditions` | optional string |
| `vanityNumber` | optional, digits only (`/^[0-9]+$/`) |
| `basePrice` | number |
| `vanityPremium` | number |
| `totalPrice` | number |
| `termsAccepted` | must be `true` |

---

### `profile.ts`

Top-level exports: `profileSchema`, `ProfileFormValues`, `calculateCompletion`.

| Field | Validation |
|---|---|
| `displayName` | min 2 chars |
| `phone` | min 10 chars or empty string |
| `gender` | `""` / `"male"` / `"female"` / `"other"` |
| `birthDate` | string or empty |
| `medicalConditions` | optional string |
| `tShirtSize` | `""` / `"XS"` / `"S"` / `"M"` / `"L"` / `"XL"` / `"2XL"` / `"3XL"` |
| `singletSize` | same enum as `tShirtSize` |
| `address` | `{ street, city, province, zipCode, country }` — each min 1 or empty |
| `emergencyContact` | `{ name (min 1 or ""), phone (min 10 or ""), relationship (min 1 or "") }` |

`calculateCompletion(data: ProfileFormValues)` returns a 0–100 integer based on 13 checked fields plus email (treated as always filled).

---

### `organizer.ts`

Exports step schemas individually and a merged `fullOrganizerSchema`. Inferred type: `OrganizerFormValues`.

| Schema | Fields |
|---|---|
| `organizerStep1Schema` | `organizerName` (min 3), `organizerType` (enum: `individual`/`sports_club`/`business`/`lgu`/`school`/`nonprofit`), `description` (20–500 chars) |
| `organizerStep2Schema` | `contactPerson` (min 3), `contactEmail` (valid email), `phone` (PH mobile regex: `09XXXXXXXXX` or `+639XXXXXXXXX`), `alternatePhone?`, `website?` (valid URL or empty) |
| `organizerStep3Schema` | `address: { street (min 3), barangay (min 2), city (min 2), province (min 2), region (min 2), zipCode (exactly 4 digits) }` |
| `organizerStep4Schema` | `organizerTIN?` (format `XXX-XXX-XXX-XXX` or empty), `dtiSecRegistration?`, `governmentId: { type (min 1), idNumber (min 3), frontImageUrl (URL), backImageUrl? }`, `businessPermitUrl?`, `pastEventsDescription?` (max 1000), `estimatedEventsPerYear?` (1–100) |

Use individual step schemas with `useFormSteps` to validate per-step before advancing.

---

### `volunteer.ts`

| Export | Fields |
|---|---|
| `volunteerInviteSchema` | `email` — valid email, trimmed, lowercased, **must end with `@gmail.com`**; `permissions` — non-empty array of `"kiosk"` / `"participants"` / `"announcements"` |
| `volunteerPermissionUpdateSchema` | `permissions` — same as above, min 1 |
| `VolunteerInviteFormValues` | Inferred type from `volunteerInviteSchema` |
| `VolunteerPermissionUpdateValues` | Inferred type from `volunteerPermissionUpdateSchema` |

Note: The Gmail-only constraint is enforced here at the validation layer because Google sign-in is required to accept an invitation.

---

## 5. Constants (`lib/constants/`)

### `ph-regions.ts`

| Export | Type | Description |
|---|---|---|
| `PH_REGIONS` | `{ code: string, name: string }[]` | 18 Philippine regions including NCR, CAR, Regions I–XIII, and BARMM. |
| `PH_PROVINCES` | `Record<string, string[]>` | Region code → array of province names. Covers all 18 region codes. |

Use `PH_REGIONS` to populate a region `<select>`, then filter `PH_PROVINCES[regionCode]` for the province dropdown.

---

### `ph-id-types.ts`

| Export | Type | Description |
|---|---|---|
| `PH_GOVERNMENT_ID_TYPES` | `{ value: string, label: string }[]` | 12 government-issued ID types accepted for organizer verification. |

Values: `philsys`, `drivers_license`, `passport`, `sss_id`, `gsis_id`, `prc_id`, `postal_id`, `voters_id`, `senior_id`, `pwd_id`, `tin_id`, `umid`.

---

## 6. Type Definitions (`types/`)

### `types/event.ts`

| Type / Interface | Description |
|---|---|
| `EventStatus` | Union: `"draft" \| "published" \| "cancelled" \| "completed"` |
| `StationType` | Union: `"water" \| "aid" \| "first_aid"` |
| `TimelineItem` | `{ id, activity, description?, time, order }` — a single event day schedule entry |
| `RaceStation` | `{ id, type: StationType, label, coordinates: { lat, lng } }` — a course aid/water point |
| `EventCategory` | Full category shape including pricing, bib format, participant counts, inclusions, route map, stations, and optional `bibAssignment` range config |
| `RaceEvent` | Full event shape: organizer info, dates (Unix timestamps), location, images, vanity number config, early bird config, timeline, categories, status, featured flag |

---

### `types/registration.ts`

| Type / Interface | Description |
|---|---|
| `RegistrationStatus` | Union: `"pending" \| "paid" \| "cancelled" \| "failed"` |
| `PaymentStatus` | Union: `"unpaid" \| "paid" \| "failed" \| "expired"` |
| `ParticipantInfo` | `{ name, email, phone, tShirtSize, singletSize, emergencyContact: { name, phone, relationship }, medicalConditions? }` |
| `Registration` | Full registration document: participant info, pricing, status/payment status, race number, QR code URL, kit claim state, Xendit payment reference |

---

### `types/user.ts`

| Type / Interface | Description |
|---|---|
| `UserRole` | Union: `"runner" \| "organizer" \| "admin"` |
| `OrganizerType` | Union: `"individual" \| "sports_club" \| "business" \| "lgu" \| "school" \| "nonprofit"` |
| `User` | Full user document: Clerk UID, email, display name, role, profile fields (phone, gender, birthDate, address, emergencyContact, sizes, medicalConditions), optional organizer sub-object, profileCompletion score |
| `OrganizerApplication` | Full application document mirroring the 4-step form: basic info, contact details, PH address (with barangay + region), verification documents, and review metadata |

---

### `types/announcement.ts`

| Type / Interface | Description |
|---|---|
| `Announcement` | `{ id, eventId, eventName?, organizerId, title, message, imageUrl?, sendEmail, sentCount?, createdAt (Unix), createdBy }` |
| `CreateAnnouncementInput` | `Omit<Announcement, "id" \| "createdAt" \| "sentCount">` — input shape for creating a new announcement |

---

### `types/volunteer.ts`

| Type / Interface | Description |
|---|---|
| `VolunteerStatus` | Union: `"pending" \| "accepted" \| "revoked"` |
| `VolunteerPermission` | Union: `"kiosk" \| "participants" \| "announcements"` |
| `EventVolunteer` | Full volunteer record: event ID, email (normalized), display name, permissions array, status, invitation/acceptance/revocation timestamps, and linked Clerk UID |
| `VolunteerInviteFormData` | `{ email: string, permissions: VolunteerPermission[] }` — lightweight form input shape |
