# Dashboard Design Language Migration

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all dashboard pages and components from old typography/styling patterns to the "Clean & Confident" design language already applied to marketing pages.

**Architecture:** Pure CSS/className refactoring — no logic, state, or structural changes. Every file gets the same set of find-and-replace transformations applied to Tailwind classes.

**Tech Stack:** Next.js, React, Tailwind CSS v4, shadcn/ui

---

## Global Migration Rules

These transformations apply to ALL files in every task:

| Old Pattern | New Pattern | Scope |
|---|---|---|
| `font-black italic uppercase tracking-tighter` on headings | `font-bold tracking-tight` sentence case | All h1-h4, heading elements |
| `font-black italic` on stat numbers | `font-bold` | Stat values, KPI numbers |
| `text-[8px]`, `text-[9px]`, `text-[10px]` | `text-xs` | All instances |
| `italic` on labels/body text | Remove `italic` | Unless purely decorative |
| `tracking-widest` on labels | `tracking-wider` | Small uppercase labels |
| `rounded-[2rem]`, `rounded-[2.5rem]`, `rounded-[3rem]` | `rounded-2xl` | All instances |
| `uppercase` on headings/buttons | Remove `uppercase` (sentence case) | Headings, buttons, titles |
| `uppercase` on small labels/badges | **Keep** `uppercase` | Badges, step indicators, table headers only |
| `font-black` anywhere | `font-bold` | All instances |
| `font-bold italic` on subtitles | `font-medium` remove `italic` | Subtitle/description text |

---

## Task 1: Runner Dashboard Core

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `components/dashboard/RunnerView.tsx`
- Modify: `components/dashboard/RunnerQuickActions.tsx`
- Modify: `components/dashboard/RunnerAnnouncements.tsx`
- Modify: `components/dashboard/runner/RunnerEventCard.tsx`
- Modify: `components/dashboard/runner/RunnerSidebar.tsx`
- Modify: `components/dashboard/runner/EventRegistrationList.tsx`
- Modify: `components/dashboard/runner/ProfileCompletionCard.tsx`

- [ ] **Step 1: Update `app/(app)/dashboard/page.tsx`**

Line 49: `rounded-[2rem]` → `rounded-2xl`
Line 118: `font-black italic uppercase tracking-tight` → `font-bold tracking-tight`
Line 121: `font-medium italic` → `font-medium` (remove italic)

- [ ] **Step 2: Update `components/dashboard/runner/RunnerEventCard.tsx`**

Line 40: `text-4xl font-black italic text-white/10 ... uppercase` → `text-4xl font-bold text-white/10 ...` (remove italic, uppercase)
Line 51: `text-lg font-black italic uppercase text-white leading-tight tracking-tight` → `text-lg font-bold text-white leading-tight tracking-tight`
Line 59: `text-[10px] font-black italic uppercase` → `text-xs font-semibold uppercase` (badge — keep uppercase)
Line 67: `text-[10px] font-black italic uppercase` → `text-xs font-semibold uppercase` (badge — keep uppercase)
Line 81: `text-[10px] font-bold italic uppercase tracking-wider` → `text-xs font-semibold uppercase tracking-wider` (label — keep uppercase)
Line 88: `text-[10px] font-bold text-text-muted uppercase italic tracking-wider` → `text-xs font-semibold text-text-muted uppercase tracking-wider` (label — keep uppercase)
Line 99: `font-black` → `font-bold`

- [ ] **Step 3: Update remaining runner components**

Apply global rules to `RunnerView.tsx`, `RunnerQuickActions.tsx`, `RunnerAnnouncements.tsx`, `RunnerSidebar.tsx`, `EventRegistrationList.tsx`, `ProfileCompletionCard.tsx`. Search each file for old patterns and apply migration rules.

- [ ] **Step 4: Build check**

Run: `cd /Users/chinoyoung/Code/raceday-next && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/page.tsx components/dashboard/RunnerView.tsx components/dashboard/RunnerQuickActions.tsx components/dashboard/RunnerAnnouncements.tsx components/dashboard/runner/
git commit -m "style: migrate runner dashboard to Clean & Confident design language"
```

---

## Task 2: Organizer Dashboard Components

