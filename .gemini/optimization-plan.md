# RaceDay Next.js — Optimization Plan

> **Goal:** Reduce Firestore read costs, improve code maintainability, and adopt best practices across the
entire codebase.

---

## 🔴 Stage 1: Firestore Cost Reduction (Critical — Save Money)

The single biggest optimization. Currently, **multiple pages download entire collections** without limits,
filters, or caching. Every page visit = full collection scans billed per document read.

### 1.1 — Eliminate Full-Collection Reads

| File | Problem | Fix |
|---|---|---|
| `admin/page.tsx` L40-41 | `getDocs(collection(db, "users"))` and `getDocs(collection(db, "events"))` — downloads **every** user and event document on every admin dashboard visit | Use `getCountFromServer()` for stats. Only fetch documents when listing/displaying them. |
| `admin/analytics/page.tsx` L45-47 | Downloads **all** users, **all** paid registrations, **all** events simultaneously | Use `getCountFromServer()` for user distribution counts. Use Firestore aggregation queries or store pre-computed stats in a `platformStats` document. |
| `admin/users/page.tsx` L39 | `getDocs(collection(db, "users"))` — downloads every user | Add `limit(50)` + pagination. Implement cursor-based pagination using `startAfter()`. |
| `admin/events/page.tsx` L38 | `getDocs(collection(db, "events"))` — downloads every event | Add `limit(25)` + pagination. |
| `admin/applications/page.tsx` L42 | `getDocs(collection(db, "organizerApplications"))` — no limit | Add `limit(25)` + pagination. |
| `dashboard/page.tsx` L44 | Organizer fetches **all** paid registrations, then filters client-side by event IDs | Use `where("eventId", "in", myEventIds)` to filter server-side. Firestore `in` supports up to 30 values. For more, use batched queries. |

**Estimated impact:** Could reduce reads by **80-95%** on admin pages alone.

### 1.2 — Create a `platformStats` Aggregation Document

Instead of counting entire collections on every page load, maintain a single Firestore document that stores
pre-computed platform statistics.

```
Collection: "meta"
Document: "platformStats"
Fields:
  totalUsers: number
  totalEvents: number  
  totalRegistrations: number
  totalRevenue: number
  usersByRole: { runner: number, organizer: number, admin: number }
  updatedAt: Timestamp
```

**How to maintain it:**
- Use Cloud Functions `onWrite` triggers on `users`, `events`, and `registrations` collections to
  increment/decrement counters atomically.
- Fallback: If Cloud Functions aren't set up yet, use `getCountFromServer()` (1 read per count vs N reads
  per full collection scan).

**Files affected:**
- `admin/page.tsx` — Replace 4 `getDocs()` calls with 1 `getDoc(doc(db, "meta", "platformStats"))`
- `admin/analytics/page.tsx` — Use the same stats doc for user distribution

### 1.3 — Add Pagination to All List Pages

Create a reusable pagination hook:

```typescript
// lib/hooks/usePaginatedQuery.ts
// Uses startAfter() cursor-based pagination
// Returns: { data, loading, hasMore, loadNext, loadPrev }
```

**Apply to:**
- `admin/users/page.tsx` — Paginate user list (25 per page)
- `admin/events/page.tsx` — Paginate event list (25 per page)
- `admin/applications/page.tsx` — Paginate applications (25 per page)
- `admin/logs/page.tsx` — Paginate audit logs (50 per page)
- `(marketing)/events/page.tsx` — Paginate event directory (12 per page)

### 1.4 — Fix the N+1 Query in Runner Dashboard

In `dashboard/page.tsx` L67-75, each registration triggers a separate `getDoc()` for its associated event:

```typescript
// CURRENT: N+1 queries (1 for regs + N for events)
const myRegs = await Promise.all(regsSnap.docs.map(async (regDoc) => {
    const eventDoc = await getDoc(doc(db, "events", regData.eventId));
    ...
}));
```

**Fix:** Collect unique event IDs, batch-fetch them, then join client-side:

```typescript
// OPTIMIZED: 2 queries total (1 for regs + 1 batched for events)
const eventIds = [...new Set(regsSnap.docs.map(d => d.data().eventId))];
const eventDocs = await getDocs(query(
    collection(db, "events"),
    where("__name__", "in", eventIds.slice(0, 30))
));
const eventsMap = new Map(eventDocs.docs.map(d => [d.id, d.data()]));
```

### 1.5 — Consolidate Duplicate Admin Data Fetches

The **admin dashboard** (`admin/page.tsx`) and **admin analytics** (`admin/analytics/page.tsx`) both
independently fetch the same collections:
- Both fetch all users
- Both fetch all paid registrations
- Both fetch all events

**Fix:** Create a shared admin data service or context:

