# Convex Efficiency & Cost Optimizations

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Convex database read units and bandwidth by adding missing indexes, eliminating overfetching, and capping unbounded collects.

**Architecture:** Backend-only changes to Convex schema (indexes) and query/mutation functions. No frontend changes — all optimizations are transparent to existing API consumers. Each task is independent and can be deployed incrementally.

**Tech Stack:** Convex (schema indexes, queries, mutations), TypeScript

---

## Chunk 1: Schema Indexes & Backend Query Optimizations

### Task 1: Add missing composite indexes to schema

**Files:**
- Modify: `convex/schema.ts:192-197` (registrations indexes)
- Modify: `convex/schema.ts:232` (volunteers indexes)

- [ ] **Step 1: Add composite indexes to registrations and volunteers tables**

In `convex/schema.ts`, add these indexes:

```typescript
// registrations table — add after existing .index("by_event_status", ["eventId", "status"])
.index("by_organizer_status", ["organizerId", "status"])

// volunteers table — add after existing indexes
.index("by_event_user", ["eventId", "userId"])
.index("by_email_event", ["email", "eventId"])
```

- [ ] **Step 2: Verify the schema deploys**

Run: `npx convex dev` and confirm no schema errors in the console output.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "perf: add composite indexes for registrations and volunteers"
```

---

### Task 2: Optimize `getStats` and `getOrganizerDashboardStats` to use new index

**Files:**
- Modify: `convex/registrations.ts:79-96` (getStats)
- Modify: `convex/registrations.ts:356-405` (getOrganizerDashboardStats)

- [ ] **Step 1: Update `getStats` to use `by_organizer_status` index**

Replace the current `.withIndex("by_organizer").filter(status === "paid")` with the composite index:

```typescript
export const getStats = query({
    args: { organizerId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_organizer_status", (q) =>
                q.eq("organizerId", args.organizerId).eq("status", "paid")
            )
            .collect();

        const totalRevenue = registrations.reduce((sum, r) => sum + r.totalPrice, 0);
        const claimedKits = registrations.filter(r => r.raceKitClaimed).length;

        return {
            totalRevenue,
            totalRegistrations: registrations.length,
            claimedKits
        };
    },
});
```

- [ ] **Step 2: Update `getOrganizerDashboardStats` to use `by_organizer_status` index**

Instead of collecting ALL registrations and filtering in JS, query paid registrations directly. For recent registrations across all statuses, use a separate bounded query:

```typescript
export const getOrganizerDashboardStats = query({
    args: { organizerId: v.id("users") },
    handler: async (ctx, args) => {
        // Fetch only PAID registrations using composite index — no post-filter
        const paid = await ctx.db
            .query("registrations")
            .withIndex("by_organizer_status", (q) =>
                q.eq("organizerId", args.organizerId).eq("status", "paid")
            )
            .collect();

        const totalRevenue = paid.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        const claimedKits = paid.filter(r => r.raceKitClaimed).length;

        // Group stats by eventId
        const eventStats: Record<string, { total: number; claimed: number; revenue: number }> = {};
        paid.forEach(r => {
            const eid = r.eventId;
            if (!eventStats[eid]) eventStats[eid] = { total: 0, claimed: 0, revenue: 0 };
            eventStats[eid].total++;
            if (r.raceKitClaimed) eventStats[eid].claimed++;
            eventStats[eid].revenue += r.totalPrice || 0;
        });

        // Group stats by event+category
        const categoryStats: Record<string, { count: number; revenue: number; eventId: string; categoryId: string }> = {};
        paid.forEach(r => {
            const key = `${r.eventId}:${r.categoryId}`;
            if (!categoryStats[key]) {
                categoryStats[key] = { count: 0, revenue: 0, eventId: r.eventId, categoryId: r.categoryId };
            }
            categoryStats[key].count++;
            categoryStats[key].revenue += r.totalPrice || 0;
        });

        // Most recent 10 registrations — bounded query on by_organizer index
        const recent = await ctx.db
            .query("registrations")
            .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
            .order("desc")
            .take(10);

        return {
            totalRegistrations: paid.length,
            totalRevenue,
            claimedKits,
            claimPercentage: paid.length > 0 ? Math.round((claimedKits / paid.length) * 100) : 0,
            eventStats,
            categoryStats,
            recentRegistrations: recent,
        };
    },
});
```

- [ ] **Step 3: Verify dev server has no errors**

Run: `npx convex dev` — confirm no TypeScript or runtime errors.

- [ ] **Step 4: Commit**

```bash
git add convex/registrations.ts
git commit -m "perf: use composite index in organizer stats queries"
```

---

### Task 3: Optimize `registrations.list` to use organizer index instead of post-filter

**Files:**
- Modify: `convex/registrations.ts:50-77` (list query)

- [ ] **Step 1: Update `list` to prefer `by_organizer` index when organizerId is provided**

Currently, when `organizerId` is provided without `userId` or `eventId`, it falls through to a `.filter()`. Fix the index selection priority:

```typescript
export const list = query({
    args: {
        userId: v.optional(v.id("users")),
        eventId: v.optional(v.id("events")),
        organizerId: v.optional(v.id("users")),
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx: QueryCtx, args) => {
        let q: any = ctx.db.query("registrations");

        if (args.userId) {
            q = q.withIndex("by_user", (q: any) => q.eq("userId", args.userId));
        } else if (args.eventId && args.status && args.status !== "all") {
            // Use composite index when both eventId and status are provided
            q = q.withIndex("by_event_status", (q: any) =>
                q.eq("eventId", args.eventId).eq("status", args.status)
            );
        } else if (args.eventId) {
            q = q.withIndex("by_event", (q: any) => q.eq("eventId", args.eventId));
        } else if (args.organizerId && args.status && args.status !== "all") {
            // Use composite index when both organizerId and status are provided
            q = q.withIndex("by_organizer_status", (q: any) =>
                q.eq("organizerId", args.organizerId).eq("status", args.status)
            );
        } else if (args.organizerId) {
            q = q.withIndex("by_organizer", (q: any) => q.eq("organizerId", args.organizerId));
        }

        // Only add status filter if not already handled by a composite index
        if (args.status && args.status !== "all" && !args.eventId && !args.organizerId) {
            q = q.filter((q: any) => q.eq(q.field("status"), args.status));
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});
```

Wait — actually this is getting complicated with the mutual exclusion logic. Simpler approach: just use organizer index when organizerId is the primary filter, and apply status filter after:

```typescript
export const list = query({
    args: {
        userId: v.optional(v.id("users")),
        eventId: v.optional(v.id("events")),
        organizerId: v.optional(v.id("users")),
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx: QueryCtx, args) => {
        let q: any = ctx.db.query("registrations");
        let statusHandled = false;

        if (args.userId) {
            q = q.withIndex("by_user", (q: any) => q.eq("userId", args.userId));
        } else if (args.organizerId && args.status && args.status !== "all") {
            q = q.withIndex("by_organizer_status", (q: any) =>
                q.eq("organizerId", args.organizerId).eq("status", args.status)
            );
            statusHandled = true;
        } else if (args.organizerId) {
            q = q.withIndex("by_organizer", (q: any) => q.eq("organizerId", args.organizerId));
        } else if (args.eventId) {
            q = q.withIndex("by_event", (q: any) => q.eq("eventId", args.eventId));
        }

        if (!statusHandled && args.status && args.status !== "all") {
            q = q.filter((q: any) => q.eq(q.field("status"), args.status));
        }

        return await q.order("desc").paginate(args.paginationOpts);
    },
});
```

- [ ] **Step 2: Verify dev server has no errors**

- [ ] **Step 3: Commit**

```bash
git add convex/registrations.ts
git commit -m "perf: use composite index for organizer+status in registrations.list"
```

---

### Task 4: Optimize `getPlatformStats` to avoid full table scans

**Files:**
- Modify: `convex/stats.ts` (entire file)

- [ ] **Step 1: Replace full `.collect()` with role-indexed counts and bounded reads**

```typescript
import { query, QueryCtx } from "./_generated/server";

export const getPlatformStats = query({
    args: {},
    handler: async (ctx: QueryCtx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const requester = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!requester || requester.role !== "admin") throw new Error("Unauthorized");

        // Count users by role using the by_role index (avoids full table scan)
        const runners = await ctx.db.query("users")
            .withIndex("by_role", (q) => q.eq("role", "runner")).collect();
        const organizers = await ctx.db.query("users")
            .withIndex("by_role", (q) => q.eq("role", "organizer")).collect();
        const admins = await ctx.db.query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin")).collect();

        // Count events by status using the by_status index
        const publishedEvents = await ctx.db.query("events")
            .withIndex("by_status", (q) => q.eq("status", "published")).collect();
        const draftEvents = await ctx.db.query("events")
            .withIndex("by_status", (q) => q.eq("status", "draft")).collect();
        const cancelledEvents = await ctx.db.query("events")
            .withIndex("by_status", (q) => q.eq("status", "cancelled")).collect();
        const completedEvents = await ctx.db.query("events")
            .withIndex("by_status", (q) => q.eq("status", "completed")).collect();

        // Paid registrations — still requires table scan since no status-only index exists
        // but at least we're not also scanning users and events tables
        const paidRegistrations = await ctx.db
            .query("registrations")
            .filter((q) => q.eq(q.field("status"), "paid"))
            .collect();

        const pendingApps = await ctx.db
            .query("organizerApplications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const totalRevenue = paidRegistrations.reduce((sum, r) => sum + r.totalPrice, 0);

        return {
            totalUsers: runners.length + organizers.length + admins.length,
            totalEvents: publishedEvents.length + draftEvents.length + cancelledEvents.length + completedEvents.length,
            totalRegistrations: paidRegistrations.length,
            totalRevenue,
            pendingApplications: pendingApps.length,
            usersByRole: {
                runner: runners.length,
                organizer: organizers.length,
                admin: admins.length,
            },
        };
    },
});
```

- [ ] **Step 2: Verify dev server has no errors**

- [ ] **Step 3: Commit**

```bash
git add convex/stats.ts
git commit -m "perf: use indexed queries in getPlatformStats instead of full table scans"
```

---

### Task 5: Optimize volunteer queries to use composite indexes

**Files:**
- Modify: `convex/volunteers.ts:17-26` (getByEmail)
- Modify: `convex/volunteers.ts:186-196` (getByUserIdAndEvent)
- Modify: `convex/events.ts:300-308` (checkAccess volunteer lookup)

- [ ] **Step 1: Update `getByEmail` to use `by_email_event` composite index**

```typescript
export const getByEmail = query({
    args: { eventId: v.id("events"), email: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_email_event", (q) =>
                q.eq("email", args.email.toLowerCase()).eq("eventId", args.eventId)
            )
            .first();
    },
});
```

- [ ] **Step 2: Update `getByUserIdAndEvent` to use `by_event_user` composite index**

```typescript
export const getByUserIdAndEvent = query({
    args: { userId: v.id("users"), eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("volunteers")
            .withIndex("by_event_user", (q) =>
                q.eq("eventId", args.eventId).eq("userId", args.userId)
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .unique();
    },
});
```

- [ ] **Step 3: Update `checkAccess` in events.ts to use `by_event_user` index**

In `convex/events.ts`, replace lines 301-308:

```typescript
const volunteer = await ctx.db
    .query("volunteers")
    .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
    )
    .filter((q) => q.eq(q.field("status"), "accepted"))
    .first();
```

- [ ] **Step 4: Verify dev server has no errors**

- [ ] **Step 5: Commit**

```bash
git add convex/volunteers.ts convex/events.ts
git commit -m "perf: use composite indexes for volunteer lookups"
```

---

### Task 6: Cap unbounded `.collect()` calls and optimize bib queries

**Files:**
- Modify: `convex/bibs.ts:7-13` (isTaken — optimize filter)
- Modify: `convex/bibs.ts:65-69` (generate — cap collect)
- Modify: `convex/registrations.ts:99-124` (getCategoryCounts — consolidate)
- Modify: `convex/registrations.ts:266-291` (search — add take limit)

- [ ] **Step 1: Optimize `bibs.isTaken` — the filter on `raceNumber` still requires scan but cap it**

No new index needed (raceNumber lookups are infrequent vanity checks). Just add `.take(1)` semantics — `.first()` already does this, so this is already optimal. Leave as-is.

- [ ] **Step 2: Cap bib generation collect**

In `convex/bibs.ts`, line 65-68, the collect fetches all registrations for an event but only needs raceNumbers. Cap it:

```typescript
// Cap at 10000 to prevent unbounded reads for large events
const existingBibs = await ctx.db
    .query("registrations")
    .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
    .take(10000);
const usedNumbers = new Set(existingBibs.map(r => r.raceNumber).filter(Boolean));
```

- [ ] **Step 3: Consolidate `getCategoryCounts` into single query**

Replace the two separate queries (paid + pending) with one query on `by_event` index:

```typescript
export const getCategoryCounts = query({
    args: { eventId: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        // Single query: fetch non-cancelled registrations for this event
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            if (r.status === "paid" || r.status === "pending") {
                counts[r.categoryId] = (counts[r.categoryId] || 0) + 1;
            }
        });
        return counts;
    },
});
```

This replaces 2 indexed queries + 2 collects with 1 indexed query + 1 collect (reads the same rows but halves the query overhead).

- [ ] **Step 4: Cap the `search` query collect**

In `convex/registrations.ts`, line 276-281, add `.take(5000)` to prevent unbounded reads for massive events:

```typescript
const registrations = await ctx.db
    .query("registrations")
    .withIndex("by_event_status", (q) =>
        q.eq("eventId", args.eventId).eq("status", "paid")
    )
    .take(5000);
