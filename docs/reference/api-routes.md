# API Routes Reference

All Next.js API routes live under `app/api/`. This document covers every route handler, its auth requirements, Convex interactions, and request/response shapes.

---

## Common Patterns

### Authentication

Most routes use Clerk's `auth()` server helper. The pattern is consistent across protected routes:

```ts
import { auth } from "@clerk/nextjs/server";

const { userId, getToken } = await auth();
if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

Routes that need to call Convex as the authenticated user also request a Convex-scoped JWT:

```ts
const token = await getToken({ template: "convex" });
// then pass to fetchQuery/fetchMutation:
await fetchQuery(api.some.query, args, { token: token ?? undefined });
```

### Calling Convex from Route Handlers

Routes use `fetchQuery` and `fetchMutation` from `convex/nextjs` — not the React hooks. Queries that need user identity pass the token; public read-only queries may omit it.

```ts
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
```

### Webhook Auth (Xendit)

The Xendit webhook route does **not** use Clerk. Instead it validates a shared secret from an HTTP header:

```ts
const token = req.headers.get("x-callback-token");
if (!token || token !== process.env.XENDIT_CALLBACK_TOKEN) { /* 401 */ }
```

---

## Routes

### 1. `POST /api/ai/announcement-assistant`

**Auth:** Clerk (`userId` required). IP-based rate limit: 15 req/min per serverless instance.

**Purpose:** AI-assisted drafting/rewriting of event announcements. Calls Claude (`claude-sonnet-4-20250514`) with one of four tones based on the `action` field.

**Convex Functions Called:** None — purely an AI proxy route.

**Actions:**

| `action` value  | Behavior |
|-----------------|----------|
| `draft`         | Generate a new announcement from a title (and optional context) |
| `improve`       | Improve grammar, clarity, and professionalism of existing message |
| `make-formal`   | Rewrite message in a highly formal/official tone |
| `make-exciting` | Rewrite message in a high-energy, hype-driven tone |

**Request body:**
```json
{
  "title": "string",
  "message": "string (optional for draft, required for others)",
  "action": "draft | improve | make-formal | make-exciting"
}
```

**Response (200):**
```json
{ "message": "Generated or rewritten announcement text." }
```

**Error responses:** `400 Invalid action`, `401 Unauthorized`, `429 Too many requests`, `500` on AI/config error.

---

### 2. `POST /api/ai/event-suggest`

**Auth:** Clerk (`userId` required). IP-based rate limit: 10 req/min per serverless instance.

**Purpose:** AI-assisted content generation for event creation. Calls Claude (`claude-sonnet-4-5`) to produce a full event title + description + categories, a race day timeline, or an improved event description.

**Convex Functions Called:** None — purely an AI proxy route.

**Actions:**

| `type` value | Behavior |
|--------------|----------|
| `complete`   | Generate event title, description, and 3–4 race categories from keywords |
| `timeline`   | Generate a 10-entry race day schedule for a given event |
| `improve`    | Improve an existing event description |

**Request body:**
```json
{
  "prompt": "string (keywords, partial info, or existing text)",
  "type": "complete | timeline | improve"
}
```

**Response shapes by type:**

`complete`:
```json
{
  "title": "string",
  "description": "string",
  "categories": [
    { "name": "string", "distance": "string", "description": "string" }
  ]
}
```

`timeline`:
```json
{
  "timeline": [
    { "time": "03:00 AM", "activity": "string", "description": "string" }
  ]
}
```

`improve`:
```json
{ "improvedText": "string" }
```

**Error responses:** `401 Unauthorized`, `429 Too many requests`, `500` on AI/config error.

---

### 3. `POST /api/cloudinary/sign`

**Auth:** Clerk (`userId` required).

**Purpose:** Server-side signing of Cloudinary upload requests. Prevents unsigned direct uploads to the Cloudinary account by generating a valid HMAC signature using `CLOUDINARY_API_SECRET`. The client must call this endpoint before uploading directly to Cloudinary.

**Convex Functions Called:** None.

**Request body:**
```json
{
  "paramsToSign": {
    "folder": "string (optional)",
    "public_id": "string (optional)",
    "...": "any other Cloudinary upload params"
  }
}
```

**Response (200):**
```json
{
  "signature": "string (hex HMAC)",
  "timestamp": 1710000000
}
```

**Error responses:** `401 Unauthorized`, `500` on signing failure.

---

### 4. `GET /api/events/[id]/announcements`

**Auth:** Clerk (`userId` required). No Convex token is forwarded — the query runs as an unauthenticated Convex call.

**Purpose:** Fetches all announcements for a specific event. Used by the organizer dashboard to display the announcement list.

**Path parameter:** `id` — Convex event ID (must be ≥ 10 characters and not the string `"undefined"`).

**Convex Functions Called:**
- `api.announcements.listByEvent` (query) — `{ eventId: Id<"events"> }`

**Response (200):** Array of announcement objects as returned by Convex.

**Error responses:** `400 Invalid Event ID`, `401 Unauthorized`, `500`.

---

### 5. `GET /api/events/[id]/check-access`

**Auth:** Clerk (`userId` + `getToken` required). Convex token is forwarded.

**Purpose:** Returns the calling user's access level for a given event: whether they are the organizer, a platform admin, and their volunteer permissions (if any). Used client-side to conditionally render organizer controls.

**Path parameter:** `id` — Convex event ID.

**Convex Functions Called:**
- `api.users.getByUid` (query) — `{ uid: clerkId }` with token
- `api.events.getById` (query) — `{ id: Id<"events"> }`
- `getVolunteerPermissions` (lib helper, internally calls Convex) — `(userId, eventId)`

**Response (200):**
```json
{
  "isOrganizer": true,
  "isAdmin": false,
  "permissions": { "...volunteerPermissions": "..." }
}
```

**Error responses:** `400 Invalid Event ID`, `401 Unauthorized` (plain text), `404 User/Event not found`, `500`.

---

### 6. `GET /api/events/[id]/export`

**Auth:** Clerk (`userId` + `getToken` required). Only the event organizer or a platform admin (`user.role === "admin"`) may export. Returns `403` otherwise.

**Purpose:** Exports all registrations for an event as a UTF-8 CSV file. Supports optional query parameters to filter by payment status or search term. CSV output is injection-safe (dangerous formula prefixes are escaped).

**Path parameter:** `id` — Convex event ID.

**Query parameters:**

| Param    | Default | Description |
|----------|---------|-------------|
| `status` | `all`   | Filter by registration status (e.g. `paid`, `pending`) |
| `q`      | `""`    | Full-text search on name, email, or race number (applied client-side after Convex fetch) |

**Convex Functions Called:**
- `api.users.getByUid` (query) — with token
- `api.events.getById` (query)
- `api.registrations.list` (query) — `{ eventId, status, paginationOpts: { numItems: 2000, cursor: null } }`

**Response (200):** `Content-Type: text/csv` attachment with columns:

```
Registration ID, Added On, Participant Name, Email, Phone,
Emergency Contact Name, Emergency Contact Phone, Category,
Bib Number, T-Shirt Size, Singlet Size, Medical Conditions,
Payment Status, Kit Claimed, Amount Paid, Is Proxy
```

Filename format: `event-{id}-registrations-{yyyyMMdd-HHmmss}.csv`

**Error responses:** `400 Invalid Event ID`, `401 Unauthorized`, `403 Forbidden`, `404 Event not found`, `500`.

---

### 7. `GET /api/participant/announcements`

**Auth:** Clerk (`userId` + `getToken` required). Convex token is forwarded so the query can filter to events the caller is registered for.

**Purpose:** Returns all announcements relevant to the authenticated participant — i.e., announcements for events they have a paid registration in. Used on the participant dashboard.

**Convex Functions Called:**
- `api.announcements.listForParticipant` (query) — no args, token forwarded (identity resolved server-side in Convex)

**Response (200):** Array of announcement objects.

**Error responses:** `401 Unauthorized`, `500`.

---

### 8. `POST /api/payments/create-checkout`

**Auth:** Clerk (optional — unauthenticated proxy registrations are supported). Convex token is requested if a Clerk session exists.

**Purpose:** The core registration and payment route. Validates server-side that the category exists, is not full, registration is not closed, and the submitted price matches the current effective price (including early bird). For paid registrations it creates a Xendit invoice and returns the checkout URL. For free registrations it completes the registration immediately without Xendit.

**Convex Functions Called:**
- `api.users.getByUid` (query) — to resolve Convex `userId` from Clerk ID
- `api.events.getById` (query) — to validate event, price, capacity, and deadline
- `api.registrations.checkExisting` (query) — duplicate check for non-proxy registrations
- `api.registrations.checkPending` (query) — rapid re-submission guard
- `api.registrations.create` (mutation) — creates the registration record (status: `pending`)
- `api.registrations.markAsPaid` (mutation) — called immediately for free registrations
- `api.registrations.updatePaymentInfo` (mutation) — stores Xendit invoice ID and URL on the record

**Request body:**
```json
{
  "registrationData": {
    "eventId": "string (Convex ID)",
    "categoryId": "string",
    "userId": "string (Convex ID, fallback for unauthenticated)",
    "isProxy": false,
    "basePrice": 500,
    "vanityNumber": "string | null",
    "participantInfo": {
      "name": "string",
      "email": "string",
      "phone": "string (optional)",
      "tShirtSize": "string",
      "singletSize": "string",
      "medicalConditions": "string",
      "emergencyContact": { "name": "string", "phone": "string" }
    }
  },
  "eventName": "string",
  "categoryName": "string"
}
```

**Response (200) — paid registration:**
```json
{ "checkoutUrl": "https://checkout.xendit.co/...", "registrationId": "string" }
```

**Response (200) — free registration:**
```json
{ "checkoutUrl": null, "registrationId": "string", "free": true }
```

**Error responses:** `400` (closed, invalid price, sold out, duplicate), `404 Event not found`, `409 Pending registration exists`, `500`.

---

### 9. `GET /api/payments/sync/[regId]`

**Auth:** Clerk (`userId` required).

**Purpose:** Polls Xendit to check the current status of a payment for a given registration. If Xendit reports `PAID` or `SETTLED` and the Convex record is still `pending`, it generates the bib number and QR code then marks the registration as paid. Used on the post-checkout success/polling page.

**Path parameter:** `regId` — Convex registration ID.

**Convex Functions Called:**
- `api.registrations.getById` (query) — to fetch current status and registration data
- `api.registrations.markAsPaid` (mutation) — if Xendit confirms payment

**External calls:** `GET https://api.xendit.co/v2/invoices?external_id={regId}`

