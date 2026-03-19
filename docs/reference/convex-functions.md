# Convex Backend Function Reference

Complete reference for all exported Convex functions in `/convex/`. Updated: 2026-03-19.

---

## Call Patterns

| Pattern | Used for |
|---------|----------|
| `useQuery` / `useMutation` | Client components — real-time reactive calls |
| `fetchQuery` / `fetchMutation` | Server-side API routes (Next.js route handlers) — no user identity forwarded |
| `ctx.runQuery` / `ctx.runAction` / `ctx.runMutation` | Internal cross-function calls within Convex actions |
| `ctx.scheduler.runAfter` | Deferred/scheduled execution within mutations |

**Important:** `fetchMutation` from server-side route handlers does **not** forward the user's Clerk identity. Functions called this way must enforce auth at the API route layer (Clerk middleware), not inside Convex.

---

## Scheduler Usage

| Trigger point | Scheduled function | Delay |
|---------------|-------------------|-------|
| `announcements.create` | `internal.announcements.sendAnnouncementPushes` | 0 ms (immediate) |

---

## users.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `syncUser` | mutation | Yes (or `adminSecret`) | Upserts a user record from Clerk identity data. Creates with `role: "runner"` and `profileCompletion: 15` if new. Also accepts a `CONVEX_ADMIN_SECRET` bypass for data migrations. |
| `list` | query | Yes — admin only | Paginated list of all users, optionally filtered by `role`. Admin-only. |
| `updateRole` | mutation | Yes — admin only | Sets a user's role to `runner`, `organizer`, or `admin`. Admin-only. |
| `updateProfile` | mutation | Yes | Updates the authenticated user's profile fields (name, phone, gender, birth date, medical info, sizes, address, emergency contact, completion %). |
| `updateOrganizerProfile` | mutation | Yes — organizer only | Updates the `organizer` sub-object (name, contact email, phone, type) on the current user. Requires `user.organizer` to already exist. |
| `updatePhotoURL` | mutation | Yes | Sets the authenticated user's `photoURL`. |
| `current` | query | No (returns `null` if unauthenticated) | Returns the full user record for the currently authenticated user, or `null`. |
| `getByUid` | query | Yes | Fetches a user record by Clerk UID. Returns `null` if not authenticated. |
| `updatePushToken` | mutation | Yes | Stores an Expo push notification token on the authenticated user. |
| `getInternal` | internalQuery | N/A — internal only | Fetches a single user by Convex document ID. Not callable from client. |
| `getInternalBatch` | internalQuery | N/A — internal only | Fetches multiple users by an array of document IDs in a single batch. Used by `announcements.sendAnnouncementPushes`. |
| `updateDashboardLayout` | mutation | Yes — organizer or admin | Persists the organizer dashboard widget order. Validates that the layout contains exactly the 4 known widget IDs in any order. |

---

## events.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `list` | query | No | Paginated list of events. Supports filtering by `status` and/or `organizerId`. Uses `by_organizer` or `by_status` indexes; composite filter applied in-memory when both are provided. |
| `getById` | query | No | Fetches a single event by ID. No auth guard — public read. |
| `updateStatus` | mutation | Yes — organizer or admin | Transitions an event's status (`draft`, `published`, `cancelled`, `completed`). Only the owning organizer or an admin may call this. |
| `create` | mutation | Yes — organizer or admin | Creates a new event with full category/timeline data. Sets `organizerId` and `organizerName` from the authenticated user. Requires `role: "organizer"` or `"admin"`. |
| `update` | mutation | Yes — organizer or admin | Patches any subset of event fields. Ownership check: caller must be the event's organizer or an admin. |
| `remove` | mutation | Yes — organizer or admin | Deletes an event document. Ownership check enforced. |
| `checkAccess` | query | No (returns `{hasAccess: false}` if unauthenticated) | Returns the caller's access level for a given event: `admin`, `organizer`, `volunteer` (with their permissions array), or no access. Used to gate organizer dashboard features. |
| `getByIds` | query | No | Batch-fetches multiple events by an array of IDs. Filters out nulls. |
| `getByIdInternal` | internalQuery | N/A — internal only | Fetches a single event by ID for use inside Convex actions (e.g., `emails.sendAnnouncementEmail`). |
| `clone` | mutation | Yes — organizer or admin | Duplicates an event as a `draft` with dates reset to `0`, category `registeredCount` reset to `0`, and name suffixed with `(Copy)`. Bib counters reset to `rangeStart`. |

---