**Files:**
- Modify: `app/(app)/dashboard/organizer/page.tsx`
- Modify: `components/dashboard/OrganizerView.tsx`
- Modify: `components/dashboard/organizer/OrganizerStats.tsx`
- Modify: `components/dashboard/organizer/OrganizerActiveEvents.tsx`
- Modify: `components/dashboard/organizer/OrganizerRegistrationsFeed.tsx`
- Modify: `components/dashboard/organizer/OrganizerRevenueStats.tsx`
- Modify: `components/dashboard/organizer/OrganizerKitFulfillment.tsx`
- Modify: `components/dashboard/organizer/OrganizerQuickActions.tsx`
- Modify: `components/dashboard/organizer/OrganizerDraftsNotice.tsx`
- Modify: `components/dashboard/organizer/DraggableWidget.tsx`

- [ ] **Step 1: Update `components/dashboard/organizer/OrganizerStats.tsx`**

Line 26: `text-[10px] font-bold text-primary uppercase tracking-widest` → `text-xs font-semibold text-primary uppercase tracking-wider` (badge — keep uppercase)
Line 30: `text-4xl font-black italic tracking-tight` → `text-4xl font-bold tracking-tight`
Line 31: `text-xs font-bold uppercase tracking-widest text-text-muted italic` → `text-xs font-semibold uppercase tracking-wider text-text-muted` (label — keep uppercase, remove italic)
Lines 46-47, 61, 65-66, 78, 83, 86: Apply same patterns

- [ ] **Step 2: Update `app/(app)/dashboard/organizer/page.tsx`**

Line 161 (or wherever heading is): `font-black italic uppercase tracking-tight` → `font-bold tracking-tight`
Apply global rules to all other instances.

- [ ] **Step 3: Update remaining organizer components**

Apply global rules to `OrganizerView.tsx`, `OrganizerActiveEvents.tsx`, `OrganizerRegistrationsFeed.tsx`, `OrganizerRevenueStats.tsx`, `OrganizerKitFulfillment.tsx`, `OrganizerQuickActions.tsx`, `OrganizerDraftsNotice.tsx`, `DraggableWidget.tsx`.

- [ ] **Step 4: Build check**

Run: `cd /Users/chinoyoung/Code/raceday-next && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/organizer/ components/dashboard/OrganizerView.tsx components/dashboard/organizer/
git commit -m "style: migrate organizer dashboard to Clean & Confident design language"
```

---

## Task 3: Admin Dashboard Pages

**Files:**
- Modify: `app/(app)/dashboard/admin/page.tsx`
- Modify: `app/(app)/dashboard/admin/users/page.tsx`
- Modify: `app/(app)/dashboard/admin/applications/page.tsx`
- Modify: `app/(app)/dashboard/admin/applications/components/ApplicationCard.tsx`
- Modify: `app/(app)/dashboard/admin/events/page.tsx`
- Modify: `app/(app)/dashboard/admin/analytics/page.tsx`
- Modify: `app/(app)/dashboard/admin/logs/page.tsx`
- Modify: `components/admin/AdminOverviewChart.tsx`
- Modify: `components/admin/AnalyticsCharts.tsx`

- [ ] **Step 1: Update `app/(app)/dashboard/admin/page.tsx`** (highest density — 25+ instances)

Apply all global migration rules. Key changes:
- Line 129: heading `font-black italic uppercase` → `font-bold tracking-tight`
- Lines 150, 162, 174, 186: `text-[10px] font-black uppercase tracking-widest text-text-muted italic` → `text-xs font-semibold uppercase tracking-wider text-text-muted`
- Line 201: `text-xl font-black italic uppercase tracking-tight` → `text-xl font-bold tracking-tight`
- Line 215: `text-2xl font-black italic uppercase tracking-tight` → `text-2xl font-bold tracking-tight`
- Line 228: `font-bold italic uppercase` → `font-bold`
- Line 232: `font-black italic uppercase tracking-widest` → `font-semibold uppercase tracking-wider`

- [ ] **Step 2: Update remaining admin pages**

Apply global rules to `users/page.tsx`, `applications/page.tsx`, `ApplicationCard.tsx`, `events/page.tsx`, `analytics/page.tsx`, `logs/page.tsx`.

- [ ] **Step 3: Update admin components**

Apply global rules to `AdminOverviewChart.tsx` and `AnalyticsCharts.tsx`.

- [ ] **Step 4: Build check**

Run: `cd /Users/chinoyoung/Code/raceday-next && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/admin/ components/admin/
git commit -m "style: migrate admin dashboard to Clean & Confident design language"
```