```

- [ ] **Step 5: Verify dev server has no errors**

- [ ] **Step 6: Commit**

```bash
git add convex/bibs.ts convex/registrations.ts
git commit -m "perf: cap unbounded collects and consolidate category counts"
```

---

### Task 7: Add batch internal query for push notification user fetching

**Files:**
- Modify: `convex/users.ts` (add `getInternalBatch`)
- Modify: `convex/announcements.ts:78-107` (use batch query)

- [ ] **Step 1: Add batch internal query to users.ts**

Add after the existing `getInternal` query:

```typescript
export const getInternalBatch = internalQuery({
    args: { ids: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        return await Promise.all(args.ids.map(id => ctx.db.get(id)));
    },
});
```

- [ ] **Step 2: Update `sendAnnouncementPushes` to use batch query**

Replace the N individual `runQuery` calls with a single batch call:

```typescript
export const sendAnnouncementPushes = internalAction({
    args: {
        announcementId: v.id("announcements"),
        userIds: v.array(v.id("users")),
        title: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        // Single batch query instead of N individual queries
        const users = await ctx.runQuery(internal.users.getInternalBatch, { ids: args.userIds });
        const tokens: string[] = users
            .filter((u: any) => u?.expoPushToken)
            .map((u: any) => u!.expoPushToken as string);

        if (tokens.length > 0) {
            await ctx.runAction(internal.notifications.sendPush, {
                tokens,
                title: args.title,
                body: args.body,
                data: { announcementId: args.announcementId },
            });

            await ctx.runMutation(internal.announcements.updateSentCount, {
                id: args.announcementId,
                count: tokens.length,
            });
        }
    },
});
```

- [ ] **Step 3: Verify dev server has no errors**

- [ ] **Step 4: Commit**

```bash
git add convex/users.ts convex/announcements.ts
git commit -m "perf: batch user fetches in announcement push notifications"
```

---

## Summary of Expected Savings

| Optimization | Before | After | Savings |
|---|---|---|---|
| `getStats` | Full organizer scan + JS filter | Composite index, no filter | ~50% fewer reads |
| `getOrganizerDashboardStats` | All registrations (any status) | Only paid + bounded recent | ~30-60% fewer reads |
| `getPlatformStats` | 3 full table scans | Indexed queries per role/status | ~40% fewer reads |
| `registrations.list` (organizer) | Post-index filter on organizerId | Direct index hit | ~50% fewer reads |
| Volunteer lookups | Post-index filters | Composite index hits | ~30% fewer reads |
| `getCategoryCounts` | 2 queries + 2 collects | 1 query + 1 collect | 50% fewer queries |
| `search` | Unbounded collect | Capped at 5000 | Prevents runaway costs |
| Announcement pushes | N individual queries | 1 batch query | ~95% fewer queries |
