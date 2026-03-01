# Firebase → Convex Full Conversion & Cleanup Plan

> **Status**: Planning • **Date**: March 1, 2026  
> **Scope**: Complete the Firebase-to-Convex migration by cleaning up all remaining Firebase artifacts, legacy code, and type inconsistencies.

---

## Executive Summary

The migration from Firebase to Convex is **~90% complete**. All data flows through Convex, Clerk handles auth, and no Firebase SDK packages remain in `package.json`. The remaining work is **cleanup**: removing dead Firebase code, fixing legacy type patterns, removing migration-only mutations, and purging environment variables.

---

## Phase 1: Environment Variable Cleanup

### `.env.local` — Remove Firebase Variables

The following Firebase-related env vars are still present and should be **removed**:

| Line(s) | Variable | Action |
|---------|----------|--------|
| 3-11 | `NEXT_PUBLIC_FIREBASE_*` (7 vars) | **DELETE** — API key, auth domain, database URL, project ID, storage bucket, messaging sender ID, app ID |
| 25-42 | `FIREBASE_SERVICE_ACCOUNT` (full JSON blob) | **DELETE** — Admin SDK config with private key |
| 40 | `FIREBASE_PROJECT_ID` | **DELETE** |
| 41 | `FIREBASE_CLIENT_EMAIL` | **DELETE** |
| 42 | `FIREBASE_PRIVATE_KEY` | **DELETE** |
| 44 | `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (duplicate) | **DELETE** |

> [!CAUTION]
> After removing these, rotate all Firebase credentials (API keys, service account keys) since they were committed to source. Even though `.env.local` is gitignored, treat them as compromised.

---

## Phase 2: Remove Dead Utility Functions

### `lib/utils.ts` — Remove `sanitizeForFirestore()`

- **Lines 83–110**: The `sanitizeForFirestore()` function handles Firestore `FieldValue` sentinel objects and `undefined` → `null` conversion
- **Not imported anywhere** in the codebase (confirmed by grep)
- **Action**: Delete the function entirely

### `lib/utils.ts` — Simplify `toDate()` function  

- **Lines 32–39**: Contains Firestore Timestamp compatibility (`value.toDate()`, `value.seconds`)
- Since Convex uses plain `number` (Unix ms) timestamps, simplify to only handle `number` and `Date`:
```typescript
export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
```

### `lib/bibUtils.ts` — Review Legacy Helper

- **Line 48**: Comment `// Legacy helper if still needed by some components` on `getRaceNumberFormat()`
- **Action**: Check if this function is used. If not, remove it. If used, remove the "legacy" comment.

---

## Phase 3: Fix `.toDate()` Firestore Timestamp Checks in Components

Multiple components still guard against Firestore `Timestamp.toDate()` which is no longer needed since Convex stores timestamps as plain numbers.

| File | Line(s) | Current Pattern | Fix |
|------|---------|-----------------|-----|
| `components/events/EventCard.tsx` | 47 | `typeof event.date.toDate === 'function'` | Use `new Date(event.date)` directly |
| `components/dashboard/organizer/OrganizerActiveEvents.tsx` | 56 | `typeof event.date?.toDate === 'function'` | Use `new Date(event.date)` directly |
| `app/(marketing)/page.tsx` | 138 | `typeof event.date.toDate === 'function'` | Use `new Date(event.date)` directly |
| `app/(marketing)/events/[id]/page.tsx` | 37-39 | `typeof date.toDate === 'function'` check with `// Firestore Timestamp` comment | Use `new Date(date)` directly |
| `app/(app)/dashboard/events/[id]/page.tsx` | 141 | `typeof event.date.toDate === 'function'` | Use `new Date(event.date)` directly |
| `app/(app)/dashboard/events/[id]/edit/page.tsx` | 45 | Comment: `// Convert Firestore timestamps to YYYY-MM-DD strings` | Remove comment, simplify to `new Date(value)` |
| `app/(app)/dashboard/registrations/page.tsx` | 185 | `reg.createdAt.toDate()` | Use `new Date(reg.createdAt)` |

**Recommendation**: All these should use the simplified `toDate()` utility from `lib/utils.ts` or inline `new Date(timestamp)` since Convex always returns `number`.

---

## Phase 4: Fix `user.uid` References

Three components still reference `user.uid` (Clerk UID string) instead of using the Convex `user._id`:

| File | Line(s) | Current Code | Fix |
|------|---------|-------------|-----|
| `components/event/LiveTrackingClient.tsx` | 283, 286 | `user.uid` in localStorage keys | Evaluate context — if for localStorage keys only, `user.uid` (Clerk ID) may be acceptable as a stable key. If used for Convex queries, replace with `user._id` |
| `components/dashboard/AnnouncementsTab.tsx` | 132 | `createdBy: user.uid` | Replace with `user._id` since `announcements.createdBy` in schema uses `v.string()` |
| `components/dashboard/organizer/InviteVolunteerDialog.tsx` | 55 | `invitedBy: user.uid` | Replace with `user._id` since `volunteers.invitedBy` in schema uses `v.string()` |

> [!IMPORTANT]
> Decide on a consistent identity strategy: use Convex `_id` for all internal references. The `uid` field (Clerk subject) should only be used for auth lookups via the `by_uid` index.

---

## Phase 5: Remove Migration-Only Code

### `convex/events.ts` — Delete `migrateEvent` Mutation

- **Lines 282–357**: The `migrateEvent` mutation was used for one-time Firebase → Convex data migration
- References `legacyId`, `organizerUid` (Firebase UID), and `adminSecret`
- **Action**: Delete entirely — migration is complete

### `convex/schema.ts` — Clean Up Legacy Fields

| Table | Field | Line | Action |
|-------|-------|------|--------|
| `volunteers` | `uid: v.optional(v.string())` | 189 | **Evaluate** — If all volunteers now have `userId` (Convex ID), remove `uid` and the `by_uid` index |
| `registrations` | `bibNumber: v.optional(v.string())` | 150 | **Evaluate** — Comment says "Legacy/Compatibility". If `raceNumber` fully replaces it, remove |
| `auditLogs` | `adminId: v.string()` | 178 | Comment says "Clerk UID or Convex ID" — **Standardize** to always use Convex `_id` |
| `announcements` | `createdBy: v.string()` | 208 | **Standardize** to Convex `_id` format |
| `volunteers` | `invitedBy: v.string()` | 195 | **Standardize** to Convex `_id` format |

> [!WARNING]
> Schema changes require a data migration if existing rows use the old format. Check existing data before removing fields.

### `convex/schema.ts` — Remove `by_uid` Index on Volunteers

- **Line 199**: `.index("by_uid", ["uid"])` — Only needed if legacy `uid` field is kept
- If `uid` field is removed, this index should also be removed

---

## Phase 6: Type System Cleanup

### Remove `UniversalDate` Type

The `UniversalDate` type exists in **4 files** to handle Firestore's Timestamp, Date, and number types. Since Convex uses only `number`, this should be simplified.

| File | Current Definition | Action |
|------|-------------------|--------|
| `types/event.ts:1` | `type UniversalDate = number \| Date \| any` | Replace all `UniversalDate \| Date` usages with `number` |
| `types/registration.ts:1` | `type UniversalDate = number \| Date \| any` | Replace all `UniversalDate \| Date` usages with `number` |
| `types/volunteer.ts:5` | `type UniversalDate = number \| any` | Replace all `UniversalDate` usages with `number` |
| `types/announcement.ts:1` | `type UniversalDate = number \| Date \| any` | Replace `UniversalDate \| Date` with `number` |
| `types/user.ts:2` | `type UniversalTimestamp = number` | ✅ Already correct — keep or inline |

**After replacement**, delete all `UniversalDate` type aliases.

### Type Fields Using `id: string` Instead of Convex IDs

| File | Field | Action |
|------|-------|--------|
| `types/user.ts:15` | `_id?: string` | Should be `Id<"users">` or stay `string` for portability |
| `types/event.ts:56` | `id: string` | Consider renaming to `_id` for consistency with Convex |
| `types/registration.ts:22-24` | `id`, `userId`, `eventId` as `string` | Consider typing as Convex `Id<>` types |

> [!NOTE]
> Using plain `string` in the types layer keeps the types portable. Only change to `Id<>` if you want tighter coupling with Convex. This is a design decision, not a requirement.

---

## Phase 7: Remove Firestore Comments & References

Scattered comments reference Firebase/Firestore throughout the codebase. These should be cleaned up for codebase hygiene:

