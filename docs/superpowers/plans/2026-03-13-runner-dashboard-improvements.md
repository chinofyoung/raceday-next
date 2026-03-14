# Runner Dashboard Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the runner dashboard with a hero "next race" card, quick actions, and announcements to make it feel actionable instead of empty.

**Architecture:** New `NextRaceHero` component with countdown timer sits at top of dashboard. Existing unused components (`RunnerQuickActions`, `RunnerAnnouncements`) get wired into a two-column middle row. A new Convex query + API route powers the announcements feed. `RunnerView` orchestrates the new layout.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Clerk auth, Tailwind CSS v4, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-13-runner-dashboard-improvements-design.md`

---

## Chunk 1: Announcements Backend

### Task 1: Create Convex query for participant announcements

**Files:**
- Modify: `convex/announcements.ts` (add new query after existing `listByEvent` at line 19)

- [ ] **Step 1: Add `listForParticipant` query to `convex/announcements.ts`**

Add this query after the existing `listByEvent` query (after line 19):

```ts
export const listForParticipant = query({
    args: {},
    handler: async (ctx: QueryCtx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        // Get all registrations for this user
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        // Collect unique event IDs
        const eventIds = [...new Set(registrations.map((r) => r.eventId))];
        if (eventIds.length === 0) return [];

        // Fetch announcements for all registered events
        const allAnnouncements = await Promise.all(
            eventIds.map((eventId) =>
                ctx.db
                    .query("announcements")
                    .withIndex("by_event", (q) => q.eq("eventId", eventId))
                    .order("desc")
                    .collect()
            )
        );

        // Flatten, enrich with event name, sort by creation time desc
        const events = await Promise.all(eventIds.map((id) => ctx.db.get(id)));
        const eventMap = new Map(events.filter(Boolean).map((e) => [e!._id, e!]));

        return allAnnouncements
            .flat()
            .map((a) => ({
                ...a,
                id: a._id,
                eventName: eventMap.get(a.eventId)?.name ?? "Unknown Event",
            }))
            .sort((a, b) => (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime))
            .slice(0, 20); // Limit to 20 most recent
    },
});
```

- [ ] **Step 2: Verify the Convex function compiles**

Run: `npx convex dev --once 2>&1 | tail -20`
Expected: No TypeScript errors for the new query.

- [ ] **Step 3: Commit**

```bash
git add convex/announcements.ts
git commit -m "feat: add listForParticipant query for runner announcements"
```

---

### Task 2: Create participant announcements API route

**Files:**
- Create: `app/api/participant/announcements/route.ts`

- [ ] **Step 1: Create the API route**

Create `app/api/participant/announcements/route.ts`:

```ts
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { userId, getToken } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });
        const announcements = await fetchQuery(
            api.announcements.listForParticipant,
            {},
            { token: token ?? undefined }
        );

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching participant announcements:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/participant/announcements/route.ts
git commit -m "feat: add API route for participant announcements"
```

---

## Chunk 2: Update Existing Components

### Task 3: Update RunnerAnnouncements to show empty placeholder

**Files:**
- Modify: `components/dashboard/RunnerAnnouncements.tsx`

- [ ] **Step 1: Replace the empty-state `return null` with a placeholder**

In `components/dashboard/RunnerAnnouncements.tsx`, replace line 34:

```ts
if (announcements.length === 0) return null;
```

with:

```tsx
if (announcements.length === 0) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Megaphone size={16} className="text-cta" /> Announcements
            </h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-3">
                    <Megaphone size={20} className="text-text-muted opacity-40" />
                </div>
                <p className="text-sm text-text-muted font-medium">No announcements yet</p>
                <p className="text-xs text-text-muted/60 mt-1">Updates from event organizers will appear here</p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/RunnerAnnouncements.tsx
git commit -m "feat: show empty placeholder in RunnerAnnouncements instead of null"
```

---

### Task 4: Update RunnerQuickActions with Profile and Settings buttons

**Files:**
- Modify: `components/dashboard/RunnerQuickActions.tsx`

- [ ] **Step 1: Replace the component contents**

Replace the full contents of `components/dashboard/RunnerQuickActions.tsx`:

```tsx
"use client";

