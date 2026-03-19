# Xendit Payment Integration Reference

## 1. Payment Flow Overview

```
RegistrationForm
    |
    | POST /api/payments/create-checkout
    |   - Validates event, category, price, capacity, duplicate checks
    |   - Creates registration in Convex (status: "pending")
    |   - Creates Xendit invoice
    |   - Stores xenditInvoiceId + xenditInvoiceUrl on registration
    |
    v
Xendit Hosted Invoice Page (invoice_url)
    |
    | User pays (or abandons / card declined)
    |
    +--[success]--> POST /api/payments/webhook (x-callback-token verified)
    |                   - Generates bib number + QR code
    |                   - Calls registrations.markAsPaid (status: "paid")
    |                   - Xendit redirects to /events/[id]/register/success?id=[regId]
    |
    +--[failure]--> Xendit redirects to /events/[id]/register/failed?id=[regId]

Success page polls GET /api/payments/sync/[regId] every 3 seconds
until registration.status === "paid" (max 60 attempts / ~3 minutes).
```

**Special case — free registrations:** When `totalAmount <= 0`, the checkout
API skips Xendit entirely, calls `markAsPaid` with `paymentStatus: "free"`,
and returns `{ free: true }`. The form then routes directly to the success page.

---

## 2. Checkout Creation

**Route:** `POST /api/payments/create-checkout`

**Auth:** Requires a valid Clerk session. The route calls `clerkAuth()` and
exchanges the session token for a Convex token to authenticate downstream
`fetchQuery` / `fetchMutation` calls.

### Request body

```json
{
  "registrationData": {
    "eventId": "<Convex event ID>",
    "categoryId": "<string>",
    "userId": "<Convex user ID>",
    "registeredByUserId": "<Convex user ID>",
    "registeredByName": "<string>",
    "isProxy": false,
    "basePrice": 500,
    "vanityNumber": null,
    "participantInfo": {
      "name": "Juan dela Cruz",
      "email": "juan@example.com",
      "phone": "+639171234567"
    }
    // ...all other form fields
  },
  "eventName": "BGC Night Run 2026",
  "categoryName": "10K"
}
```

### Server-side validation sequence

1. Resolve Convex `userId` from the Clerk session.
2. **Duplicate paid check** — blocks if the user already has a `paid`
   registration for the same event + category (`checkExisting` query). Proxy
   registrations are exempt.
3. **Rapid pending check** — blocks if a `pending` registration for the same
   event + category was created within the last 60 seconds (`checkPending`
   query). Prevents duplicate submissions from form double-fires.
4. **Registration deadline** — calls `isRegistrationClosed(eventData)`.
5. **Category existence** — verifies the `categoryId` exists on the event.
6. **Capacity check** — calls `isCategoryFull(category)`.
7. **Price verification** — recomputes `expectedBasePrice` via
   `getEffectivePrice(eventData, category)` (handles early-bird pricing
   server-side). Rejects if `|expected - sent| > 1` (±₱1 tolerance for
   rounding).
8. **Vanity premium** — validated server-side against
   `eventData.vanityRaceNumber.premiumPrice`. Client-supplied vanity premium
   values are ignored.

### Xendit invoice creation

```
POST https://api.xendit.co/v2/invoices
Authorization: Basic base64(XENDIT_SECRET_KEY:)
```

Key invoice fields:

| Field | Value |
|---|---|
| `external_id` | Convex `registrationId` — used to correlate the webhook |
| `amount` | `expectedBasePrice + vanityPremium` (integer, PHP) |
| `currency` | `"PHP"` |
| `invoice_duration` | `86400` seconds (24 hours) |
| `success_redirect_url` | `/events/[eventId]/register/success?id=[regId]` |
| `failure_redirect_url` | `/events/[eventId]/register/failed?id=[regId]` |
| `items` | Base fee line item + optional vanity number line item |
| `customer.given_names` | Participant name |
| `customer.email` | Participant email |
| `customer.mobile_number` | Participant phone (omitted if blank) |

### Convex mutations called

| Order | Mutation | Purpose |
|---|---|---|
| 1 | `registrations.create` | Creates registration with `status: "pending"` |
| 2 | `registrations.updatePaymentInfo` | Stores `xenditInvoiceId` + `xenditInvoiceUrl` |

### Response

```json
// Paid flow
{ "checkoutUrl": "https://checkout.xendit.co/...", "registrationId": "<regId>" }

// Free flow
{ "checkoutUrl": null, "registrationId": "<regId>", "free": true }
```

---

## 3. Webhook Handling

**Route:** `POST /api/payments/webhook`

**Auth:** Xendit sends the `x-callback-token` header. The route rejects any
request where the header does not exactly match `XENDIT_CALLBACK_TOKEN`.
There is no route-level authentication beyond this token check.

### Payload

Xendit posts the full invoice object. The route only acts on `status === "PAID"`
or `status === "SETTLED"`.

```json
{
  "external_id": "<registrationId>",
  "status": "PAID",
  ...
}
```

### On PAID / SETTLED

