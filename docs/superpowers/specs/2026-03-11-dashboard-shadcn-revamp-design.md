# Dashboard shadcn Revamp — Design Spec

## Overview

Progressive revamp of all dashboard views (Runner, Organizer, Admin) to use shadcn/ui components for consistency. Replaces all custom UI components with shadcn equivalents and introduces a collapsible sidebar layout shell with role switching.

## Goals

- Consistent component library across the entire dashboard
- Modern collapsible sidebar navigation pattern
- Clean role switching between Runner/Organizer/Admin
- Maintain existing dark theme (orange primary, green CTA, Barlow fonts)
- No changes to data layer — Convex queries, hooks, and services remain as-is

## Non-Goals

- Marketing/public pages are out of scope
- Backend/API changes
- New features or functionality — this is a UI-only migration

---

## Architecture

### Layout Shell

A new shared dashboard layout at `app/(app)/dashboard/layout.tsx` using shadcn's `SidebarProvider` + `Sidebar`. Replaces the current `PageWrapper` + `Navbar` pattern within dashboard routes.

Structure:
```
SidebarProvider
├── Sidebar (collapsible)
│   ├── SidebarHeader — Logo + Role Switcher (DropdownMenu)
│   ├── SidebarContent — Nav groups (dynamic per role)
│   └── SidebarFooter — Clerk UserButton + user info
├── SidebarInset
│   ├── TopBar — SidebarTrigger + Breadcrumb + actions
│   └── <main> — Page content (children)
```

### Role Switcher

- `DropdownMenu` at the top of the sidebar
- Shows current role name + icon
- Options: Runner, Organizer, Admin (filtered by user's actual roles)
- Selecting a role navigates to the corresponding route:
  - Runner → `/dashboard`
  - Organizer → `/dashboard/organizer`
  - Admin → `/dashboard/admin`
- Active role is inferred from the current route path

### Sidebar Navigation

Nav items change based on active role:

**Runner:**
- Overview (`/dashboard`)
- My Events (`/dashboard/events`)
- Profile (`/dashboard/profile`)
- Settings (`/dashboard/settings`)

**Organizer:**
- Overview (`/dashboard/organizer`)
- Events (`/dashboard/organizer/events`)
- Registrations (`/dashboard/organizer/registrations`)
- Settings (`/dashboard/settings`)

**Admin:**
- Overview (`/dashboard/admin`)
- Users (`/dashboard/admin/users`)
- Events (`/dashboard/admin/events`)
- Applications (`/dashboard/admin/applications`)
- Analytics (`/dashboard/admin/analytics`)
- Audit Logs (`/dashboard/admin/logs`)

**Mobile:** Sidebar renders as a `Sheet` (slide-over from left) triggered by a hamburger button in the top bar.

**Collapsed state:** Icon-only sidebar. Hovering shows tooltips with labels.

---

## Component Migration

### Replaced Components

| Custom Component | shadcn Replacement | Notes |
|---|---|---|
| `components/ui/Button.tsx` | `button` | Map variants: primary→default, secondary→secondary, outline→outline, ghost→ghost, danger→destructive |
| `components/ui/Card.tsx` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter) | `card` | Direct 1:1 mapping, same sub-component names |
| `components/ui/Badge.tsx` | `badge` | Map variants: primary→default, success/warning/error as custom variants, cta as custom |
| `components/ui/Input.tsx` | `input` | Straightforward swap |
| `components/ui/Select.tsx` | `select` | Switch to shadcn Select with content/trigger pattern |
| `components/ui/Textarea.tsx` | `textarea` | Straightforward swap |
| `components/ui/Modal.tsx` | `dialog` | Map to Dialog + DialogContent/DialogHeader/DialogTitle/DialogDescription |
| `components/ui/ConfirmModal.tsx` | `alert-dialog` | Map to AlertDialog pattern |
| `components/shared/Skeleton.tsx` | `skeleton` | Replace custom Skeleton, keep specialized skeletons (EventCardSkeleton, etc.) using shadcn Skeleton as building block |

### New Components

| shadcn Component | Purpose |
|---|---|
| `sidebar` | Main dashboard navigation shell |
| `dropdown-menu` | Role switcher, action menus |
| `tabs` | Section switching in organizer/admin views |
| `table` | Registration lists, user management, event lists |
| `sheet` | Mobile sidebar, slide-over panels |
| `breadcrumb` | Navigation context in top bar |
| `separator` | Visual dividers in sidebar and content |
| `tooltip` | Collapsed sidebar icon labels |

---

## Theme Configuration

### shadcn CSS Variables

Map existing design tokens to shadcn's CSS variable system in `globals.css`:

```
--background: #1f2937 (current bg)
--foreground: #f8fafc (current text)
--card: #374151 (current surface)
--card-foreground: #f8fafc
--primary: #f97316 (orange)
--primary-foreground: #ffffff
--secondary: #fb923c (light orange)
--secondary-foreground: #ffffff
--muted: #374151
--muted-foreground: #94a3b8 (text-muted)
--accent: #374151
--accent-foreground: #f8fafc
--destructive: #ef4444
--destructive-foreground: #ffffff
--border: rgba(255,255,255,0.05)
--input: rgba(255,255,255,0.05)
--ring: #f97316
--sidebar-background: #374151
--sidebar-foreground: #f8fafc
--sidebar-primary: #f97316
--sidebar-primary-foreground: #ffffff
--sidebar-accent: rgba(255,255,255,0.05)
--sidebar-accent-foreground: #f8fafc
--sidebar-border: rgba(255,255,255,0.05)
```