**Response (200) — already paid in Convex:**
```json
{ "status": "paid", "raceNumber": "string" }
```

**Response (200) — Xendit PAID/SETTLED, now marking paid:**
```json
{ "status": "paid", "raceNumber": "string" }
```

**Response (200) — still pending:**
```json
{ "status": "pending", "message": "No invoice found yet" }
```

**Response (200) — other Xendit status:**
```json
{ "status": "expired | failed | ..." }
```

**Error responses:** `401 Unauthorized`, `404 Registration not found`, `500`.

---

### 10. `POST /api/payments/webhook`

**Auth:** Xendit webhook token. Header `x-callback-token` must match `process.env.XENDIT_CALLBACK_TOKEN`. No Clerk auth.

**Purpose:** Receives Xendit payment callbacks. On `PAID` or `SETTLED` status, generates the bib/QR and marks the registration as paid in Convex. Idempotent — if the registration is already `paid` in Convex it returns success immediately without re-processing. Falls back to sequential bib assignment if the requested vanity number causes a conflict.

**Convex Functions Called:**
- `api.registrations.getById` (query) — to fetch registration and check for idempotency
- `api.registrations.markAsPaid` (mutation) — to finalize the registration

**Request body (from Xendit):**
```json
{
  "status": "PAID | SETTLED | ...",
  "external_id": "string (Convex registration ID)",
  "...": "other Xendit invoice fields"
}
```

