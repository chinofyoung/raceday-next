# RaceDay — Full Code Review
**Date:** 2026-02-20
**Reviewer:** Claude Code (Sonnet 4.6)
**Scope:** Full codebase audit — performance, security, UX, type safety, architecture

---

## Executive Summary

RaceDay is a well-structured Next.js 16 / React 19 app with a solid feature set (multi-step event creation, Xendit payments, Firebase Auth + Firestore, AI-assisted copy writing, QR bib generation). The code is clean and readable overall. However, there are **critical security vulnerabilities** (unauthenticated webhook, no rate limiting on the AI endpoint), **performance regressions** (form-level over-subscribing, overfetching Firestore), and several **UX gaps** (silent failures, client-only auth guard, race condition in bib assignment).

Issues are grouped by severity: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low/Polish.

---

## 🔴 CRITICAL — Fix Immediately

### 1. Xendit Webhook Has No Authentication
**File:** `app/api/payments/webhook/route.ts:17`

The callback-token verification is **commented out**. Any external actor can POST to `/api/payments/webhook` with a fake `PAID` body and mark any registration as paid without ever paying.

```ts
// Current — INSECURE
// const token = req.headers.get("x-callback-token");
// if (token !== process.env.XENDIT_CALLBACK_TOKEN) { ... }
```

**Fix:** Uncomment and enforce the `x-callback-token` header check. Store the token in `.env.local` and verify it on every webhook call. Return `401` if the token is missing or wrong.

---

### 2. Race Condition in Bib Number Generation
**File:** `lib/bibUtils.ts:33-41`

The sequential bib number is derived by counting existing paid registrations and adding 1. Two simultaneous payments (very likely for popular events) will read the same count and issue the same bib number.

```ts
// Reads count, then adds 1 — NOT atomic
const existingSnap = await getDocs(query(..., where("status", "==", "paid")));
bibNumber = String(existingSnap.size + 1).padStart(3, "0");
```

**Fix:** Use a Firestore **transaction** or a **dedicated counter document** per event+category (using `increment(1)`) to guarantee atomic incrementing. Firestore's `FieldValue.increment` is the correct tool here.

---

### 3. AI Endpoint Has No Authentication or Rate Limiting
**File:** `app/api/ai/event-suggest/route.ts`

Any unauthenticated user (or automated bot) can call `/api/ai/event-suggest` unlimited times, burning your Anthropic API credits with no cap.

**Fix:**
- Verify the user's Firebase ID token in the request headers before calling Claude.
- Add a simple in-memory rate limiter (or use Upstash/Redis) per IP or user UID.
- Consider moving the `anthropic` client creation outside the function to ensure it's a true singleton (it currently is module-level, which is good).

---

### 4. Production `console.log` Leaks Payment Data
**File:** `app/api/payments/create-checkout/route.ts:136-148`

Two `console.log` statements dump full Xendit invoice data and API responses — including customer email, amount, and invoice URLs — to server logs in production.

```ts
console.log("Xendit Invoice Data:", JSON.stringify(invoiceData, null, 2));
console.log("Xendit API Raw Result:", JSON.stringify(result, null, 2));
```

**Fix:** Remove or gate these logs behind a `process.env.NODE_ENV === "development"` check.

---

## 🟠 HIGH — Performance & Correctness

### 5. `watch()` Without Selector Causes Full-Form Re-renders
**File:** `components/forms/event/EventForm.tsx:67`

```ts
const values = watch(); // ⚠️ subscribes to ALL form fields
```

Every keystroke anywhere in the 6-step form re-renders the entire `EventForm` component (including the progress header computation at lines 169-176) because it watches all values. With large category arrays this is expensive.

**Fix:** Replace with `useWatch` for only the specific fields needed in the progress header:
```ts
// Only subscribe to the fields used in isAccomplished checks
const [name, description, date, featuredImage, categories, timeline, vanityRaceNumber] =
  useWatch({ control, name: ["name", "description", "date", "featuredImage", "categories", "timeline", "vanityRaceNumber"] });
```