```typescript
// lib/admin/adminDataService.ts
// Centralized fetching + in-memory caching for admin pages
// Cache TTL: 5 minutes (configurable)
```

---

## 🟡 Stage 2: Code Architecture & Maintainability

### 2.1 — Extract Firestore Service Layer

Currently, every page component directly calls Firestore. This creates:
- Tight coupling between UI and database
- Duplicated query logic
- No central place for error handling or caching

**Create service modules:**

```
lib/services/
├── eventService.ts      # CRUD + queries for events
├── registrationService.ts # Registration queries, stats
├── userService.ts       # User queries, role management
├── applicationService.ts # Organizer application queries
└── statsService.ts      # Platform statistics aggregation
```

**Example:**
```typescript
// lib/services/eventService.ts
export async function getPublishedEvents(opts?: { limit?: number; startAfter?: DocumentSnapshot }) { ... }
export async function getOrganizerEvents(organizerId: string) { ... }
export async function getEventById(id: string) { ... }
export async function toggleEventFeatured(eventId: string, currentState: boolean) { ... }
```

**Benefits:**
- Single source of truth for all database operations
- Easy to add caching, error handling, logging
- Components become pure presentation + state management
- Testable in isolation

### 2.2 — Create Custom Hooks for Data Fetching

Wrap service calls into reusable hooks that handle loading, error, and refresh states:

```
lib/hooks/
├── useAuth.ts              # (Already exists)
├── usePaginatedQuery.ts    # Generic paginated Firestore hook
├── useEventData.ts         # Single event + its registrations
├── useAdminStats.ts        # Platform-wide statistics  
└── useOrganizerDashboard.ts # Organizer-specific dashboard data
```

### 2.3 — Fix Type Safety Issues

Several files use `any` types that suppress TypeScript's safety:

| File | Issue |
|---|---|
| `dashboard/page.tsx` L23 | `useState<any[]>([])` for items |
| `admin/page.tsx` L28-29 | `useState<any[]>([])` for chartData, recentEvents, recentApps |
| `admin/analytics/page.tsx` L33-35 | `useState<any[]>([])` for all analytics data |
| `dashboard/events/[id]/page.tsx` L25 | `useState<any[]>([])` for registrations |

**Fix:** Define proper interfaces for each data shape:

```typescript
// types/registration.ts
export interface Registration {
    id: string;
    eventId: string;
    categoryId: string;
    userId: string;
    participantInfo: { name: string; email: string; phone: string; ... };
    status: "pending" | "paid" | "cancelled";
    totalPrice: number;
    basePrice: number;
    vanityNumber?: string;
    vanityPremium: number;
    raceNumber?: string;
    qrCodeUrl?: string;
    raceKitClaimed?: boolean;
    createdAt: Timestamp;
    paidAt?: Timestamp;
}
```

### 2.4 — Standardize Date Handling

The codebase has inconsistent date handling scattered across files:

```typescript
// Pattern repeated in 6+ files:
const eventDate = typeof (event.date as any).toDate === 'function' 
    ? (event.date as any).toDate() 
    : new Date(event.date as string | number | Date);
```

**Fix:** Centralize into `lib/utils.ts`:

```typescript
export function toDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
}
```

Then replace all inline conversions with `toDate(event.date)`.

### 2.5 — DRY Up Repeated UI Patterns

Several patterns are copy-pasted across pages:

1. **Loading state** — Every page has the same Loader2 spinner block. Extract: `<FullPageLoader />`
2. **Empty state** — Multiple pages have similar "no items found" blocks. Extract: `<EmptyState icon={...} title={...} description={...} />`
3. **Page header** — Admin pages share a header with back-link + title + actions. Extract: `<PageHeader backHref={...} title={...} subtitle={...} actions={...} />`
4. **Filter bar** — Multiple pages have filter tabs + search. Extract: `<FilterBar tabs={...} searchPlaceholder={...} />`
5. **Stat card** — The KPI cards on admin/dashboard pages are nearly identical. Extract: `<StatCard icon={...} label={...} value={...} color={...} />`

---

## 🟢 Stage 3: Performance Optimizations

### 3.1 — Parallelize Independent Queries

Several fetch functions make sequential `await` calls that could run in parallel:

```typescript
// CURRENT (Sequential — slow):
const usersSnap = await getDocs(collection(db, "users"));
const eventsSnap = await getDocs(collection(db, "events"));
const regsSnap = await getDocs(query(...));

// OPTIMIZED (Parallel — fast):
const [usersSnap, eventsSnap, regsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "events")),
    getDocs(query(...))
]);
```

**Apply to:**
- `admin/page.tsx` L40-43 (4 sequential queries)
- `admin/analytics/page.tsx` L45-47 (3 sequential queries)

### 3.2 — Use Server Components Where Possible

Currently, many pages that could be server-rendered are marked `"use client"`:

