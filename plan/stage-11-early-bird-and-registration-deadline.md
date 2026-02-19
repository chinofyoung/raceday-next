# Stage 11: Early Bird Promo & Registration End Date

## Overview

Two features that affect event creation, the public event detail page, and the registration flow:

1. **Early Bird Promo** — Organizers can optionally offer a discounted rate per category within a promo date range.
2. **Registration End Date** — A hard cutoff date after which registrations are no longer accepted.

---

## Feature 1: Early Bird Promo

### How It Works

- When creating/editing an event, the organizer can toggle **"Enable Early Bird Promo"**.
- When enabled, a **date range picker** appears for the promo period (start date & end date).
- For **each category**, an additional input appears: **"Early Bird Price"** (must be less than the regular price).
- During registration, the system checks if today falls within the early bird date range:
  - **Yes →** Use the early bird price as the base price.
  - **No →** Use the regular price.
- The public event detail page and event cards should show the early bird price (e.g. strikethrough on regular price + early bird price highlighted) when the promo is active.

### Data Model Changes

#### `types/event.ts`

Add to `RaceEvent`:
```ts
earlyBird?: {
    enabled: boolean;
    startDate: Timestamp | Date;
    endDate: Timestamp | Date;
};
```

Add to `EventCategory`:
```ts
earlyBirdPrice?: number;  // Discounted price during early bird period
```

### Validation Changes

#### `lib/validations/event.ts`

- Add `earlyBird` to `eventSchema` (optional object, required fields when enabled).
- Add `earlyBirdPrice` to `eventCategorySchema` (optional number, must be ≥ 0 and < regular price when early bird is enabled).
- Add cross-field validation: if `earlyBird.enabled` is true, every category must have an `earlyBirdPrice`.

### UI Changes

#### Event Creation Form (`components/forms/event/`)

- **New Step or within Step3Categories**: Add an "Early Bird" toggle at the top of the categories step.
  - When toggled on, show a date range picker for `earlyBird.startDate` and `earlyBird.endDate`.
  - For each category card, show an additional "Early Bird Price" input below the regular price.
- **Step6Review**: Show early bird settings summary.

#### Event Detail Page (`components/event/EventDetailClient.tsx`)

- In the **Categories tab**, when early bird is active:
  - Show regular price with a ~~strikethrough~~.
  - Show early bird price highlighted (e.g. green badge or tag).
  - Show remaining days until early bird ends.

#### Event Card (`components/events/EventCard.tsx`)

- When early bird is active, show the early bird price range instead of (or alongside) the regular price.

### Registration Flow Changes

#### `components/forms/registration/Step1Category.tsx`

- Display the early bird price when applicable.
- Show both prices for clarity (regular + early bird).

#### `components/forms/registration/RegistrationForm.tsx`

- Compute `basePrice` using early bird price when today is within the promo range.

#### `components/forms/registration/Step4Review.tsx`

- Show which price was applied (early bird vs. regular) in the review.

#### `app/api/payments/create-checkout/route.ts`

- Server-side validation: re-check the early bird date range and apply the correct price. Never trust the client-sent price.

### Utility

#### `lib/earlyBirdUtils.ts` (NEW)

```ts
export function isEarlyBirdActive(event: RaceEvent): boolean
export function getEffectivePrice(event: RaceEvent, category: EventCategory): number
export function getEarlyBirdDaysRemaining(event: RaceEvent): number | null
```

---

## Feature 2: Registration End Date

### How It Works

- When creating/editing an event, the organizer sets a **"Registration End Date"**.
- After this date, the "Register" button is disabled/hidden on both the event detail page and event card.
- A message like "Registration closed" is shown instead.
- The server also rejects any registration attempts after this date.

### Data Model Changes

#### `types/event.ts`

Add to `RaceEvent`:
```ts
registrationEndDate: Timestamp | Date;
```

### Validation Changes

#### `lib/validations/event.ts`

- Add `registrationEndDate` to `eventSchema` (required date, must be before the event date).

### UI Changes

#### Event Creation Form (`components/forms/event/`)

- **Step1BasicInfo** (or wherever the event date is set): Add a "Registration End Date" date picker. Default suggestion = 1 week before event date.

#### Event Detail Page (`components/event/EventDetailClient.tsx`)

- Show registration end date info.
- When past the deadline:
  - Disable or hide the "Register Now" button.
  - Show "Registration Closed" message/badge.
- When nearing deadline (e.g. ≤ 3 days):
  - Show a "Closing Soon" urgency banner.

#### Event Card (`components/events/EventCard.tsx`)

- Show a "Registration Closed" badge when past the deadline.
- Optionally show "X days left to register" when nearing deadline.

#### Registration Page (`app/(app)/events/[id]/register/page.tsx`)

- Server-side check: if past `registrationEndDate`, redirect to event page or show a "Registration Closed" message instead of loading the form.

#### `app/api/payments/create-checkout/route.ts`

- Server-side validation: reject registration if current date > `registrationEndDate`.

---

## Files to Create / Modify Summary

| File | Action | Notes |
|------|--------|-------|
| `types/event.ts` | MODIFY | Add `earlyBird`, `earlyBirdPrice`, `registrationEndDate` |
| `lib/validations/event.ts` | MODIFY | Add validation for new fields |
| `lib/earlyBirdUtils.ts` | NEW | Helper functions for early bird logic |
| `components/forms/event/Step1BasicInfo.tsx` | MODIFY | Add registration end date picker |
| `components/forms/event/Step3Categories.tsx` | MODIFY | Add early bird toggle + per-category early bird price |
| `components/forms/event/Step6Review.tsx` | MODIFY | Show early bird & reg end date in review |
| `components/forms/event/EventForm.tsx` | MODIFY | Add defaults for new fields |
| `components/event/EventDetailClient.tsx` | MODIFY | Show early bird pricing & registration status |
| `components/events/EventCard.tsx` | MODIFY | Show early bird price & registration closed badge |
| `components/forms/registration/Step1Category.tsx` | MODIFY | Show early bird pricing |
| `components/forms/registration/RegistrationForm.tsx` | MODIFY | Compute correct base price |
| `components/forms/registration/Step4Review.tsx` | MODIFY | Show which price tier is applied |
| `app/api/payments/create-checkout/route.ts` | MODIFY | Server-side price & deadline validation |
| `app/(app)/events/[id]/register/page.tsx` | MODIFY | Block registration past deadline |

---

## Implementation Order

1. Data model & validation changes (`types/event.ts`, `lib/validations/event.ts`)
2. Utility functions (`lib/earlyBirdUtils.ts`)
3. Event creation form updates (Step1, Step3, Step6, EventForm)
4. Public-facing display (EventDetailClient, EventCard)
5. Registration flow (Step1Category, RegistrationForm, Step4Review)
6. Server-side validation (create-checkout API, register page)
