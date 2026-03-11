# Remove Organizer Overview Tabs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant Overview/Events/Participants tabs from the organizer dashboard overview page, consolidating navigation into the sidebar only.

**Architecture:** Replace the tabbed OrganizerView with a single-page dashboard that shows stats, revenue, kit fulfillment, and preview cards for recent events and registrations (with "View all" links to the full sidebar pages).

**Tech Stack:** Next.js, React, Tailwind CSS, shadcn/ui components, Convex

---

## File Structure

- **Modify:** `components/dashboard/OrganizerView.tsx` — Remove tabs, flatten to single dashboard layout with all sections visible
- **Modify:** `app/(app)/dashboard/organizer/page.tsx` — Remove props that are no longer needed (draftEvents is only used by the Events tab's DraftsNotice which we'll keep as a banner)

## Chunk 1: Remove Tabs and Flatten Overview

### Task 1: Rewrite OrganizerView to remove tabs

**Files:**
- Modify: `components/dashboard/OrganizerView.tsx`

- [ ] **Step 1: Rewrite OrganizerView.tsx**

Remove the Tabs/TabsList/TabsTrigger/TabsContent imports and structure. Replace with a flat layout containing:

1. Quick Actions (keep as-is)
2. Drafts Notice banner (move from Events tab to top-level, keep as useful alert)
3. Stats cards row (from Overview tab)
4. Two-column grid:
   - Left: Revenue stats
   - Right: Kit Fulfillment
5. Two-column grid:
   - Left (2/3): Recent Events preview (reuse OrganizerActiveEvents, already has cards)
   - Right (1/3): Recent Sign-ups preview (reuse OrganizerRegistrationsFeed, already has "View All" link)

The new component should look like:

```tsx
"use client";

import { OrganizerQuickActions } from "./organizer/OrganizerQuickActions";
import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";

interface OrganizerViewProps {
    items: any[];
    publishedEvents: any[];
    draftEvents: any[];
    stats: { total: number; secondary: number; revenue: number };
    claimedKits: number;
    claimPercentage: number;
    eventKitStats: any[];
    recentRegistrations: any[];
    categoryRevenue: any[];
    eventRevenue: any[];
}

export function OrganizerView({
    items,
    publishedEvents,
    draftEvents,
    stats,
    claimedKits,
    claimPercentage,
    eventKitStats,
    recentRegistrations,
    categoryRevenue,
    eventRevenue
}: OrganizerViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <OrganizerQuickActions items={items} />

            <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />

            <OrganizerStats
                stats={stats}
                publishedEventsCount={publishedEvents.length}
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <OrganizerRevenueStats
                    categoryRevenue={categoryRevenue}
                    eventRevenue={eventRevenue}
                    totalRevenue={stats.revenue}
                />
                <OrganizerKitFulfillment
                    claimPercentage={claimPercentage}
                    claimedKits={claimedKits}
                    totalParticipants={stats.secondary}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <OrganizerActiveEvents
                        items={items}
                        eventKitStats={eventKitStats}
                    />
                </div>
                <div>
                    <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />
                </div>
            </div>
        </div>
    );
}
```

Key changes:
- Remove `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` imports
- Remove `LayoutDashboard`, `CalendarDays`, `Users` icon imports (only used for tab triggers)
- Remove `allEvents` from props (was unused in the component itself — only passed through)
- Flatten all sections into a single scrollable layout
- DraftsNotice renders at top as a banner (it self-hides when count is 0)
- OrganizerRegistrationsFeed already has a "View All →" link to `/dashboard/organizer/registrations`

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build --no-lint 2>&1 | tail -20` or `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/OrganizerView.tsx
git commit -m "refactor: remove redundant tabs from organizer overview, flatten to single dashboard"
```

### Task 2: Clean up the page.tsx props

**Files:**
- Modify: `app/(app)/dashboard/organizer/page.tsx`

- [ ] **Step 1: Remove `allEvents` prop from OrganizerView usage**

In `page.tsx`, the `OrganizerView` component receives `allEvents` as a prop. Since we removed it from the interface, remove it from the JSX call:

Change:
```tsx
<OrganizerView
    items={items}
    allEvents={allEvents}
    publishedEvents={publishedEvents}
    ...
```

To:
```tsx
<OrganizerView
    items={items}
    publishedEvents={publishedEvents}
    ...
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Verify visually in dev server**

Run: `npm run dev` and navigate to `/dashboard/organizer`
Expected: Single scrollable dashboard with all sections visible, no tabs

- [ ] **Step 4: Commit**

```bash
git add app/(app)/dashboard/organizer/page.tsx
git commit -m "refactor: remove unused allEvents prop from OrganizerView usage"
```
