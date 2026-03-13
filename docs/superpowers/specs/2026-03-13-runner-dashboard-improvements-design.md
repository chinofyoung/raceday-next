# Runner Dashboard Improvements — Design Spec

## Problem

The runner dashboard feels empty and bare. It currently shows a greeting, a profile completion card, and a grid of event cards — but lacks actionable content that helps runners understand what they need to do next. Three existing components (`RunnerQuickActions`, `RunnerAnnouncements`, `RunnerSidebar`) were built but never wired into the page.

## Solution: Hero Next Race Layout

Restructure the dashboard around a prominent "next race" hero card with supporting actionable sections below it.

## Layout (top to bottom)

### 1. Greeting (unchanged)

- "Hello, {FirstName}" with orange accent
- Subtitle: "Welcome back to your race command center."
- No changes needed.

### 2. Profile Completion Card (unchanged)

- Orange gradient card with circular progress ring
- Hidden when completion reaches 100%
- No changes needed.

### 3. Next Race Hero Card (new)

A large two-column card (stacks vertically on mobile) for the runner's nearest upcoming event.

**Left column:** Event featured image (or fallback gradient with initial letter).

**Right column:**
- Status badges: payment status + kit collection status
- Event name (large, bold)
- Countdown timer: `Xd Xh Xm` in large Barlow Condensed text with "until race day" label
- Detail pills: location (green dot), category (orange dot), race number (orange `#` prefix)
- Action buttons: "View Pass" (orange, only if status is `paid`) + "Details" (outline)

**Behavior:**
- Shows the nearest upcoming event (earliest date, status != completed, event date >= now)
- If no upcoming events exist, this section is not rendered (fall through to empty state in event list)
- If the nearest event is unpaid, the hero still shows but without the "View Pass" button
- Countdown updates in real-time using `setInterval` (every 60 seconds is sufficient)

**Mobile:** Image stacks above content. Countdown text scales down to `text-2xl`. Action buttons go full-width.

**Component:** `NextRaceHero` in `components/dashboard/runner/NextRaceHero.tsx`

**Props:**
```ts
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
```

### 4. Quick Actions + Announcements Row (new layout, modified components)

A two-column grid row (`grid grid-cols-1 md:grid-cols-2 gap-4`):

**Left: Quick Actions** — modify existing `RunnerQuickActions` component
- Current buttons: "Find Races" (green), "View Site", "Apply as Organizer"
- Add: "View Profile" (`/dashboard/profile`), "Settings" (`/dashboard/settings`)
- Remove: "View Site" (low value for a runner dashboard)
- Located at `components/dashboard/RunnerQuickActions.tsx`

**Right: Announcements** — existing `RunnerAnnouncements` component
- Currently fetches from `/api/participant/announcements` which **does not exist**
- **Must create** this API route: aggregates announcements across all events the runner is registered for
- Route: `app/api/participant/announcements/route.ts`
- Query: look up user's registrations, collect their eventIds, fetch announcements for those events
- Shows "No announcements" placeholder when empty (update component to show this instead of returning `null`)

### 5. Volunteer Dashboard (unchanged, repositioned)

- `VolunteerDashboard` is currently rendered in `RunnerView` — keep it in the same relative position (after quick actions row, before event lists)
- No changes needed to the component itself.

### 6. Other Upcoming Events (modified)

- Uses existing `EventRegistrationList` component
- Title changes to "Other Upcoming Events" (was "My Registered Events")
- Filters out the hero event from the list by registration `id` to avoid duplication
- If only 1 upcoming event (the hero), this section is hidden
- If 0 upcoming events, shows existing empty state CTA

### 7. Past Events (unchanged)

- Same `EventRegistrationList` with `isPast={true}`
- De-emphasized styling (opacity, grayscale)
- Hidden when empty

## Abandoned Components

- `RunnerSidebar` (`components/dashboard/runner/RunnerSidebar.tsx`) — intentionally not used. Its stats (upcoming/past counts) are not needed with the hero layout providing clear context. The announcements piece is used directly via `RunnerAnnouncements`. This file can remain as-is (no deletion needed).

## Files to Modify

| File | Change |
|---|---|
| `components/dashboard/runner/NextRaceHero.tsx` | **New** — hero card component with countdown timer |
| `components/dashboard/RunnerView.tsx` | Restructure layout: hero, quick actions + announcements row, volunteer dashboard, event lists |
| `components/dashboard/RunnerQuickActions.tsx` | Add "View Profile" and "Settings" buttons, remove "View Site" |
| `components/dashboard/RunnerAnnouncements.tsx` | Show "No announcements" placeholder instead of returning `null` when empty |
| `app/api/participant/announcements/route.ts` | **New** — API route aggregating announcements for runner's registered events |
| `app/(app)/dashboard/page.tsx` | Update loading skeleton to match new layout structure |

## Files Unchanged

- `RunnerEventCard.tsx` — no changes
- `ProfileCompletionCard.tsx` — no changes
- `EventRegistrationList.tsx` — no changes (filtering done in `RunnerView` before passing events)
- `VolunteerDashboard.tsx` — no changes, just repositioned in layout

## Known Limitations

- `hasApplication` is hardcoded to `false` in `page.tsx` — the "Apply as Organizer" / "Edit Application" toggle will always show "Apply as Organizer". This is a pre-existing issue, not in scope for this change.

## Edge Cases

| Scenario | Behavior |
|---|---|
| No upcoming events | Hero hidden, empty state CTA shown in event list |
| 1 upcoming event | Hero shown, "Other Upcoming Events" section hidden |
| 2+ upcoming events | Hero shows nearest, others in grid below |
| Nearest event unpaid | Hero shows without "View Pass" button |
| No announcements | Announcements panel shows "No announcements yet" placeholder |
| Profile at 100% | Profile card hidden (existing behavior) |
| Volunteer assignments exist | Volunteer dashboard renders between quick actions row and event lists |

## Countdown Timer

- Compute difference between event date and `Date.now()`
- Display as `Xd Xh Xm` format
- Update every 60 seconds via `useEffect` + `setInterval`
- If event is today: show "Today!" instead of countdown
- If event date has passed but status isn't completed: show "In progress" or hide hero

## Styling Notes

All styling follows the existing design system in CLAUDE.md:
- Hero card: `bg-surface/40 border-white/5` with subtle orange border accent (`border-primary/20`), `rounded-2xl`
- Countdown text: `font-bold text-primary` (orange) using Barlow Condensed for brand consistency
- Middle row cards: `bg-white/2 border border-white/6 rounded-xl`
- Quick action buttons match existing `BaseQuickAction` variants
- No new colors, fonts, or patterns introduced
