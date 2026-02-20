# Stage 4 — Data Fetching & State Management
**Priority:** 🟠 High
**Issues Fixed:** #7 (Dashboard overfetch), #10 (usePaginatedQuery unstable dep), #11 (EditEventPage bypasses service), #14 (AuthProvider real-time overuse), #17 (Dashboard no error state), #18 (Profile completion stale)
**Files Touched:** 5
**Risk:** Medium — changes data loading behavior. Test all dashboard views (runner + organizer + admin).

**Vercel Rule References:** `async-parallel`, `client-swr-dedup`, `rerender-functional-setstate`, `rerender-lazy-state-init`, `server-parallel-fetching`

---

## Overview

Four separate data-fetching anti-patterns that increase Firestore reads, cause potential infinite re-fetch loops, and degrade UX by silently hiding errors. These fixes reduce Firestore document reads by ~90% on the organizer dashboard and make all error states visible to users.

---

## Fix 1 — Dashboard Overfetch: Use Targeted Queries
**Issue:** #7
**File:** `app/(app)/dashboard/page.tsx`

### The Problem

```ts
// Fetches ALL paid registrations platform-wide, then filters in JavaScript:
getRegistrations({ status: "paid", limitCount: 1000 })
const myRegs = regsResult.items.filter((r: any) => myEventsIds.includes(r.eventId));
```

This fetches up to 1000 Firestore documents when only a handful belong to this organizer.

### The Fix

**Option A (Recommended):** Store `organizerId` on registration documents (already available from `registrationData` in the checkout route) and query directly:

```ts
// In app/api/payments/create-checkout/route.ts — add organizerId when creating registration:
const regRef = await addDoc(collection(db, "registrations"), {
    ...registrationData,
    organizerId: eventData.organizerId, // ← add this field
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
});
```

```ts
// In lib/services/registrationService.ts — update GetRegistrationsOptions:
export interface GetRegistrationsOptions {
    userId?: string;
    eventId?: string;
    organizerId?: string; // ← add this
    status?: string | "all";
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
}

// In getRegistrations():
if (organizerId) q = query(q, where("organizerId", "==", organizerId));
```

```ts
// In app/(app)/dashboard/page.tsx — replace the organizer fetch:
const [eventsResult, regsResult] = await Promise.all([
    getEvents({ organizerId: user?.uid, limitCount: 10, status: "all" }), // 10 is enough for display
    getRegistrations({ organizerId: user?.uid, status: "paid", limitCount: 100 }) // targeted query
]);

// Remove the client-side filter — it's now handled server-side:
// const myRegs = regsResult.items.filter(...); ← DELETE

const myRegs = regsResult.items; // already filtered by Firestore
```

**Option B (Quick win, no schema change):** Use `statsService` for counts and limit events to display count:
```ts
// Use statsService for counts + only fetch what's displayed
const [eventsResult] = await Promise.all([
    getEvents({ organizerId: user?.uid, limitCount: 3, status: "published" }),
]);
// Fetch stats from statsService separately
```

> ⚠️ Option A requires a Firestore composite index: `organizerId + status + createdAt`. Add it to `firestore.indexes.json` or create it via the Firebase Console when you first query.

---

## Fix 2 — Dashboard: Add Error State + Retry
**Issue:** #17
**File:** `app/(app)/dashboard/page.tsx`

### Changes

**A. Add error state:**

```ts
const [error, setError] = useState<string | null>(null);

const fetchDashboardData = async () => {
    setLoading(true);
    setError(null); // reset on each fetch
    try {
        // ...existing fetch logic
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load your dashboard. Please try again.");
    } finally {
        setLoading(false);
    }
};
```

**B. Render the error state with a retry button:**

```tsx
if (error) {
    return (
        <PageWrapper className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
                <p className="text-red-400 font-bold italic uppercase">{error}</p>
                <Button variant="outline" onClick={fetchDashboardData}>
                    Try Again
                </Button>
            </div>
        </PageWrapper>
    );
}
```

---

## Fix 3 — Dashboard: Compute Profile Completion Dynamically
**Issue:** #18
**File:** `app/(app)/dashboard/page.tsx`

### The Problem