| File | Line(s) | Comment/Reference |
|------|---------|-------------------|
| `lib/services/registrationService.ts` | 49 | `// In Convex, we can't easily do a batch "in" query like Firestore...` |
| `app/(app)/dashboard/admin/users/page.tsx` | 48 | `// logAdminAction should also be migrated to Convex later if it writes to Firestore` |
| `app/(app)/dashboard/events/[id]/edit/page.tsx` | 45 | `// Convert Firestore timestamps...` |
| `app/(marketing)/events/[id]/page.tsx` | 37 | `// Firestore Timestamp` |
| `components/events/EventCard.tsx` | 39 | `// Convex IDs have a specific format distinct from legacy IDs` |
| `convex/events.ts` | 284, 294, 301 | `// Firebase doc ID`, `// Firebase UID of creator`, `// Try to find the organizer...by their Firebase UID` |
| `convex/schema.ts` | 189 | `// Legacy UID` |

---

## Phase 8: Verify & Optimize

### Pre-cleanup Verification
- [ ] Run `npm run build` to establish baseline — should succeed
- [ ] Run `npm run lint` to establish baseline

### Post-cleanup Verification
- [ ] Run `npm run build` — must succeed with no new errors
- [ ] Run `npm run lint` — must pass
- [ ] Test user login flow (Clerk) — user data loads from Convex
- [ ] Test event creation → publish → view flow
- [ ] Test registration flow end-to-end
- [ ] Test volunteer invite → accept flow
- [ ] Test announcement creation
- [ ] Test live tracking toggle
- [ ] Verify `npx convex dev` runs without schema errors after changes

---

## Execution Priority (Recommended Order)

| Priority | Phase | Risk | Effort |
|----------|-------|------|--------|
| 🔴 1 | Phase 1: Env vars | Low | 5 min |
| 🔴 2 | Phase 5: Remove `migrateEvent` | Low | 5 min |
| 🟡 3 | Phase 2: Dead utilities | Low | 10 min |
| 🟡 4 | Phase 3: `.toDate()` fixes | Low | 20 min |
| 🟡 5 | Phase 7: Comment cleanup | Low | 15 min |
| 🟡 6 | Phase 4: `user.uid` fixes | Medium | 15 min |
| 🟠 7 | Phase 6: Type cleanup | Medium | 30 min |
| 🔴 8 | Phase 5 (schema): Legacy fields | High | 30 min (needs data check) |

---

## Files Affected Summary

### Files to Modify
| File | Changes |
|------|---------|
| `.env.local` | Remove ~20 lines of Firebase env vars |
| `lib/utils.ts` | Remove `sanitizeForFirestore()`, simplify `toDate()` |
| `lib/bibUtils.ts` | Remove legacy comment or unused function |
| `convex/events.ts` | Delete `migrateEvent` mutation (~75 lines) |
| `convex/schema.ts` | Remove legacy `uid`, `bibNumber` fields (pending data check) |
| `types/event.ts` | Replace `UniversalDate` with `number` |
| `types/registration.ts` | Replace `UniversalDate` with `number` |
| `types/volunteer.ts` | Replace `UniversalDate` with `number` |
| `types/announcement.ts` | Replace `UniversalDate` with `number` |
| `components/events/EventCard.tsx` | Remove `.toDate()` guard |
| `components/event/LiveTrackingClient.tsx` | Review `user.uid` usage |
| `components/dashboard/AnnouncementsTab.tsx` | Replace `user.uid` → `user._id` |
| `components/dashboard/organizer/OrganizerActiveEvents.tsx` | Remove `.toDate()` guard |
| `components/dashboard/organizer/InviteVolunteerDialog.tsx` | Replace `user.uid` → `user._id` |
| `app/(marketing)/page.tsx` | Remove `.toDate()` guard |
| `app/(marketing)/events/[id]/page.tsx` | Remove `.toDate()` guard + comment |
| `app/(app)/dashboard/events/[id]/page.tsx` | Remove `.toDate()` guard |
| `app/(app)/dashboard/events/[id]/edit/page.tsx` | Remove Firestore comment |
| `app/(app)/dashboard/registrations/page.tsx` | Fix `.toDate()` call |
| `app/(app)/dashboard/admin/users/page.tsx` | Remove Firestore comment |
| `lib/services/registrationService.ts` | Remove Firestore comment |

### Files to Delete
| File | Reason |
|------|--------|
| _None_ | No standalone Firebase files remain |

### Total: **~21 files** to modify, **0 files** to delete