---

### 6. Triple `useFormContext` Calls in `Step3Categories`
**File:** `components/forms/event/Step3Categories.tsx:16-22, 59, 74`

`useFormContext` is called **three separate times** in the same component — once for destructuring, once for `isEarlyBirdEnabled`, and once for the `register` call on the checkbox.

```ts
// Line 16
const { control, formState: { errors } } = useFormContext<EventFormValues>();
// Line 22 — second call!
const isEarlyBirdEnabled = useFormContext<EventFormValues>().watch("earlyBird.enabled");
// Line 59 — third call!
{...useFormContext<EventFormValues>().register("earlyBird.enabled")}
```

**Fix:** Call `useFormContext` once and destructure everything needed, then use `useWatch` for reactive values:
```ts
const { control, register, formState: { errors } } = useFormContext<EventFormValues>();
const isEarlyBirdEnabled = useWatch({ control, name: "earlyBird.enabled" });
```

---

### 7. Organizer Dashboard Overfetches Firestore
**File:** `app/(app)/dashboard/page.tsx:39-48`

```ts
// Fetches up to 100 events AND 1000 paid registrations from ALL organizers
const [eventsResult, regsResult] = await Promise.all([
    getEvents({ organizerId: user?.uid, limitCount: 100, status: "all" }),
    getRegistrations({ status: "paid", limitCount: 1000 }) // No organizerId filter!
]);
// Then client-side filters registrations
const myRegs = regsResult.items.filter((r: any) => myEventsIds.includes(r.eventId));
```

The registrations query fetches 1000 docs from ALL organizers, then discards non-matching ones in JavaScript.

**Fix:** Either:
- Store `organizerId` on registration documents and query `where("organizerId", "==", userId)`
- Or use the `statsService` to maintain denormalized counters per event (already in `lib/services/statsService.ts`)
- Reduce `limitCount` to what the UI actually shows (3 items shown, not 1000)

---

### 8. Auth Guard is Client-Side Only — No Middleware
**File:** `app/(app)/layout.tsx:14-18`

Auth protection redirects happen inside a `useEffect` — the server renders the page structure first, then the client checks auth. This causes a flash of the loading spinner (or worse, briefly exposes protected content) and is not truly secure at the server level.

```ts
// Redirect happens AFTER hydration
useEffect(() => {
    if (!loading && !firebaseUser) {
        router.push(`/auth/login?redirect=${pathname}`);
    }
}, [firebaseUser, loading, router, pathname]);
```

**Fix:** Add a `middleware.ts` at the root using Next.js Middleware to check for the Firebase session cookie and redirect unauthenticated requests server-side before any page renders. Firebase Admin SDK can be used for token verification.

---

### 9. Unthrottled Scroll Event Listener in Navbar
**File:** `components/layout/Navbar.tsx:31-35`

The scroll listener fires on every single scroll tick with no throttling or `passive` flag:
```ts
window.addEventListener("scroll", handleScroll); // fires 60+ times/sec
```

**Fix:**
```ts
window.addEventListener("scroll", handleScroll, { passive: true });
```
This alone is a meaningful improvement. For further optimization, throttle with `requestAnimationFrame` or a 100ms debounce.

---

### 10. `usePaginatedQuery` Has Unstable Dependency
**File:** `lib/hooks/usePaginatedQuery.ts:44, 49-51`

The `loadMore` callback depends on `fetchFn` in its dependency array. If callers pass an inline function (e.g., `() => getEvents({...})`), `fetchFn` will be a new reference on every parent render, causing the effect to loop.

```ts
// The initial useEffect with empty deps calls refresh, but refresh/loadMore
// will be re-created if the parent re-renders, potentially causing loops
useEffect(() => {
    refresh();
}, []); // eslint warning suppressed
```