`user?.profileCompletion` is a static number stored in Firestore that may be stale if fields were updated without recalculating it.

### The Fix

Compute `profileCompletion` from the actual user object fields at render time:

```ts
// Add a utility function in lib/utils.ts:
export function computeProfileCompletion(user: User | null): number {
    if (!user) return 0;

    const checks = [
        !!user.displayName,             // 10%
        !!user.email,                   // 10%
        !!user.phone,                   // 15%
        !!user.photoURL,                // 5%
        !!user.address?.street,         // 10%
        !!user.address?.city,           // 10%
        !!user.tShirtSize,              // 10%
        !!user.emergencyContact?.name,  // 15%
        !!user.emergencyContact?.phone, // 10%
        !!user.medicalConditions,       // 5%
    ];

    const weights = [10, 10, 15, 5, 10, 10, 10, 15, 10, 5];
    return checks.reduce((total, check, i) => total + (check ? weights[i] : 0), 0);
}
```

```ts
// In dashboard/page.tsx — replace:
const completion = user?.profileCompletion || 0;

// With:
import { computeProfileCompletion } from "@/lib/utils";
const completion = computeProfileCompletion(user);
```

---

## Fix 4 — `usePaginatedQuery`: Stable `fetchFn` with `useRef`
**Issue:** #10
**File:** `lib/hooks/usePaginatedQuery.ts`

### The Problem

The `loadMore` callback has `fetchFn` in its dependency array. If the caller passes an inline arrow function, `fetchFn` is a new reference on every render → `loadMore` rebuilds → `refresh` rebuilds → `useEffect` re-runs → infinite loop.

### The Fix

