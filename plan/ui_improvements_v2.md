# UI/UX Improvements Plan — V2

> Comprehensive audit performed on Feb 25, 2026 across desktop (1440px) and mobile (375px) viewports.
> Builds upon the V1 improvements which addressed navigation, layout padding, typography weight, and image optimization.

---

## 1. Dashboard — Organizer View

### 1.1 Tab Navigation Consistency
- **Issue:** Tab labels mix casing — `OVERVIEW` looks uppercase due to `font-black italic uppercase`, while `Events` and `Participants` also use uppercase but visually feel different at different sizes.
- **Fix:** Standardize tab text to `text-sm font-bold uppercase tracking-wider` (remove `italic` from tabs for cleaner readability).
- **File:** `components/dashboard/OrganizerView.tsx` — line ~64

### 1.2 Quick Actions — Mobile Layout
- **Issue:** On mobile, 5 quick action buttons (Create, All Events, View Site, Kiosk, Scanner) wrap awkwardly. The last 2 conditional buttons create an uneven row.
- **Fix:** Use `grid grid-cols-2 sm:grid-cols-3` instead of the current `grid-cols-2 sm:flex`. When there's an odd number of buttons, the last button should span full width: `last:col-span-2 sm:last:col-span-1`.
- **File:** `components/dashboard/organizer/OrganizerQuickActions.tsx`

### 1.3 Active Events Card — Density
- **Issue:** Event cards in the dashboard Events tab feel vertically stretched. The stats grid, kit fulfillment progress, and action buttons create excessive vertical space.
- **Fix:** Combine "Runners" count and "Location" into a single row. Reduce padding from `p-4` to `p-3` on mobile. Make the kit progress bar inline with a text label.
- **File:** `components/dashboard/organizer/OrganizerActiveEvents.tsx`

### 1.4 Draft Events Notice
- **Issue:** The drafts notice sidebar is empty/minimal when there are no drafts, wasting horizontal space.
- **Fix:** When drafts count is 0, collapse the sidebar on desktop or show a motivational CTA instead of an empty slot.
- **File:** `components/dashboard/organizer/OrganizerDraftsNotice.tsx`

---

## 2. Dashboard — Runner View

### 2.1 Event Card Image Loading
- **Issue:** Event cards with no featured image show a generic icon but the fallback doesn't convey visual energy.
- **Fix:** Use a gradient placeholder with the event name overlaid, or a default running illustration SVG.
- **File:** `components/dashboard/RunnerView.tsx` — `renderEventCard` function

### 2.2 Profile Completion Card
- **Issue:** The profile completion card uses a linear progress bar that doesn't pop visually on the dark theme.
- **Fix:** Use a circular/radial progress indicator with a glowing ring effect, or add a subtle gradient to the progress bar.
- **File:** `components/dashboard/RunnerView.tsx`

### 2.3 Empty State for Past Events
- **Issue:** When a runner has no past events, there's no empty state messaging.
- **Fix:** Add an encouraging empty state with an illustration: "Your finish line awaits! Register for your first race."
- **File:** `components/dashboard/RunnerView.tsx`

---

## 3. Marketing Pages

### 3.1 Homepage — Stats Grid Mobile
- **Issue:** The 4-column stats section (50+, 10K+, 200+, 30s) has very small text on mobile (375px), making the numbers hard to scan quickly.
- **Fix:** Change from `grid-cols-4` to `grid-cols-2 md:grid-cols-4` on mobile for better readability. Increase stat number size on mobile.
- **File:** `app/(marketing)/page.tsx` — stats section (~line 85-118)

### 3.2 Homepage — Featured Events Section
- **Issue:** If an event has a placeholder or low-quality featured image (e.g., a "lion cub" image), it undermines the premium feel.
- **Fix:** Add a blurred dominant-color placeholder while images load. Consider implementing blur hash or a CSS gradient fallback.
- **File:** `app/(marketing)/page.tsx` — featured events section

### 3.3 For Organizers — Mock Dashboard Placeholder
- **Issue:** The "Dashboard Preview" section uses animated pulse divs as a placeholder for a real screenshot. This looks like a broken loading state rather than a preview.
- **Fix:** Replace the animated placeholder with a static screenshot or a high-fidelity mockup image of the actual organizer dashboard. Capture a real screenshot and use it.
- **File:** `app/(marketing)/for-organizers/page.tsx` — lines 87-101

### 3.4 For Organizers — Feature Card Icons
- **Issue:** Feature card icons (Zap, BarChart3, QrCode) are `size={24}` inside `w-12 h-12` containers, making them feel small relative to the large cards.
- **Fix:** Increase icon size to `size={28}` or `size={32}`, and add a subtle background glow (`shadow-[0_0_15px]`) matching the icon color.
- **File:** `app/(marketing)/for-organizers/page.tsx` — lines 52-56