**Fix:** Accept a stable `fetchFn` (e.g., wrapped in `useCallback` at the call site), or refactor to a `useRef` pattern for the fetch function.

---

### 11. `EditEventPage` Bypasses the Service Layer
**File:** `app/(app)/dashboard/events/[id]/edit/page.tsx:8-9, 33-36`

This page directly imports `doc, getDoc` from Firebase and `db` from config, bypassing `eventService.getEventById`. This creates an inconsistent abstraction and duplicates data-fetching logic.

```ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
// ...
const docRef = doc(db, "events", id as string);
const snap = await getDoc(docRef);
```

**Fix:** Use `getEventById(id as string)` from `@/lib/services/eventService`, which already handles this exact case.

---

### 12. `saveDraft` Not Memoized
**File:** `components/forms/event/EventForm.tsx:95`

`saveDraft` is a complex async function re-created on every render of `EventForm`. Since `EventForm` re-renders on every keystroke (see issue #5), this is doubly expensive.

**Fix:** Wrap in `useCallback`:
```ts
const saveDraft = useCallback(async () => { ... }, [user, draftId, methods]);
```

---

## 🟡 MEDIUM — UX & Developer Experience

### 13. Silent Failure on Publish
**File:** `components/forms/event/EventForm.tsx:153-157`

The `onSubmit` catch block swallows errors silently — no toast, no user feedback:
```ts
} catch (e) {
    console.error("Error publishing event:", e);
    // User sees nothing — form just stops loading
}
```

**Fix:** Add `toast.error("Failed to publish event. Please try again.", { description: e.message })` in the catch block.

---

### 14. `AuthProvider` Uses Real-time Listener for Rarely-Changing Data
**File:** `components/providers/AuthProvider.tsx:48`

`onSnapshot` keeps an open WebSocket to Firestore for every active session. User profile data (role, displayName, photoURL) almost never changes mid-session. This consumes Firestore listener quota and bandwidth unnecessarily.

**Fix:** Use `getDoc` for initial load, then only re-fetch on explicit actions (e.g., after profile edit). Reserve `onSnapshot` for data that truly changes in real time (e.g., live registrations count on event page).

---

### 15. Type Safety — `initialData: any` and `as any` Casts
**Files:** `EventForm.tsx:35, 47, 117`

```ts
interface EventFormProps {
    initialData?: any; // ← untyped
}
// ...
resolver: zodResolver(eventSchema) as any, // ← suppresses type error
// ...
<EventForm initialData={eventData as any} isEditing /> // ← suppresses type error
```

The resolver cast exists because the form's date fields use string representations (`"YYYY-MM-DD"`) instead of `Date` objects, which conflicts with Zod's `z.coerce.date()` schema. This is a real type mismatch being hidden.

**Fix:** Either define a separate `EventFormInput` type that uses `string` for dates (and validate/coerce before saving), or normalize the data upstream before passing to the form so types align.

---

### 16. `toDate` Utility Duplicated
**Files:** `lib/utils.ts:11`, `lib/earlyBirdUtils.ts:72`

The `toDate()` helper that converts Firebase Timestamps, Date objects, and strings into a `Date` is implemented twice — once in `lib/utils.ts` and once as a private function in `lib/earlyBirdUtils.ts`. They have slightly different signatures.

**Fix:** Export the one in `lib/utils.ts` and import it in `lib/earlyBirdUtils.ts`.

---

### 17. Missing Empty State / Error State on Dashboard Data Fetch Failure
**File:** `app/(app)/dashboard/page.tsx:71-73`

If `fetchDashboardData` throws, the component sets `loading: false` but leaves `items: []` and `stats` at zero — silently showing "no events" without indicating that a network error occurred.

**Fix:** Add an `error` state and render a retry button + error message when it's set.

---

### 18. Dashboard Profile Completion Shows Stale Data
**File:** `app/(app)/dashboard/page.tsx:25`

```ts
const completion = user?.profileCompletion || 0;
```

`profileCompletion` is a manually-tracked number stored in Firestore, not computed from actual field completeness. If fields are updated without recalculating this number, the progress ring is stale.

**Fix:** Compute `profileCompletion` dynamically from the user object fields at display time, or ensure `userService.updateProfile` always recalculates and saves the value atomically.

---

### 19. `CategoryItem` Local State for `inclusionsText` May Desync
**File:** `components/forms/event/Step3Categories.tsx:132-136`

`inclusionsText` is initialized from `field.inclusions` on mount but is a separate local state that only syncs back to the form `onBlur`. If the form's category is reset or the AI suggestions populate categories, the local textarea will show stale data.

**Fix:** Use `watch(`categories.${index}.inclusions`)` as a controlled value, or switch to a fully controlled approach using `Controller` from react-hook-form.

---

### 20. Mobile Menu Stays Open on Navigation
**File:** `components/layout/Navbar.tsx:124-189`

The mobile nav is only closed explicitly (`onClick={() => setIsOpen(false)}`), which means if a user navigates via back/forward browser buttons or via a programmatic `router.push`, the mobile menu stays open.

**Fix:** Add a `useEffect` watching `pathname` to close the menu:
```ts
useEffect(() => { setIsOpen(false); }, [pathname]);
```

---

### 21. Free Registration Generates QR Code Twice
**File:** `app/api/payments/create-checkout/route.ts:53-80`

For free registrations, `generateBibAndQR` is called twice — once with a temporary `"temp-id"` and once again with the real Firestore doc ID. This doubles the QR generation work (Cloudinary upload × 2).

**Fix:** Generate the registration doc first, then call `generateBibAndQR` once with the real ID, then update the doc with the result.

---

## 🟢 LOW / Polish

### 22. `leaflet` & `react-leaflet` Loaded Eagerly
**File:** `package.json` + `components/shared/RouteMapViewer.tsx`

The Leaflet bundle (~150KB gzipped) is imported directly. This is loaded even for users who never view a route map.

**Fix:** Use `next/dynamic` with `ssr: false`:
```ts
const RouteMapViewer = dynamic(
  () => import("@/components/shared/RouteMapViewer"),
  { ssr: false, loading: () => <MapSkeleton /> }
);
```

---

### 23. `recharts` Not Dynamically Imported
**File:** `package.json` + admin analytics pages

`recharts` is a large charting library. If it's used only in admin analytics pages, it should be dynamic-imported per page rather than bundled globally.

**Fix:** Apply `next/dynamic` in admin chart pages.

---

### 24. `html5-qrcode` Should Be Dynamically Imported
**File:** `package.json`

The QR scanner library is likely only used on the scanner page. It should be lazy-loaded:
```ts
const Html5QrcodeScanner = dynamic(() => import("html5-qrcode").then(m => m.Html5QrcodeScanner), { ssr: false });
```

---

### 25. `uuid` on Client — Unnecessary Bundle Weight
**File:** `components/forms/event/Step3Categories.tsx:10`

`uuid` adds ~4KB to client bundles. Since the IDs only need to be unique per session, `crypto.randomUUID()` is available natively in all modern browsers and on Node.js 14.17+.

**Fix:**
```ts
// Replace: import { v4 as uuidv4 } from "uuid";
const id = crypto.randomUUID();
```

---

### 26. `date-fns` Partial Import
**File:** `app/(app)/dashboard/page.tsx:15`

```ts
import { format } from "date-fns";
```

`date-fns` v4 is tree-shakeable, but double-check that `tsconfig.json` has `"moduleResolution": "bundler"` or `"node16"` to ensure proper tree-shaking.

---

### 27. `next.config.ts` Missing Security Headers
**File:** `next.config.ts`

The config only sets `images.remotePatterns`. Production apps benefit from CSP, HSTS, X-Frame-Options, and Referrer-Policy headers.

**Fix:** Add a `headers()` async function returning security headers:
```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]
  }];
}
```

---

### 28. Missing `og-image.png`
**File:** `app/layout.tsx:21`

The Open Graph image is referenced as `/og-image.png`, but this file doesn't appear to exist in the `/public` directory. Social link previews will be broken.

---

### 29. Webhook Has No Idempotency Guard
**File:** `app/api/payments/webhook/route.ts`

Xendit may retry webhook calls on failure. The current implementation will re-generate a bib number and re-upload a QR code on every call for the same registration, potentially wasting resources and overwriting data.

**Fix:** Check if `regData.status === "paid"` before processing; if already paid, return `200` immediately (idempotent response).

---

### 30. Missing `aria-label` on Icon-Only Buttons
**Files:** `Navbar.tsx:101`, `Step3Categories.tsx:154-161`

Icon-only buttons (sign out, remove category) lack `aria-label` attributes, making them inaccessible to screen readers.

```tsx
// Missing accessibility
<button onClick={handleSignOut} title="Sign Out">
  <LogOut size={18} />
</button>
// Fix:
<button onClick={handleSignOut} aria-label="Sign Out" title="Sign Out">
```

---

## Recommended Priority Order

| # | File | Issue | Priority |
|---|------|--------|----------|
| 1 | `webhook/route.ts` | No webhook auth | 🔴 Critical |
| 2 | `bibUtils.ts` | Bib race condition | 🔴 Critical |
| 3 | `ai/event-suggest/route.ts` | No auth/rate limit | 🔴 Critical |
| 4 | `create-checkout/route.ts` | console.log sensitive data | 🔴 Critical |
| 5 | `EventForm.tsx` | `watch()` over-subscribing | 🟠 High |
| 6 | `Step3Categories.tsx` | Triple useFormContext | 🟠 High |
| 7 | `dashboard/page.tsx` | Overfetch registrations | 🟠 High |
| 8 | `app/(app)/layout.tsx` | Client-only auth guard | 🟠 High |
| 9 | `Navbar.tsx` | Unthrottled scroll | 🟠 High |
| 10 | `usePaginatedQuery.ts` | Unstable `fetchFn` dep | 🟠 High |
| 11 | `edit/page.tsx` | Bypasses service layer | 🟡 Medium |
| 12 | `EventForm.tsx` | Silent publish failure | 🟡 Medium |
| 13 | `EventForm.tsx` | `initialData: any` types | 🟡 Medium |
| 14 | `AuthProvider.tsx` | Real-time listener overuse | 🟡 Medium |
| 15 | `earlyBirdUtils.ts` | Duplicated `toDate` | 🟢 Low |
| 16 | `package.json` | Leaflet/recharts/html5-qrcode not lazy | 🟢 Low |
| 17 | `package.json` | uuid vs crypto.randomUUID | 🟢 Low |
| 18 | `next.config.ts` | Missing security headers | 🟢 Low |
| 19 | Various | Missing aria-labels | 🟢 Low |

---

## Architecture Notes

- **Good:** Route group separation `(app)` / `(marketing)` is clean.
- **Good:** `registrationService.getRegistrationsWithEvents` correctly avoids N+1 with batch `in` queries.
- **Good:** `EventForm` step validation before advancing is a great UX pattern.
- **Good:** Zod schema is comprehensive and includes cross-field refinements.
- **Good:** Early bird price recalculation server-side (not trusted from client) in checkout route.
- **Consider:** Firebase Admin SDK for server-side Firestore access in API routes (vs. client SDK currently used). Admin SDK bypasses security rules and is more performant for server-to-server calls, while also enabling proper middleware auth.
- **Consider:** React Server Components for the marketing pages (events listing, about, for-organizers) — these are fully `"use client"` despite having no client-side interactivity.