Use `useRef` to hold the latest `fetchFn` without making it a reactive dependency (the `useLatest` pattern from Vercel's `advanced-use-latest` rule):

```ts
import { useState, useCallback, useEffect, useRef } from "react";
import { DocumentSnapshot } from "firebase/firestore";

interface UsePaginatedQueryOptions<T> {
    fetchFn: (options: { lastDoc?: DocumentSnapshot; limitCount: number }) => Promise<{
        items: T[];
        lastDoc: DocumentSnapshot | undefined;
    }>;
    pageSize?: number;
}

export function usePaginatedQuery<T>({ fetchFn, pageSize = 20 }: UsePaginatedQueryOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    // useRef holds the latest fetchFn without triggering re-renders or effect loops
    const fetchFnRef = useRef(fetchFn);
    useEffect(() => {
        fetchFnRef.current = fetchFn;
    });

    const lastDocRef = useRef(lastDoc);
    useEffect(() => {
        lastDocRef.current = lastDoc;
    });

    const loadMore = useCallback(async (isInitial = false) => {
        if (loading) return;
        if (!isInitial && !hasMore) return;

        setLoading(true);
        setError(null);
        try {
            const result = await fetchFnRef.current({
                lastDoc: isInitial ? undefined : lastDocRef.current,
                limitCount: pageSize
            });

            if (isInitial) {
                setData(result.items);
            } else {
                setData(prev => [...prev, ...result.items]);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.items.length === pageSize);
        } catch (err) {
            console.error("Pagination error:", err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, pageSize]); // ← fetchFn and lastDoc removed from deps

    // Stable initial load — runs once
    useEffect(() => {
        loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refresh = useCallback(() => {
        setLastDoc(undefined);
        setHasMore(true);
        loadMore(true);
    }, [loadMore]);

    return { data, loading, error, hasMore, loadMore, refresh };
}
```

---

## Fix 5 — EditEventPage: Use Service Layer
**Issue:** #11
**File:** `app/(app)/dashboard/events/[id]/edit/page.tsx`

### The Problem

The page directly imports Firebase primitives bypassing `eventService`:

```ts
import { doc, getDoc } from "firebase/firestore"; // ← remove
import { db } from "@/lib/firebase/config";        // ← remove
```

### The Fix

```ts
// Replace Firebase direct imports with service import
import { getEventById } from "@/lib/services/eventService";

// Replace the fetchEvent function body:
const fetchEvent = async () => {
    setLoading(true);
    try {
        const data = await getEventById(id as string); // ← one line

        if (!data) {
            setEventData(null);
            return;
        }

        // Check if user is the organizer
        if (data.organizerId !== user?.uid && role !== "admin") {
            setEventData(null);
            return;
        }

        // Normalize dates for HTML inputs
        const formattedData: EventFormInput = {
            ...data,
            date: data.date ? toInputDate(data.date) : toInputDate(new Date()),
            registrationEndDate: data.registrationEndDate
                ? toInputDate(data.registrationEndDate)
                : toInputDate(new Date()),
            categories: (data.categories || []).map((cat: any) => ({
                ...cat,
                distance: typeof cat.distance === "string"
                    ? (parseFloat(cat.distance) || 0)
                    : cat.distance,
                distanceUnit: cat.distanceUnit || "km",
            })),
            earlyBird: data.earlyBird ? {
                ...data.earlyBird,
                startDate: data.earlyBird.startDate
                    ? toInputDate(data.earlyBird.startDate)
                    : undefined,
                endDate: data.earlyBird.endDate
                    ? toInputDate(data.earlyBird.endDate)
                    : undefined,
            } : undefined,
        };

        setEventData(formattedData);
    } catch (e) {
        console.error("Error fetching event:", e);
    } finally {
        setLoading(false);
    }
};
```

---

## Fix 6 — AuthProvider: Replace `onSnapshot` with `getDoc`
**Issue:** #14
**File:** `components/providers/AuthProvider.tsx`

### The Problem

`onSnapshot` keeps a persistent WebSocket connection to Firestore for every session. User profile data (role, displayName, photoURL) rarely changes mid-session. This wastes Firestore listener quota.

### The Fix

Switch to a one-time `getDoc` for the initial profile load. Expose a `refreshUser` function that consumer components (e.g., profile settings page) can call after saving changes:

```ts
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // ← changed from onSnapshot
import { auth, db } from "@/lib/firebase/config";
import { User } from "@/types/user";

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    role: User["role"] | null;
    refreshUser: () => Promise<void>; // ← new: call after profile update
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    role: null,
    refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDoc = useCallback(async (uid: string) => {
        try {
            const snap = await getDoc(doc(db, "users", uid)); // ← one-time fetch
            setUser(snap.exists() ? (snap.data() as User) : null);
        } catch (error) {
            console.error("Error fetching user document:", error);
            setUser(null);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        if (!firebaseUser) return;
        await fetchUserDoc(firebaseUser.uid);
    }, [firebaseUser, fetchUserDoc]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            setFirebaseUser(authUser);

            if (!authUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            await fetchUserDoc(authUser.uid);
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, [fetchUserDoc]);

    return (
        <AuthContext.Provider value={{
            user,
            firebaseUser,
            loading,
            role: user?.role || null,
            refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
```

**Update `useAuth.ts`** to expose `refreshUser`:
```ts
export const useAuth = () => {
    const context = useAuthContext();
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context; // now includes refreshUser
};
```

**Call `refreshUser()` after saving profile changes** (in the profile settings page's save handler):
```ts
const { refreshUser } = useAuth();
// After saving to Firestore:
await refreshUser();
```

---

## Acceptance Criteria

- [ ] Organizer dashboard Firestore reads ≤ 20 (previously up to 1100)
- [ ] Loading an event that throws a network error shows a retry button
- [ ] Profile completion % matches actual fields filled in (not stale Firestore value)
- [ ] Scrolling through a paginated list 10+ times does not trigger infinite re-fetch
- [ ] `EditEventPage` has zero `firebase/firestore` imports (uses service layer only)
- [ ] Updating user profile and refreshing dashboard shows updated data (via `refreshUser()`)
- [ ] No Firestore `onSnapshot` listeners appear in Firebase Console realtime connections

---

## Firestore Index Required (for Option A of Fix 1)

Add to `firestore.indexes.json`:
```json
{
    "indexes": [
        {
            "collectionGroup": "registrations",
            "queryScope": "COLLECTION",
            "fields": [
                { "fieldPath": "organizerId", "order": "ASCENDING" },
                { "fieldPath": "status", "order": "ASCENDING" },
                { "fieldPath": "createdAt", "order": "DESCENDING" }
            ]
        }
    ]
}
```