## registrations.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `getCount` | query | No | Returns the count of registrations for an event with a given status (default: `"paid"`). Capped at 10,000 rows. |
| `getByUserId` | query | Yes | Returns all registrations for a user, with event details joined in. |
| `list` | query | Yes | Paginated list of registrations. Filters by `userId`, `organizerId` + `status` (composite index), `organizerId`, or `eventId`. Uses the most selective available index. |
| `getCategoryCounts` | query | No | Returns a map of `categoryId -> count` for paid + pending registrations for an event. Single index scan, in-memory grouping. |
| `checkExisting` | query | No | Returns `true` if the user already has a **paid** (non-proxy) registration for a given event + category. Used pre-checkout to block duplicates. |
| `checkPending` | query | No | Returns `true` if the user has a **pending** registration created within the last 60 seconds for a given event + category. Guards against rapid duplicate submissions. |
| `create` | mutation | No (auth enforced at API route layer) | Inserts a new registration in `pending` status. Auth is handled by the calling Next.js route handler via Clerk. |
| `updatePaymentInfo` | mutation | No (server-side only) | Attaches `xenditInvoiceId` and `xenditInvoiceUrl` to a pending registration. Only callable from server-side API routes; enforces that the registration is still `pending`. |
| `markAsPaid` | mutation | No (server-side only) | Transitions a registration to `paid`. Idempotent. Guards against marking paid without an invoice (unless `totalPrice === 0`). Also increments the denormalized `registeredCount` on the event category. |
| `getEventFulfillmentStats` | query | Yes | Returns `{total, claimed}` kit counts for all paid registrations of an event. Capped at 10,000 rows. |
| `markAsClaimed` | mutation | Yes — organizer, admin, or accepted volunteer | Marks a registration's race kit as claimed. Enforces that only event staff can perform this action. |
| `search` | query | Yes | In-memory search across paid registrations for an event, matching on participant name or race number. Capped at 5,000 rows fetched, returns top 50 matches. |
| `getById` | query | No (if server-side); Yes with ownership check (if client-side) | Fetches a single registration. Unauthenticated calls are treated as trusted server calls (webhook/sync paths). Authenticated calls verify the caller is the owner, event organizer, admin, or accepted volunteer. |
| `getByUserAndEvent` | query | Yes | Fetches the first paid or pending registration for a user+event pair. |
| `getEmailsForEvent` | query | Yes — organizer or admin | Returns a deduplicated list of participant emails (paid + pending) for an event. |
| `getEmailsForEventInternal` | internalQuery | N/A — internal only | Same as `getEmailsForEvent` but callable from within Convex actions (used by `emails.sendAnnouncementEmail`). |
| `getOrganizerDashboardStats` | query | Yes | Returns aggregated dashboard stats for an organizer: total registrations, revenue, kit fulfillment %, per-event stats, per-category stats, and the 10 most recent registrations. Uses `by_organizer_status` composite index for efficiency. |

---

## volunteers.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `listByEvent` | query | Yes — organizer or admin | Returns all volunteer records for an event. Only the event's organizer or an admin can list them. |
| `getByEmail` | query | Yes | Looks up a volunteer record for a given event + email combination. |
| `getById` | query | Yes | Fetches a single volunteer record by ID. |
| `invite` | mutation | Yes — organizer or admin | Creates a new `pending` volunteer invitation for an email address with specified permissions. |
| `accept` | mutation | Yes — invitation recipient only | Accepts a volunteer invitation. Verifies the accepting user's email matches the invitation. Updates the volunteer record to `accepted` and appends the event to `user.volunteerEvents`. |
| `revoke` | mutation | Yes — organizer or admin | Sets a volunteer's status to `revoked`. Removes the event from the volunteer's `user.volunteerEvents` array if applicable. |
| `restore` | mutation | Yes — organizer or admin | Restores a revoked volunteer to `accepted` (if they previously accepted) or `pending`. Re-adds the event to `user.volunteerEvents` if applicable. |
| `remove` | mutation | Yes — organizer or admin | Hard-deletes a volunteer record. Removes the event from `user.volunteerEvents` if the volunteer had accepted. |
| `getPendingByEmail` | query | Yes | Returns all `pending` invitations for a given email address, across all events. Used on the volunteer accept page to show open invites. |
| `listByUser` | query | Yes | Returns all `accepted` volunteer records for a given user. |
| `getByUserIdAndEvent` | query | Yes | Fetches the `accepted` volunteer record for a specific user + event pair, if one exists. |
| `getMyVolunteerEvents` | query | Yes | Returns event summaries for all of a user's pending (by email) and accepted (by userId) volunteer assignments, with event details joined in. |
| `getInviteDetails` | query | Yes | Returns a volunteer record enriched with event name, organizer name, and featured image. Used on the invite acceptance page. |

---

## announcements.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `listByEvent` | query | No | Returns all announcements for an event, ordered newest-first. No auth guard — useful for public event pages. |
| `listForParticipant` | query | Yes | Returns the 20 most recent announcements across all events the authenticated user is registered for. Joins event name onto each announcement. |
| `create` | mutation | Yes — organizer or admin | Creates an announcement and schedules `sendAnnouncementPushes` (via `ctx.scheduler.runAfter(0, ...)`) to deliver push notifications to all paid registrants. |
| `sendAnnouncementPushes` | internalAction | N/A — internal only | Batch-fetches Expo push tokens for a list of user IDs and calls `notifications.sendPush`. Then updates `sentCount` via `updateSentCount`. Scheduled by `create`. |
| `updateSentCount` | internalMutation | N/A — internal only | Patches `sentCount` on an announcement document. Called by `sendAnnouncementPushes` after delivery. |
| `update` | mutation | Yes — organizer or admin | Updates `title`, `message`, and/or `imageUrl` on an existing announcement. |
| `remove` | mutation | Yes — organizer or admin | Deletes an announcement. |

