# Manual Payment Mode — Design Spec

**Date:** 2026-03-30
**Status:** Approved

## Overview

Make the Xendit payment portal optional. Organizers can choose between automated payment (Xendit) or manual payment (direct bank/e-wallet transfer with proof of payment upload). For manual mode, runners upload proof of payment, and organizers verify each registration manually.

## Schema Changes

### `users` table — add `paymentMethods` to organizer object

```typescript
paymentMethods: v.optional(v.array(v.object({
  id: v.string(),
  type: v.union(v.literal("bank"), v.literal("ewallet"), v.literal("other")),
  label: v.string(),                    // e.g., "GCash", "BPI Savings"
  accountName: v.string(),
  accountNumber: v.string(),
  instructions: v.optional(v.string()), // optional notes for runners
  qrCodeStorageId: v.optional(v.string()), // Convex file storage ID
})))
```

### `events` table — add `paymentMode`

```typescript
paymentMode: v.optional(v.union(v.literal("portal"), v.literal("manual")))
// Defaults to "portal" for backward compatibility (existing events have no field)
```

### `registrations` table — add proof-of-payment fields

```typescript
proofOfPayment: v.optional(v.object({
  storageId: v.string(),     // Convex file storage ID
  uploadedAt: v.number(),
  url: v.string(),           // serving URL
})),
manualPaymentStatus: v.optional(
  v.union(
    v.literal("pending"),    // no proof uploaded yet
    v.literal("submitted"),  // proof uploaded, awaiting review
    v.literal("approved"),   // organizer approved
    v.literal("rejected"),   // organizer rejected, runner can re-upload
  )
),
reviewedAt: v.optional(v.number()),
reviewedBy: v.optional(v.id("users")),
```

## Event Creation Wizard — New Step Order

The payment mode step is inserted as Step 2, after Basic Info:

1. **Step 1: Basic Info** (unchanged)
2. **Step 2: Payment Mode** (NEW)
3. **Step 3: Images** (was Step 2)
4. **Step 4: Categories** (was Step 3)
5. **Step 5: Timeline** (was Step 4)
6. **Step 6: Features** (was Step 5)
7. **Step 7: Review** (was Step 6)

### Step 2: Payment Mode UI

- Two large selectable cards side by side
- **Payment Portal** card: credit card icon (orange), description: "Runners pay through a secure online checkout powered by Xendit. Payments are processed automatically and registrations are confirmed instantly." Badges: GCash, Cards, Bank transfer, Maya.
- **Manual Payment** card: upload icon (blue), description: "Runners pay you directly via bank transfer or e-wallet, then upload proof of payment. You review and confirm each registration manually." Badges: Bank transfer, E-wallet, QR code.
- Default selection: Payment Portal (backward compatible)
- If Manual is selected and organizer has no payment methods on their profile: show amber warning with link to profile settings
- Review step (Step 7) blocks publishing if `paymentMode === "manual"` and organizer has zero payment methods

## Organizer Profile — Payment Methods Management

New section on `/dashboard/settings` page, below the existing organizer profile form.

### Layout
- Header: "Payment methods" with subtitle "Runners will see these when you use manual payment mode."
- "Add" button (orange) in header
- 2-column responsive grid of horizontal cards
- Each card: QR thumbnail (64px) on the left, details on the right (label + type badge, account name, account number), edit/delete icon buttons top-right
- Cards without QR show a dashed placeholder
- Empty state: prompt to add first payment method

### Add/Edit Form Fields
- **Type** (required): Bank / E-wallet / Other — select dropdown
- **Label** (required): text input — e.g., "GCash", "BPI Savings"
- **Account name** (required): text input
- **Account number** (required): text input
- **QR code image** (optional): file upload to Convex storage
- **Instructions** (optional): textarea — notes shown to runners

### Mutations
- `users.addPaymentMethod(method)` — push to `paymentMethods` array
- `users.updatePaymentMethod(methodId, updates)` — update in place
- `users.deletePaymentMethod(methodId)` — remove from array

## Runner Registration Flow — Manual Payment Events

### During Registration

The existing 5-step registration form stays the same through Step 3 (Vanity). Changes at Step 4 (Review):

