# Stage 8: Proxy Registration (Register for Someone Else)

## Overview
Allow a logged-in user to register a **different person** for an event. The registering user becomes the "proxy" (or "registrant"), while the actual participant's details are entered manually. Both the user's dashboard and the organizer's manage-event view will distinguish proxy registrations from self-registrations.

---

## 8.1 — Data Model Changes

### `types/registration.ts`
Add new fields to the `Registration` interface:

```ts
// Who is performing the registration (always the logged-in user)
registeredByUserId: string;
registeredByName: string;

// Whether this is a proxy registration
isProxy: boolean;
```

> **Migration note:** Existing registrations don't have these fields. All code that reads registrations should treat missing `isProxy` as `false` and fallback `registeredByUserId` to `userId`.

### `types/user.ts`
No changes needed. The proxy registrant is already a `User`.

---

## 8.2 — Registration Form Updates

### 8.2.1 — New "Who's Running?" Step (Pre-Step or Step 0)

**File:** `components/forms/registration/RegistrationForm.tsx`

- Add a **new first step** before the current Step 1 (Category selection).
- The new step asks: **"Who is this registration for?"**
  - **Option A:** "Myself" — auto-fills `participantInfo` from the logged-in user's profile (current behavior).
  - **Option B:** "Someone Else" — clears the `participantInfo` fields so the user can type in the other person's details.
- Update the `STEPS` array: `["Who's Running", "Category", "Details", "Vanity", "Review"]`.
- Store the choice in form state (e.g. `registrationType: "self" | "proxy"`).

### 8.2.2 — Step 2 (Details) Adjustments

**File:** `components/forms/registration/Step2Details.tsx`

- If `registrationType === "proxy"`:
  - Show a banner: *"You are registering someone else. Enter the participant's details below."*
  - **Do NOT** auto-fill from the user's profile.
  - All participant fields remain required (name, email, phone, sizes, emergency contact).
- If `registrationType === "self"`:
  - Keep current auto-fill behavior.

### 8.2.3 — Step 4 (Review) Badge

**File:** `components/forms/registration/Step4Review.tsx`

- If proxy, show a highlighted info badge:
  - *"Proxy Registration — Registered by [Your Name]"*

### 8.2.4 — Validation Schema

**File:** `lib/validations/registration.ts`

- Add `registrationType` field: `z.enum(["self", "proxy"])`.
- All `participantInfo` validations remain the same (they're always required regardless of self/proxy).

---

## 8.3 — API / Submission Changes

### `app/api/payments/create-checkout/route.ts` (or equivalent)

- When creating the registration document in Firestore, include:
  ```ts
  registeredByUserId: currentUser.uid,
  registeredByName: currentUser.displayName,
  isProxy: data.registrationType === "proxy",
  ```
- The `userId` field should still be set to the **logged-in user's** UID (the proxy registrant owns the registration).

---

## 8.4 — Runner Dashboard: "My Registrations" Section

### `app/(app)/dashboard/page.tsx`

Currently, the dashboard fetches registrations with `userId === currentUser.uid`. This will **already capture proxy registrations** because we keep `userId` as the logged-in user.

**UI Changes:**
- On each registration card in the "My Registered Events" list, check if `isProxy === true`.
  - If yes, show a small badge/label: `👤 Registered for: [participant name]`
  - If no, keep current display (no extra label).

### Optional: "Registered Participants" Sub-Section
- Add a new section or tab on the dashboard: **"Participants You Registered"**
- Query: `registrations where registeredByUserId === currentUser.uid AND isProxy === true`
- Display a compact list showing:
  - Participant name
  - Event name
  - Registration status
  - Link to event details

---

## 8.5 — Organizer: Manage Event Participants Table

### `app/(app)/dashboard/events/[id]/page.tsx`

In the participants table, add a new visual indicator for proxy-registered participants:

- **New column or inline badge** next to the runner's name:
  - If `isProxy === true`, show a small tag: `Registered by [registeredByName]`
  - Use a distinct badge color (e.g., a subtle indigo/purple badge).
- The participant name shown should still be `participantInfo.name` (the actual runner).

---

## 8.6 — Registration Service Updates

### `lib/services/registrationService.ts`

- Add a new query helper:
  ```ts
  export async function getProxyRegistrations(userId: string) {
      // Fetch registrations where registeredByUserId === userId AND isProxy === true
  }
  ```
- This will be used by the dashboard to show the "Participants You Registered" section.

> **Firestore Index:** May need a composite index on `registeredByUserId` + `isProxy` + `createdAt`.

---

## Verification Plan

### Manual Testing
1. **Self-registration flow:** Register for an event as yourself → confirm form auto-fills from profile → submit → verify dashboard shows registration without proxy badge → verify manage events shows no proxy badge.
2. **Proxy registration flow:** Register for an event as "Someone Else" → confirm form fields are empty → fill in different person's details → submit → verify dashboard shows "`Registered for: [name]`" badge → verify manage events shows "`Registered by [your name]`" badge.
3. **Dashboard tracking:** After multiple proxy registrations, check that all proxy participants appear in the dashboard.
4. **Organizer view:** As an organizer, open manage event → verify proxy participants have the visual marker.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `types/registration.ts` | Add `registeredByUserId`, `registeredByName`, `isProxy` fields |
| `lib/validations/registration.ts` | Add `registrationType` field |
| `components/forms/registration/RegistrationForm.tsx` | Add "Who's Running" step, update step navigation |
| `components/forms/registration/Step2Details.tsx` | Conditional auto-fill, proxy banner |
| `components/forms/registration/Step4Review.tsx` | Proxy badge in review |
| `app/api/payments/create-checkout/route.ts` | Include proxy fields in Firestore doc |
| `app/(app)/dashboard/page.tsx` | Show proxy badge on registration cards, optional new section |
| `app/(app)/dashboard/events/[id]/page.tsx` | Proxy badge in participants table |
| `lib/services/registrationService.ts` | Add `getProxyRegistrations()` helper |