1. Fetch the registration from Convex via `registrations.getById`.
2. **Idempotency guard** — if `regData.status === "paid"`, return `200` immediately.
3. **Bib and QR generation** — calls `generateBibAndQR(registrationId, eventId,
   categoryId, participantName, vanityNumber)`.
   - If the vanity number is already taken (conflict error), falls back to
     sequential bib assignment by retrying with `vanityNumber = null`.
4. Call `registrations.markAsPaid` with `paymentStatus: "paid"`, `raceNumber`,
   and `qrCodeUrl`.

### `registrations.markAsPaid` state guard

The mutation enforces:
- If `totalPrice > 0`, a `xenditInvoiceId` must already be present (set by
  `updatePaymentInfo`). This prevents the webhook from marking a registration
  paid if checkout was never properly initiated.
- If `status === "paid"`, the mutation is a no-op (idempotent).

### On failed / expired / other statuses

The webhook handler takes no action. The registration remains `pending`. The
`failure_redirect_url` redirects the user to the failed page, but no Convex
mutation is called on failure.

> **Note:** There is currently no mutation that transitions a registration to
> `cancelled`. Failed and expired invoices leave the registration in `pending`
> indefinitely unless the user retries and completes a new checkout.

---

## 4. Payment Sync

**Route:** `GET /api/payments/sync/[regId]`

**Auth:** Requires a valid Clerk session (`clerkAuth()`). Returns `401` if
unauthenticated.

**Purpose:** Manual status reconciliation for cases where the webhook fires
before Convex has propagated the update to the success page, or when the
webhook is delayed.

### Logic

1. Fetch registration from Convex.
2. If already `paid`, return `{ status: "paid", raceNumber }` immediately.
3. Query Xendit: `GET https://api.xendit.co/v2/invoices?external_id=[regId]`.
4. If Xendit reports `PAID` or `SETTLED`:
   - Generate bib and QR (same vanity fallback logic as webhook).
   - Call `registrations.markAsPaid`.
   - Return `{ status: "paid", raceNumber }`.
5. Otherwise, return `{ status: "<xendit_status_lowercased>" }`.

The success page calls this endpoint every **3 seconds**, up to **60 attempts**
(~3 minutes total). After 20 failed attempts (~60 seconds), a "taking longer
than expected" message is shown. The polling stops either when the registration
transitions to `paid` (Convex reactivity updates the UI via `useQuery`) or when
the attempt limit is reached.

---

## 5. Registration Status Transitions

```
[form submitted]
      |
      v
  "pending"  <-- created by registrations.create
      |
      +--[webhook PAID/SETTLED or sync confirms paid]--> "paid"
      |
      +--[payment abandoned / invoice expired]---------> remains "pending"
                                                         (no automated cleanup)
```

There is currently no `cancelled` status. A future cancellation or refund flow
would need to add a `cancelled` state and decrement the category
`registeredCount`.

The `registeredCount` on the event category is only incremented inside
`markAsPaid` — it is never decremented.

---

## 6. Environment Variables

| Variable | Where used | Purpose |
|---|---|---|
| `XENDIT_SECRET_KEY` | `create-checkout`, `sync` | API key for Xendit REST calls (Basic auth, colon-terminated) |
| `XENDIT_PUBLIC_KEY` | Client-side (if used) | Public key — not currently used in server routes |
| `XENDIT_CALLBACK_TOKEN` | `webhook` | Shared secret validated against the `x-callback-token` header |
| `NEXT_PUBLIC_BASE_URL` | `create-checkout` | Base URL for building redirect URLs; falls back to `origin` header, then `http://localhost:3000` |

---

## 7. Success and Failure Pages

### Success page — `/events/[id]/register/success`

**Route:** `app/(marketing)/events/[id]/register/success/page.tsx`

Receives `?id=[registrationId]` as a query parameter.

The page subscribes to the registration via `useQuery(api.registrations.getById)`.
While the registration status is `"pending"`, it:

- Polls `GET /api/payments/sync/[regId]` every 3 seconds (up to 60 attempts).
- Shows a skeleton loading state and a pulsing QR placeholder.
- Displays "Allocating Bib Number..." in place of the QR code.
- Disables the "Download Race Pass" button.

Once the status transitions to `"paid"` (via Convex real-time reactivity):

- Displays the race ticket with the participant's name, race number, QR code,
  event date, location, category, and gun start time.
- Enables the "Download Race Pass" button (triggers `window.print()`).
- Shows links to the athlete dashboard and the event detail page.

After 20 polling attempts (~60 seconds) without confirmation, a warning
message appears: "Payment verification is taking longer than expected. Please
refresh the page."

### Failure page — `/events/[id]/register/failed`

**Route:** `app/(marketing)/events/[id]/register/failed/page.tsx`

Receives `?id=[registrationId]` and optionally `?error=[message]` as query
parameters.

Displays:
- The `error` query param value, or falls back to "Transaction Cancelled or
  Declined".
- Common troubleshooting notes (insufficient funds, card restrictions, network
  issues).
- A "Try Again" button that links back to `/events/[id]/register`.
- Secondary links to `/support` and the event detail page.

No Convex mutations are called from this page. The registration remains
`pending` and the user must restart the checkout flow to try again.