---

## Task 4: Settings, Profile & Become-Organizer Forms

**Files:**
- Modify: `app/(app)/dashboard/profile/page.tsx`
- Modify: `app/(app)/dashboard/settings/page.tsx`
- Modify: `app/(app)/dashboard/settings/ProfileForm.tsx`
- Modify: `app/(app)/dashboard/settings/OrganizerProfileForm.tsx`
- Modify: `app/(app)/dashboard/become-organizer/page.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/OrganizerFormStepper.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/Step1OrgInfo.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/Step2Contact.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/Step3Address.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/Step4Verification.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/OrganizerFormSummary.tsx`

- [ ] **Step 1: Update form components**

Apply global rules. Key patterns in form files:
- Form labels: `text-[10px] font-bold uppercase` → `text-xs font-semibold uppercase tracking-wider`
- Page headings: `font-black italic uppercase` → `font-bold tracking-tight`
- Step indicators in stepper: keep `uppercase` on step labels

- [ ] **Step 2: Update become-organizer components**

Apply global rules to all 5 step components and the stepper/summary.

- [ ] **Step 3: Build check**

Run: `cd /Users/chinoyoung/Code/raceday-next && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/(app)/dashboard/profile/ app/(app)/dashboard/settings/ app/(app)/dashboard/become-organizer/
git commit -m "style: migrate settings and forms to Clean & Confident design language"
```

---

## Task 5: Volunteer, Shared & Remaining Components

**Files:**
- Modify: `components/dashboard/volunteer/VolunteerDashboard.tsx`
- Modify: `components/dashboard/organizer/VolunteerManagement.tsx`
- Modify: `components/dashboard/organizer/InviteVolunteerDialog.tsx`
- Modify: `components/dashboard/organizer/DemographicsTab.tsx`
- Modify: `components/dashboard/AnnouncementsTab.tsx`
- Modify: `components/dashboard/shared/BaseQuickAction.tsx`
- Modify: `app/(app)/dashboard/organizer/scanner/page.tsx`
- Modify: `app/(app)/dashboard/organizer/kiosk/page.tsx`
- Modify: `app/(app)/dashboard/organizer/registrations/page.tsx`
- Modify: `app/(app)/dashboard/organizer/events/page.tsx`
- Modify: `app/(app)/dashboard/organizer/events/create/page.tsx`
- Modify: `app/(app)/dashboard/organizer/events/[id]/page.tsx`
- Modify: `app/(app)/dashboard/organizer/events/[id]/edit/page.tsx`
- Modify: `app/(app)/dashboard/organizer/events/[id]/scanner/page.tsx`
- Modify: `app/(app)/dashboard/organizer/events/[id]/kiosk/page.tsx`
- Modify: `app/(app)/dashboard/events/[id]/qr/page.tsx`

- [ ] **Step 1: Update volunteer components**

Apply global rules to `VolunteerDashboard.tsx`, `VolunteerManagement.tsx`, `InviteVolunteerDialog.tsx`.

- [ ] **Step 2: Update demographics and announcements**

Apply global rules to `DemographicsTab.tsx` and `AnnouncementsTab.tsx`.

- [ ] **Step 3: Update organizer sub-pages**

Apply global rules to scanner, kiosk, registrations, events list, event create, event detail, event edit, event scanner, event kiosk pages.

- [ ] **Step 4: Update shared and QR pages**

Apply global rules to `BaseQuickAction.tsx` and `events/[id]/qr/page.tsx`.

- [ ] **Step 5: Build check**

Run: `cd /Users/chinoyoung/Code/raceday-next && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/volunteer/ components/dashboard/organizer/VolunteerManagement.tsx components/dashboard/organizer/InviteVolunteerDialog.tsx components/dashboard/organizer/DemographicsTab.tsx components/dashboard/AnnouncementsTab.tsx components/dashboard/shared/ app/(app)/dashboard/organizer/ app/(app)/dashboard/events/
git commit -m "style: migrate volunteer, shared, and remaining dashboard components to Clean & Confident design language"
```

---

## Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md design language scope**

Change line 14 from:
`All marketing/public-facing pages follow this design system. Dashboard/app pages may differ.`
To:
`All pages follow this design system — marketing, dashboard, and app pages alike.`

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: extend design language scope to include dashboard pages"
```
