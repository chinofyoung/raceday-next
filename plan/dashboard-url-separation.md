# Separate Runner & Organizer Dashboards into Different URLs

Replace the current state-based tab toggle (`DashboardModeProvider`) with URL-based routing so each dashboard has its own route, enabling cleaner data fetching, role-guarded layouts, and deep-linkable URLs.

## User Review Required

> [!IMPORTANT]
> **URL Structure Decision**: The plan proposes `/dashboard` for the runner view and `/dashboard/organizer` for the organizer view. An alternative is `/runner` and `/organizer` at the top level. Which do you prefer?

> [!WARNING]
> **Organizer sub-pages move**: Pages like `events/`, `events/create/`, `events/[id]/`, `registrations/` will move under `/dashboard/organizer/`. All existing links (Navbar, EventCard, QuickActions, etc.) will be updated. Bookmarked old URLs will break.

---

## Current Architecture

```
/dashboard          → page.tsx renders OrganizerView OR RunnerView via DashboardModeProvider state
/dashboard/events/  → Organizer-only event management
/dashboard/events/[id]/ → Event detail (participants, stats, announcements)
/dashboard/events/create/ → Create event
/dashboard/registrations/ → Organizer registrations overview
/dashboard/settings/ → Shared (profile + organizer tabs)
```

The `DashboardModeProvider` stores mode in `localStorage` and provides a `runner | organizer` toggle. It's consumed only in `dashboard/page.tsx`.

---

## Proposed Architecture

```
/dashboard/                     → Runner dashboard (default for all users)
  ├── settings/                 → Shared settings (unchanged URL)
  ├── profile/                  → Profile page (unchanged)
  └── become-organizer/         → Become organizer flow (unchanged)

/dashboard/organizer/           → Organizer dashboard home (role-guarded)
  ├── layout.tsx [NEW]          → Role guard + organizer nav
  ├── events/                   → Event management (moved from /dashboard/events)
  │   ├── create/
  │   └── [id]/
  │       ├── edit/
  │       ├── scanner/
  │       ├── kiosk/
  │       └── qr/
  └── registrations/            → Moved from /dashboard/registrations
```

---

## Proposed Changes

### 1. New Organizer Layout

#### [NEW] `app/(app)/dashboard/organizer/layout.tsx`

Role-guarded layout that redirects non-organizer users to `/dashboard`. Wraps organizer pages with a consistent shell.

```tsx
// Checks useAuth().role — if not "organizer" or "admin", redirect to /dashboard
// Provides organizer-specific context if needed
```

---

### 2. New Organizer Dashboard Page

#### [NEW] `app/(app)/dashboard/organizer/page.tsx`

Move the organizer-specific data fetching logic from the current `dashboard/page.tsx` into this page. Will use `OrganizerView` directly without any conditional branching.

Key changes from current `page.tsx`:
- Only fetches organizer queries (no `"skip"` conditional)
- No `useDashboardMode` dependency
- Imports and renders `DashboardHeader` with organizer context
- Renders `OrganizerView` directly

---

### 3. Move Organizer Sub-pages

#### [MOVE] `dashboard/events/` → `dashboard/organizer/events/`
#### [MOVE] `dashboard/events/[id]/` → `dashboard/organizer/events/[id]/`
#### [MOVE] `dashboard/events/[id]/edit/` → `dashboard/organizer/events/[id]/edit/`
#### [MOVE] `dashboard/events/[id]/scanner/` → `dashboard/organizer/events/[id]/scanner/`
#### [MOVE] `dashboard/events/[id]/kiosk/` → `dashboard/organizer/events/[id]/kiosk/`
#### [MOVE] `dashboard/events/[id]/qr/` → `dashboard/organizer/events/[id]/qr/`
#### [MOVE] `dashboard/events/create/` → `dashboard/organizer/events/create/`
#### [MOVE] `dashboard/registrations/` → `dashboard/organizer/registrations/`

All these pages will be physically moved to the new directory. Internal "Back to Dashboard" links will update to point to `/dashboard/organizer`.

---

### 4. Simplify Runner Dashboard

#### [MODIFY] `app/(app)/dashboard/page.tsx`

Strip out all organizer-related code. This page becomes the runner-only dashboard:
- Remove `useDashboardMode` import and usage
- Remove all organizer queries (`convexEvents`, `organizerRegistrations`)
- Remove all organizer computed values (`stats`, `eventKitStats`, `eventRevenue`, etc.)
- Only fetch `convexRegistrations` for the logged-in user
- Render `RunnerView` directly
- Update `DashboardHeader` to show a "Switch to Organizer" link (not toggle)

---

### 5. Update DashboardHeader

#### [MODIFY] `components/dashboard/DashboardHeader.tsx`

Replace the mode toggle buttons with a navigation link:
- Remove `setMode` prop
- Remove toggle button group
- If user is organizer/admin and on runner dashboard: show "Organizer Dashboard →" link to `/dashboard/organizer`
- If on organizer dashboard: show "Runner Dashboard →" link to `/dashboard`
- Infer current view from a new `currentView` prop or `pathname`

---

### 6. Remove/Simplify DashboardModeProvider

#### [MODIFY] `components/providers/DashboardModeProvider.tsx`

Either **delete** this file or simplify it to only provide role info. The mode is now determined by the URL path, not state.