import { Plus, Settings, Trophy, User } from "lucide-react";
import { BaseQuickAction } from "./shared/BaseQuickAction";

interface RunnerQuickActionsProps {
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerQuickActions({ hasApplication, userRole }: RunnerQuickActionsProps) {
    return (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3">
            <BaseQuickAction
                href="/events"
                icon={Trophy}
                label="Find Races"
                variant="primary"
            />
            <BaseQuickAction
                href="/dashboard/profile"
                icon={User}
                label="View Profile"
                variant="secondary"
            />
            <BaseQuickAction
                href="/dashboard/settings"
                icon={Settings}
                label="Settings"
                variant="secondary"
            />
            {userRole === "runner" && (
                <BaseQuickAction
                    href="/dashboard/become-organizer"
                    icon={hasApplication ? Settings : Plus}
                    label={hasApplication ? "Edit Application" : "Apply as Organizer"}
                    variant="secondary"
                />
            )}
        </div>
    );
}
```

Changes: removed "View Site" (`Globe`), added "View Profile" (`User`) and "Settings" (`Settings`).

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/RunnerQuickActions.tsx
git commit -m "feat: update RunnerQuickActions with Profile and Settings buttons"
```

---

## Chunk 3: NextRaceHero Component

### Task 5: Create the NextRaceHero component

**Files:**
- Create: `components/dashboard/runner/NextRaceHero.tsx`

- [ ] **Step 1: Create the component file**

Create `components/dashboard/runner/NextRaceHero.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { MapPin, Trophy, QrCode, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, toDate } from "@/lib/utils";

interface NextRaceHeroProps {
    registration: {
        id: string;
        _id: string;
        eventId: string;
        status: string;
        categoryId?: string;
        raceNumber?: string;
        raceKitClaimed?: boolean;
        isProxy?: boolean;
        participantInfo?: Record<string, unknown>;
        event: {
            _id: string;
            name: string;
            date: string;
            featuredImage?: string;
            location?: { name: string };
            categories?: Array<{ id: string; name: string }>;
        };
    };
}

function useCountdown(targetDate: Date) {
    const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(getTimeLeft(targetDate));
        }, 60_000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
}

function getTimeLeft(targetDate: Date) {
    const now = Date.now();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isToday: false, isPast: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isToday = days === 0 && hours < 24;

    return { days, hours, minutes, isToday, isPast: false };
}

export function NextRaceHero({ registration }: NextRaceHeroProps) {
    const reg = registration;
    const event = reg.event;
    const eventDate = toDate(event.date);
    const countdown = useCountdown(eventDate);

    const categoryName = event.categories?.find((c) => c.id === reg.categoryId)?.name || reg.categoryId || "Open";

    return (
        <Card className="bg-surface/40 border-primary/20 rounded-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-[100px] -mr-20 -mt-20 opacity-50 mix-blend-screen pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="aspect-[16/9] md:aspect-auto md:min-h-[280px] bg-black/40 relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
                    {event.featuredImage ? (
                        <Image
                            src={event.featuredImage}
                            alt={event.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface to-background flex items-center justify-center">
                            <span className="text-6xl font-bold text-white/10">{event.name?.[0] || "?"}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col gap-4 relative z-10">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={reg.status === "paid" ? "success" : "secondary"}
                            className="text-xs font-semibold uppercase px-2.5 py-0.5 border-none shadow-sm shadow-black/20"
                        >
                            {reg.status}
                        </Badge>
                        {reg.status === "paid" && (
                            <Badge
                                variant={reg.raceKitClaimed ? "cta" : "outline"}
                                className={cn(
                                    "text-xs font-semibold uppercase px-2.5 py-0.5 border-none shadow-sm shadow-black/20",
                                    !reg.raceKitClaimed && "bg-white/5 text-text-muted opacity-80"
                                )}
                            >
                                <Package size={11} className="mr-1 inline" />
                                {reg.raceKitClaimed ? "Kit Collected" : "Kit Pending"}
                            </Badge>
                        )}
                    </div>

                    {/* Event Name */}
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                        {event.name}
                    </h3>

                    {/* Countdown */}
                    <div>
                        {countdown.isPast ? (
                            <span className="text-2xl md:text-3xl font-bold heading text-text-muted">
                                In progress
                            </span>
                        ) : countdown.isToday ? (
                            <span className="text-2xl md:text-4xl font-bold heading text-primary">
                                Today!
                            </span>
                        ) : (
                            <div>
                                <span className="text-2xl md:text-4xl font-bold heading text-primary tracking-tight">
                                    {countdown.days}d {countdown.hours}h {countdown.minutes}m
                                </span>
                                <span className="text-sm text-text-muted font-medium ml-2">until race day</span>
                            </div>
                        )}
                    </div>

                    {/* Detail pills */}
                    <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-white/5 shadow-sm">
                            <MapPin size={12} className="text-cta shrink-0" />
                            <span className="text-white/90">{event.location?.name || "Location TBD"}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-white/5 shadow-sm">
                            <Trophy size={12} className="text-primary shrink-0" />
                            <span className="text-white/90">{categoryName}</span>
                        </span>
                        {reg.raceNumber && (
                            <span className="flex items-center gap-1 bg-primary/10 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-primary/20 text-white shadow-sm">
                                <span className="text-primary font-bold shrink-0">#</span>
                                {reg.raceNumber}
                            </span>
                        )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        {reg.status === "paid" && (
                            <Button asChild className="sm:w-auto">
                                <Link href={`/dashboard/events/${reg.eventId}/qr?regId=${reg.id}`}>
                                    <QrCode size={16} /> View Pass
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild className="sm:w-auto">
                            <Link href={`/events/${reg.eventId}`}>Details</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `npx next build 2>&1 | grep -i "error" | head -10`
Or if dev server is running, check the terminal for TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/runner/NextRaceHero.tsx
git commit -m "feat: add NextRaceHero component with countdown timer"
```

---

## Chunk 4: Wire Everything Together

### Task 6: Restructure RunnerView layout

**Files:**
- Modify: `components/dashboard/RunnerView.tsx`

- [ ] **Step 1: Replace RunnerView with the new layout**

Replace the full contents of `components/dashboard/RunnerView.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { VolunteerDashboard } from "@/components/dashboard/volunteer/VolunteerDashboard";
import { RunnerQuickActions } from "@/components/dashboard/RunnerQuickActions";
import { RunnerAnnouncements } from "@/components/dashboard/RunnerAnnouncements";
import { toDate } from "@/lib/utils";
import { ProfileCompletionCard } from "./runner/ProfileCompletionCard";
import { EventRegistrationList } from "./runner/EventRegistrationList";
import { NextRaceHero } from "./runner/NextRaceHero";

interface RunnerViewProps {
    completion: number;
    items: any[];
    stats: { total: number };
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerView({
    completion,
    items,
    stats,
    hasApplication,
    userRole
}: RunnerViewProps) {
    const { heroEvent, otherUpcoming, pastEvents } = useMemo(() => {
        const now = new Date();

        const upcoming = items.filter(reg => {
            if (!reg.event) return true;
            const eventDate = toDate(reg.event.date);
            return eventDate >= now && reg.event?.status !== "completed";
        }).sort((a, b) => {
            const dA = toDate(a.event?.date).getTime();
            const dB = toDate(b.event?.date).getTime();
            return dA - dB;
        });

        const past = items.filter(reg => {
            if (!reg.event) return false;
            const eventDate = toDate(reg.event.date);
            return eventDate < now || reg.event?.status === "completed";
        }).sort((a, b) => {
            const dA = toDate(a.event?.date).getTime();
            const dB = toDate(b.event?.date).getTime();
            return dB - dA;
        });

        // First upcoming with a valid event is the hero
        const hero = upcoming.find(reg => reg.event) || null;
        const others = hero ? upcoming.filter(reg => reg.id !== hero.id) : upcoming;

        return { heroEvent: hero, otherUpcoming: others, pastEvents: past };
    }, [items]);

    return (
        <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
            <div className="space-y-6 lg:space-y-8">
                {/* Profile Completion Card */}
                <ProfileCompletionCard completion={completion} />

                {/* Next Race Hero */}
                {heroEvent && heroEvent.event && (
                    <NextRaceHero registration={heroEvent} />
                )}

                {/* Quick Actions + Announcements Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                        <h3 className="text-sm font-bold uppercase tracking-tight text-white mb-4">Quick Actions</h3>
                        <RunnerQuickActions hasApplication={hasApplication} userRole={userRole} />
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                        <RunnerAnnouncements />
                    </div>
                </div>

                {/* Volunteer Dashboard */}
                <VolunteerDashboard />

                {/* Other Upcoming Events */}
                {otherUpcoming.length > 0 && (
                    <EventRegistrationList
                        title="Other Upcoming Events"
                        events={otherUpcoming}
                    />
                )}

                {/* Empty state when no upcoming events at all */}
                {!heroEvent && otherUpcoming.length === 0 && (
                    <EventRegistrationList
                        title="My Registered Events"
                        events={[]}
                    />
                )}

                {/* Past Events */}
                <EventRegistrationList
                    title="My Past Events"
                    events={pastEvents}
                    isPast
                />
            </div>
        </div>
    );
}
```

Key changes:
- Splits upcoming into `heroEvent` (nearest) and `otherUpcoming` (rest)
- Adds `NextRaceHero` for the hero event
- Adds two-column row with `RunnerQuickActions` + `RunnerAnnouncements`
- Keeps `VolunteerDashboard` between middle row and event lists
- Shows empty state only when there are zero upcoming events

- [ ] **Step 2: Verify the page renders**

Run the dev server and navigate to `/dashboard`. Check:
- Hero card appears for nearest upcoming event
- Quick actions and announcements show side by side
- Other upcoming events appear below (if any)
- Past events still show at bottom

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/RunnerView.tsx
git commit -m "feat: restructure RunnerView with hero card, quick actions, and announcements"
```

---

### Task 7: Update loading skeleton in dashboard page

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` (lines 46-112, the loading skeleton)

- [ ] **Step 1: Replace the loading skeleton to match the new layout**

In `app/(app)/dashboard/page.tsx`, replace the skeleton block (the content inside `if (loading) { return (...) }`, lines 47-112) with:

```tsx
<div className="space-y-4 sm:space-y-8">
    {/* Header Skeleton */}
    <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
    </div>

    {/* Profile Completion Skeleton */}
    <Skeleton className="h-32 w-full rounded-2xl" />

    {/* Hero Card Skeleton */}
    <div className="bg-surface/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <Skeleton className="aspect-[16/9] md:min-h-[280px]" />
            <div className="p-6 md:p-8 space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-12 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-28 rounded-md" />
                    <Skeleton className="h-7 w-24 rounded-md" />
                </div>
                <div className="flex-1" />
                <div className="flex gap-2 pt-4">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    </div>

    {/* Quick Actions + Announcements Row Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
    </div>

    {/* Event List Skeleton */}
    <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
        </div>
    </div>
</div>
```

- [ ] **Step 2: Verify skeleton renders correctly**

Navigate to `/dashboard` and check the loading skeleton matches the new layout structure (hero card shape, two-column middle row).

- [ ] **Step 3: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat: update dashboard loading skeleton to match new layout"
```

---

## Post-Implementation Checklist

- [ ] Verify all edge cases from the spec:
  - No upcoming events → hero hidden, empty state shown
  - 1 upcoming event → hero only, "Other Upcoming Events" hidden
  - 2+ upcoming events → hero + grid below
  - Unpaid registration → hero without "View Pass"
  - No announcements → placeholder shown
  - Profile at 100% → profile card hidden
- [ ] Check mobile responsiveness (hero stacks, buttons full-width)
- [ ] Final commit with all changes