---

## applications.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `list` | query | Yes — admin only | Paginated list of organizer applications, optionally filtered by `status`. Admin-only. |
| `getByUserId` | query | Yes | Returns the current pending or approved organizer application for a given user, if any. |
| `submit` | mutation | Yes — self only | Submits a new organizer application. Inserts an `organizerApplications` record in `pending` status and populates `user.organizer` with the application data (`approved: false`). |
| `update` | mutation | Yes — self only | Updates an existing organizer application (re-submits with new data, resets status to `pending`). Also re-syncs `user.organizer`. |
| `review` | mutation | No (server-side only — auth at API route layer) | Approves or rejects an organizer application. On approval, sets `user.role = "organizer"` and `user.organizer.approved = true`. Prevents re-reviewing already-processed applications. |

---

## bibs.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `isTaken` | query | No | Checks whether a specific bib number string is already assigned to a registration in a given event. |
| `generate` | mutation | No (server-side only — auth at API route layer) | Generates a unique bib number for a category. If `vanityNumber` is provided, validates uniqueness and formats it. Otherwise, uses the `bibCounters` table for sequential generation with in-memory collision detection (scans up to 100 candidates). Atomically advances the counter after selection, then performs a final DB-level collision guard before returning. |

---

## stats.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `getPlatformStats` | query | Yes — admin only | Returns platform-wide aggregate counts: total users (broken out by role), total events (broken out by status), total paid registrations, total revenue, and pending organizer application count. All counts use indexed queries capped at 50,000 rows. |

---

## audit.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `getLogs` | query | Yes — admin only | Returns the most recent audit log entries (default 50, configurable via `limit`). Admin-only. |
| `log` | mutation | Yes (or `CONVEX_ADMIN_SECRET`) | Inserts an audit log entry. Accepts either an authenticated admin session or a valid `serverSecret` matching `CONVEX_ADMIN_SECRET`. Called from `lib/admin/audit.ts` via `fetchMutation`. |

---

## emails.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `sendAnnouncementEmail` | action | No (called server-side) | Sends a batch email announcement to all paid + pending participants for an event via Resend. Uses `internal.registrations.getEmailsForEventInternal` to fetch addresses and `internal.events.getByIdInternal` for event context. Batches sends in groups of 100. No-ops if `RESEND_API_KEY` is not set. |

---

## notifications.ts

| Function | Type | Auth Required | Description |
|----------|------|---------------|-------------|
| `sendPush` | internalAction | N/A — internal only | Sends push notifications to a list of Expo push tokens via the Expo push API (`https://exp.host/--/api/v2/push/send`). Accepts `tokens`, `title`, `body`, and optional `data`. Errors are caught and logged — failures do not throw. Not callable from client. |

---

## http.ts

No HTTP endpoints are registered. The file exports an empty `httpRouter`.

---

## auth.config.ts

Not a Convex function file — exports the Convex auth provider configuration.

| Setting | Value |
|---------|-------|
| Provider | Clerk JWT |
| Domain | `CLERK_JWT_ISSUER_DOMAIN` env var (falls back to `https://clerk.raceday.com`) |
| Application ID | `"convex"` |

---

## Internal Function Summary

These functions are **not callable from the client** — they are only invokable from other Convex functions via `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction`, or the scheduler.

| Function | File | Called by |
|----------|------|-----------|
| `users.getInternal` | users.ts | — |
| `users.getInternalBatch` | users.ts | `announcements.sendAnnouncementPushes` |
| `events.getByIdInternal` | events.ts | `emails.sendAnnouncementEmail` |
| `registrations.getEmailsForEventInternal` | registrations.ts | `emails.sendAnnouncementEmail` |
| `announcements.sendAnnouncementPushes` | announcements.ts | `announcements.create` (via scheduler) |
| `announcements.updateSentCount` | announcements.ts | `announcements.sendAnnouncementPushes` |
| `notifications.sendPush` | notifications.ts | `announcements.sendAnnouncementPushes` |

---

## Server-Side Only Mutations (no user identity forwarded)

These mutations are called exclusively from Next.js API route handlers via `fetchMutation`. They do **not** have access to `ctx.auth` and rely on the route handler to enforce authentication via Clerk.

| Function | File | Auth enforcement |
|----------|------|-----------------|
| `registrations.create` | registrations.ts | Clerk session in route handler |
| `registrations.updatePaymentInfo` | registrations.ts | Clerk session in route handler |
| `registrations.markAsPaid` | registrations.ts | Xendit webhook token / Clerk session |
| `bibs.generate` | bibs.ts | Clerk session in route handler |
| `applications.review` | applications.ts | Clerk admin session in route handler |
| `audit.log` | audit.ts | Clerk admin session or `CONVEX_ADMIN_SECRET` |