- Button text changes from "Pay ₱X" to "Submit Registration"
- No Xendit checkout is created
- Registration is created with:
  - `status: "pending"`
  - `manualPaymentStatus: "pending"`
  - `paymentStatus: "unpaid"`

### After Submission — Payment Instructions Page

Instead of redirecting to Xendit checkout, the runner lands on a payment instructions page:

- Shows all organizer payment methods as read-only cards (same horizontal layout as organizer settings, but without edit/delete)
- "Copy" button next to account numbers
- QR codes can be tapped to view full-size
- Upload proof of payment section with file picker (image upload)
- "Skip for now" option — runner can come back later

### My Registrations — Upload Later

- Pending manual registrations show a status banner based on `manualPaymentStatus`:
  - `pending`: "Upload your proof of payment" with upload button
  - `submitted`: "Payment submitted — waiting for organizer to verify"
  - `rejected`: "Payment was not verified. Please re-upload." with upload button
  - `approved`: Full race pass with QR code (same as Xendit paid)
- Runner can upload/re-upload proof from the registration detail view

### Mutations
- `registrations.uploadProofOfPayment(registrationId, storageId, url)` — sets `proofOfPayment` and flips `manualPaymentStatus` to "submitted"

## Organizer Verification Dashboard

New tab/section on the event registrations page for manual payment events.

### Layout
- Filter tabs with count badges: All, Awaiting proof, Submitted, Approved, Rejected
- Table columns: Runner (name + email), Category, Amount, Submitted (relative time), Status (badge), Actions (Approve/Reject buttons)
- Click row to expand: shows proof of payment image (click to enlarge) + full registration details grid
- Approve/Reject buttons inline on each row

### Approve Flow
1. Organizer clicks "Approve"
2. `manualPaymentStatus` → `approved`
3. `status` → `paid`, `paymentStatus` → `paid`, `paidAt` → now
4. `reviewedAt` → now, `reviewedBy` → organizer's user ID
5. Bib number generated (same logic as Xendit `markAsPaid`)
6. QR code generated (same logic as Xendit sync)

### Reject Flow
1. Organizer clicks "Reject"
2. `manualPaymentStatus` → `rejected`
3. `reviewedAt` → now, `reviewedBy` → organizer's user ID
4. Runner sees "rejected" state and can re-upload

### Mutations
- `registrations.approveManualPayment(registrationId)` — approve + generate bib/QR
- `registrations.rejectManualPayment(registrationId)` — reject

### Query
- `registrations.getManualPaymentRegistrations(eventId, statusFilter?)` — returns registrations for manual payment events with optional status filter

## Backward Compatibility

- Existing events have no `paymentMode` field — treated as `"portal"` everywhere
- Existing registrations have no `manualPaymentStatus` — unaffected
- Xendit flow is completely unchanged
- All new schema fields are `v.optional()`
- Free events (price = 0) skip both Xendit and manual payment — marked as paid immediately regardless of payment mode

## File Changes Summary

### New Files
- `components/forms/event/Step2PaymentMode.tsx` — payment mode selection step
- `components/forms/registration/PaymentInstructions.tsx` — post-registration payment methods display + proof upload
- `components/dashboard/PaymentMethodsManager.tsx` — organizer settings payment methods CRUD
- `components/dashboard/PendingPaymentsTable.tsx` — organizer verification table

### Modified Files
- `convex/schema.ts` — add fields to users, events, registrations tables
- `convex/users.ts` — add payment method mutations
- `convex/events.ts` — handle paymentMode in create/update
- `convex/registrations.ts` — add proof upload, approve, reject mutations + manual payment query
- `components/forms/event/EventForm.tsx` — insert Step 2, shift subsequent steps
- `components/forms/event/Step6Review.tsx` → `Step7Review.tsx` — add payment mode display + validation
- `components/forms/registration/Step4Review.tsx` — conditional button text and flow
- `components/forms/registration/RegistrationForm.tsx` — handle manual payment redirect
- `app/(marketing)/events/[id]/register/success/page.tsx` — handle manual payment post-submission
- `app/(app)/dashboard/settings/OrganizerProfileForm.tsx` — integrate PaymentMethodsManager
- `app/api/payments/create-checkout/route.ts` — skip Xendit for manual payment events