- `(marketing)/events/page.tsx` — The events directory could be a server component that fetches data at
  the server level, eliminating client-side loading spinners and reducing bundle size.
- Event detail pages could leverage Next.js caching with `revalidate`.

**Note:** The homepage (`(marketing)/page.tsx`) is already a server component — good pattern to follow.

### 3.3 — Implement Next.js Data Caching

For server components, add ISR (Incremental Static Regeneration):

```typescript
// In server components or route handlers:
export const revalidate = 300; // Revalidate every 5 minutes
```

For the homepage events query, this means Firestore is only hit once every 5 minutes instead of on every
page visit.

### 3.4 — Lazy Load Heavy Components

The admin analytics page already does this well with `dynamic(() => import("recharts")...)`. Apply the
same pattern to:
- Leaflet map components
- QR scanner components
- Event creation form (heavy with multiple sub-steps)

### 3.5 — Add `select()` to Firestore Queries (where applicable)

Firebase v10+ supports field selection. If you only need specific fields, avoid downloading entire
documents:

```typescript
// Instead of fetching all user fields for a count:
const q = query(collection(db, "users"), select("role"));
```

Note: Firestore still charges per document read, but this reduces bandwidth and client memory.

---

## 🔵 Stage 4: Error Handling & Resilience

### 4.1 — Add Global Error Boundaries

Add React Error Boundaries around critical sections (dashboard, admin pages) so that a single failed
Firestore call doesn't crash the entire UI.

### 4.2 — Standardize Error Handling in Services

```typescript
// lib/services/base.ts
export async function safeQuery<T>(
    queryFn: () => Promise<T>,
    fallback: T,
    context: string
): Promise<T> {
    try {
        return await queryFn();
    } catch (error) {
        console.error(`[${context}] Query failed:`, error);
        // Could also report to error tracking service
        return fallback;
    }
}
```

### 4.3 — Add Firestore Security Rules Audit

Ensure security rules enforce:
- Users can only read/write their own registrations
- Organizers can only read registrations for their events
- Only admins can read the full users collection
- Rate limiting on writes

### 4.4 — Sanitize All Firestore Writes

The `audit.ts` fix we applied (defaulting `undefined` → fallback values) should be applied globally.
Create a utility:

```typescript
export function sanitizeForFirestore<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value ?? ""])
    ) as T;
}
```

---

## 📊 Implementation Priority Matrix

| Stage | Effort | Impact on Cost | Impact on UX | Risk |
|---|---|---|---|---|
| **1.1** Eliminate full-collection reads | Medium | 🔴 Critical | Medium | Low |
| **1.2** Platform stats document | Medium | 🔴 Critical | Low | Low |
| **1.3** Pagination | Medium | 🔴 High | High | Low |
| **1.4** Fix N+1 query | Low | 🟡 Medium | High | Low |
| **1.5** Consolidate admin fetches | Medium | 🟡 Medium | Medium | Low |
| **2.1** Service layer | High | Low | Low | Medium |
| **2.2** Custom hooks | Medium | Low | Medium | Low |
| **2.3** Type safety | Medium | None | Low | Low |
| **2.4** Date handling | Low | None | Low | Low |
| **2.5** DRY UI components | Medium | None | Low | Low |
| **3.1** Parallelize queries | Low | Low | High | Low |
| **3.2** Server components | Medium | Medium | High | Medium |
| **3.3** Next.js caching | Low | Medium | High | Low |
| **3.4** Lazy loading | Low | None | Medium | Low |
| **3.5** Field selection | Low | Low | Low | Low |
| **4.1** Error boundaries | Low | None | High | Low |
| **4.2** Error handling | Medium | None | High | Low |
| **4.3** Security rules | Medium | None | None | Critical |
| **4.4** Sanitize writes | Low | None | Medium | Low |

---

## 🚀 Suggested Implementation Order

1. **Stage 1.1 + 1.4 + 3.1** — Quick wins: Fix the worst reads, N+1 query, parallelize
2. **Stage 1.3** — Add pagination to admin list pages
3. **Stage 2.4 + 2.5** — Low-effort DRY improvements
4. **Stage 2.1** — Extract service layer (enables everything else)
5. **Stage 1.2 + 1.5** — Stats document + consolidated admin fetches
6. **Stage 2.2 + 2.3** — Custom hooks + type safety
7. **Stage 3.2 + 3.3** — Server components + caching
8. **Stage 4.x** — Error handling + security

---

## 📈 Expected Outcomes

- **Firestore reads reduced by ~80-95%** on admin pages
- **Page load times reduced by ~60%** through parallel queries + pagination
- **Bundle size reduced** through proper code splitting + server components
- **Developer velocity improved** through service layer + DRY components
- **Zero production crashes** from undefined Firestore writes
- **Monthly Firestore costs** significantly reduced as user base grows