**Response (200):**
```json
{ "success": true }
```

**Error responses:** `400 Invalid registration ID`, `401 Unauthorized` (bad callback token), `500`.

---

### 11. `GET /api/registrations/check-vanity`

**Auth:** None — publicly accessible.

**Purpose:** Checks whether a requested vanity bib number is still available for a given event and category. Returns the formatted bib string (e.g. `RD-042`) so the client can show a live preview before checkout.

**Query parameters:**

| Param          | Required | Description |
|----------------|----------|-------------|
| `eventId`      | Yes      | Convex event ID |
| `categoryId`   | Yes      | Category ID within the event |
| `vanityNumber` | Yes      | Raw numeric input from the user |

**Convex Functions Called:**
- `api.events.getById` (query) — to fetch the category's `raceNumberFormat` and the event's `vanityRaceNumber.maxDigits`

**Lib helpers called:**
- `formatBibNumber(format, paddedVanity)` — applies the category bib format template
- `isBibTaken(eventId, formattedBib)` — queries Convex registrations to check for conflicts

**Response (200):**
```json
{ "available": true, "formattedBib": "RD-042" }
```

**Error responses:** `400 Missing required parameters`, `500`.

---

## Environment Variables Summary

| Variable | Used By |
|----------|---------|
| `ANTHROPIC_API_KEY` | `/api/ai/*` routes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `/api/cloudinary/sign` |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | `/api/cloudinary/sign` |
| `CLOUDINARY_API_SECRET` | `/api/cloudinary/sign` |
| `XENDIT_SECRET_KEY` | `/api/payments/create-checkout`, `/api/payments/sync/[regId]` |
| `XENDIT_CALLBACK_TOKEN` | `/api/payments/webhook` |
| `NEXT_PUBLIC_BASE_URL` | `/api/payments/create-checkout` (redirect URLs) |