### Fonts

- Keep Barlow Condensed for headings and Barlow for body
- Configure in tailwind as `font-heading` and `font-body`

### Custom Additions

- CTA color (`#22c55e`) as a custom Badge variant and Button variant
- Maintain frosted glass/backdrop-blur effects as utility classes

---

## Rollout Phases

### Phase 1 — Foundation
- Initialize shadcn/ui (`npx shadcn@latest init`)
- Configure theme CSS variables in `globals.css`
- Install base components: `button`, `card`, `badge`, `skeleton`
- Verify build works with both old and new components coexisting

### Phase 2 — Dashboard Shell
- Create new `app/(app)/dashboard/layout.tsx` with SidebarProvider
- Install: `sidebar`, `dropdown-menu`, `sheet`, `breadcrumb`, `separator`, `tooltip`
- Build `DashboardSidebar` component with role switcher and dynamic nav
- Build `DashboardTopBar` component with breadcrumbs
- Remove dashboard-specific usage of top Navbar (keep for marketing pages)

### Phase 3 — Shared Component Migration
- Replace all imports of custom `Card`, `Button`, `Badge`, `Skeleton` with shadcn versions across dashboard
- Add custom Badge variants (success, warning, cta) to match current usage
- Add CTA Button variant
- Delete old custom component files once no longer imported anywhere

### Phase 4 — Runner Dashboard
- Revamp `DashboardHeader` → integrate into sidebar/topbar
- Revamp `RunnerView` with shadcn Card grid
- Revamp `ProfileCompletionCard`, `RunnerEventCard`, `RunnerSidebar`
- Revamp `RunnerQuickActions` using shadcn Button
- Update loading skeletons to use shadcn Skeleton

### Phase 5 — Organizer Dashboard
- Revamp `OrganizerView` — use shadcn Tabs for section switching
- Revamp `OrganizerStats` KPI cards
- Install `table` — revamp `OrganizerRegistrationsFeed` with shadcn Table
- Revamp `OrganizerActiveEvents`, `OrganizerKitFulfillment`, `OrganizerRevenueStats`
- Restyle recharts containers with shadcn Card

### Phase 6 — Admin Dashboard
- Revamp admin page with shadcn components
- Revamp KPI cards, quick actions, pending applications list
- Revamp admin sub-pages: users, events, applications, analytics, logs
- Install `table` for data-heavy admin views

### Phase 7 — Forms & Remaining Pages
- Install: `input`, `select`, `textarea`, `dialog`, `alert-dialog`
- Migrate settings page forms
- Migrate event creation/edit forms
- Migrate become-organizer multi-step form
- Replace Modal/ConfirmModal usage across dashboard
- Delete remaining old custom component files
- Final audit: ensure no custom UI components remain in dashboard imports

---

## File Impact Summary

### New Files
- `components.json` — shadcn config
- `components/ui/*.tsx` — shadcn component files (overwrite existing custom ones progressively)
- `components/dashboard/DashboardSidebar.tsx` — sidebar with role switcher
- `components/dashboard/DashboardTopBar.tsx` — breadcrumbs + actions bar
- `lib/dashboard-nav.ts` — sidebar nav config per role

### Modified Files
- `app/(app)/dashboard/layout.tsx` — new sidebar shell (currently no shared dashboard layout exists at this level)
- `app/(app)/dashboard/organizer/layout.tsx` — simplify, remove redundant wrapper
- `app/(app)/dashboard/admin/layout.tsx` — simplify, remove redundant wrapper
- `app/globals.css` — add shadcn CSS variables alongside existing tokens
- `tailwind.config.ts` or CSS theme — integrate shadcn theme
- All dashboard page files — update component imports
- All dashboard component files — update component imports

### Deleted Files (after migration complete)
- `components/ui/Button.tsx` (replaced by shadcn button)
- `components/ui/Card.tsx` (replaced by shadcn card)
- `components/ui/Badge.tsx` (replaced by shadcn badge)
- `components/ui/Input.tsx` (replaced by shadcn input)
- `components/ui/Select.tsx` (replaced by shadcn select)
- `components/ui/Textarea.tsx` (replaced by shadcn textarea)
- `components/ui/Modal.tsx` (replaced by shadcn dialog)
- `components/ui/ConfirmModal.tsx` (replaced by shadcn alert-dialog)
- `components/shared/Skeleton.tsx` (replaced by shadcn skeleton + specialized wrappers)
- `components/dashboard/DashboardHeader.tsx` (functionality absorbed into sidebar + topbar)

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Breaking non-dashboard pages that import custom UI components | Phase custom components out gradually — only delete when zero imports remain outside dashboard |
| shadcn Select pattern differs from current Select | Map props carefully; current Select is a simple `<select>`, shadcn uses Radix-based trigger/content |
| Tailwind v4 compatibility | shadcn officially supports Tailwind v4; verify during Phase 1 init |
| Mobile sidebar UX | Test Sheet-based sidebar on multiple screen sizes during Phase 2 |
| Role switcher edge cases | Handle users with only one role (hide switcher), users with no organizer role trying to access organizer routes (redirect) |