#### [MODIFY] `app/(app)/layout.tsx`

Remove `DashboardModeProvider` wrapper if fully deleted. If simplified, keep it for role-awareness.

---

### 7. Update All Internal Links

The following files contain hardcoded `/dashboard` links that need updating:

| File | Current Link | New Link |
|------|-------------|----------|
| [Navbar.tsx](file:///Users/chinoyoung/Code/raceday-next/components/layout/Navbar.tsx) | `/dashboard/events` | `/dashboard/organizer/events` |
| [EventCard.tsx](file:///Users/chinoyoung/Code/raceday-next/components/events/EventCard.tsx) | `/dashboard/events/${id}`, `/dashboard/events/${id}/edit` | `/dashboard/organizer/events/${id}`, `…/edit` |
| [EventHero.tsx](file:///Users/chinoyoung/Code/raceday-next/components/event/EventHero.tsx) | `/dashboard/events/${id}/edit` | `/dashboard/organizer/events/${id}/edit` |
| [EventForm.tsx](file:///Users/chinoyoung/Code/raceday-next/components/forms/event/EventForm.tsx) | `/dashboard/events` | `/dashboard/organizer/events` |
| [OrganizerQuickActions.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/organizer/OrganizerQuickActions.tsx) | `/dashboard/events/create`, `/dashboard/events`, kiosk, scanner | Add `/organizer/` prefix |
| [OrganizerActiveEvents.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/organizer/OrganizerActiveEvents.tsx) | `/dashboard/events/create`, `/dashboard/events/${id}`, scanner | Add `/organizer/` prefix |
| [OrganizerDraftsNotice.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/organizer/OrganizerDraftsNotice.tsx) | `/dashboard/events` | `/dashboard/organizer/events` |
| [OrganizerRegistrationsFeed.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/organizer/OrganizerRegistrationsFeed.tsx) | `/dashboard/registrations` | `/dashboard/organizer/registrations` |
| [VolunteerDashboard.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/volunteer/VolunteerDashboard.tsx) | `/dashboard/events/${id}/kiosk`, `/dashboard/events/${id}` | `/dashboard/organizer/events/…` |
| [RunnerEventCard.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/runner/RunnerEventCard.tsx) | `/dashboard/events/${id}/qr` | `/dashboard/organizer/events/${id}/qr` |
| [EventDetailPage.tsx](file:///Users/chinoyoung/Code/raceday-next/app/(app)/dashboard/events/[id]/page.tsx) | `/dashboard` (back link) | `/dashboard/organizer` |

> [!NOTE]
> **Shared pages** (`/dashboard/settings`, `/dashboard/profile`, `/dashboard/become-organizer`) keep their current URLs since they serve both runners and organizers. Their "Back to Dashboard" links should intelligently link to the appropriate dashboard based on where the user came from, or default to `/dashboard`.

---

## Files Not Changed

These remain as-is:
- `components/dashboard/OrganizerView.tsx` — component stays, just imported from new page
- `components/dashboard/RunnerView.tsx` — component stays, imported from existing page  
- `components/dashboard/organizer/*` — all sub-components remain unchanged
- `components/dashboard/runner/*` — all sub-components remain unchanged
- `app/(app)/dashboard/settings/` — stays at current URL
- `app/(app)/dashboard/admin/` — stays at current URL

---

## Verification Plan

### Manual Verification

Since there are no existing automated tests in this project, verification will be manual:

1. **Runner Dashboard** (`/dashboard`)
   - Log in as a **runner** (non-organizer) user
   - Verify the runner dashboard loads with registrations, profile completion, sidebar
   - Verify there is NO organizer toggle — instead a "Become an Organizer" CTA should appear
   - Verify settings link works → `/dashboard/settings`

2. **Organizer Dashboard** (`/dashboard/organizer`)
   - Log in as an **organizer** user
   - Navigate to `/dashboard/organizer`
   - Verify stats, events, participants tabs all render correctly
   - Verify "Create Event" → `/dashboard/organizer/events/create` works
   - Verify "Manage Events" → `/dashboard/organizer/events` works
   - Verify clicking an event → `/dashboard/organizer/events/[id]` works
   - Verify "Back to Dashboard" links point to `/dashboard/organizer`

3. **Role Guard**
   - Log in as a **runner** user  
   - Navigate directly to `/dashboard/organizer` — should redirect to `/dashboard`

4. **Dashboard Switching**
   - Log in as an **organizer** user
   - From `/dashboard` (runner view), click "Organizer Dashboard" link → should navigate to `/dashboard/organizer`
   - From `/dashboard/organizer`, click "Runner Dashboard" link → should navigate to `/dashboard`

5. **Navbar Links**
   - Verify "Dashboard" link in navbar goes to `/dashboard`
   - Verify "Manage Events" link goes to `/dashboard/organizer/events`
   - Verify active states highlight correctly on both dashboards

6. **Event Detail Flow**
   - From organizer dashboard, click into an event detail
   - Verify all tabs work (participants, stats, revenue, announcements, volunteers)
   - Verify "Back to Dashboard" goes to `/dashboard/organizer`
   - Verify edit, clone, kiosk, scanner links all work

7. **Mobile Navigation**
   - Open hamburger menu on mobile
   - Verify dashboard links work correctly
   - Verify organizer-specific links appear only for organizer/admin users