### 3.5 About Page — Team Placeholders
- **Issue:** The "Core Team" section uses empty gray circles (`w-12 h-12 bg-white/10 rounded-full`) instead of real photos or avatars.
- **Fix:** Either add real team photos, or generate professional 3D-style avatar illustrations using initials with vibrant gradient backgrounds.
- **File:** `app/(marketing)/about/page.tsx` — lines 44-46

### 3.6 About Page — Contact Cards Hover
- **Issue:** The "Location" card has no hover effect (it's a `div` not an `a` tag), but it sits next to interactive cards that do, creating inconsistency.
- **Fix:** Add a consistent hover border/glow even for non-link cards, or visually differentiate them so the lack of interaction is expected.
- **File:** `app/(marketing)/about/page.tsx` — lines 79-84

---

## 4. Events Directory

### 4.1 Search Clear Button
- **Issue:** When a user types in the search bar, there's no "X" clear button to quickly reset the search.
- **Fix:** Add a conditional clear button (`X` icon) inside the input that appears when `searchTerm.length > 0`.
- **File:** `app/(marketing)/events/page.tsx`

### 4.2 Filter Scroll Indicator
- **Issue:** On mobile, the horizontally scrollable distance filters have no visual cue that more filters exist off-screen.
- **Fix:** Add a subtle right-edge fade using CSS `mask-image: linear-gradient(to right, black 85%, transparent 100%)` on the scroll container.
- **File:** `app/(marketing)/events/page.tsx`

### 4.3 Event Grid Spacing
- **Issue:** The vertical gap between the filter row and the event card grid is tight on desktop.
- **Fix:** Increase `space-y-8` to `space-y-10` or add `mt-10` above the grid container.
- **File:** `app/(marketing)/events/page.tsx`

---

## 5. Footer

### 5.1 Social Links — Missing URLs
- **Issue:** Twitter, Instagram, Facebook links in the footer all point to `#`, which is a dead link.
- **Fix:** Either add real social URLs, or hide these links until real URLs are configured.
- **File:** `components/layout/Footer.tsx` — lines 42-44

### 5.2 Footer — Mobile Grid
- **Issue:** On mobile, the 4-column footer grid stacks vertically with large gaps, pushing the copyright far down.
- **Fix:** Use `grid-cols-2 md:grid-cols-4` to keep Explore + Legal side by side on mobile.
- **File:** `components/layout/Footer.tsx` — line 7

---

## 6. Global / Cross-Cutting

### 6.1 Loading State Consistency
- **Issue:** The dashboard uses a full-page "Loading Dashboard..." spinner, while other pages use skeleton screens. This creates an inconsistent loading experience.
- **Fix:** Replace the full-page spinner with granular skeleton screens that match the final layout structure.
- **File:** `app/(app)/dashboard/page.tsx`

### 6.2 Active Navigation Indicator
- **Issue:** In the mobile navigation drawer, there's no indicator for the currently active page.
- **Fix:** Add an `isActive` check using `usePathname()` and apply `text-primary border-l-2 border-primary` to the active link.
- **File:** `components/layout/Navbar.tsx`

### 6.3 `prefers-reduced-motion` Support
- **Issue:** Several components use `animate-in`, `animate-pulse`, and CSS transitions without checking the user's motion preferences.
- **Fix:** Add a global CSS rule: `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
- **File:** `app/globals.css`

### 6.4 `cursor-pointer` on Interactive Cards
- **Issue:** Event cards, stat cards, and team member cards don't show `cursor-pointer`, making them feel non-interactive even though they link somewhere.
- **Fix:** Add `cursor-pointer` to all clickable Card wrappers.
- **Files:** `components/events/EventCard.tsx`, `components/dashboard/organizer/OrganizerActiveEvents.tsx`

---

## Priority Order

| Priority | Items | Impact |
|----------|-------|--------|
| **P0 — Critical** | 6.1 Loading states, 3.3 Mock dashboard, 3.5 Team placeholders | UX polish, first-impression |
| **P1 — High** | 1.1 Tab consistency, 1.2 Quick actions grid, 4.1 Search clear, 6.2 Active nav | Interaction clarity |
| **P2 — Medium** | 3.1 Stats grid mobile, 3.4 Icon sizes, 2.1 Image fallbacks, 5.2 Footer grid | Visual refinement |
| **P3 — Minor** | 1.3 Card density, 3.6 Contact hover, 4.2 Scroll indicator, 5.1 Social links, 6.3 Reduced motion, 6.4 Cursor pointer | Polish & accessibility |
