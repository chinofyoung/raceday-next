# Quick Actions + Announcements Revamp

## Summary

Replace the current 2-column grid layout (Quick Actions card | Announcements card) with a vertical stack: icon tile grid on top, unwrapped announcements feed below. This gives both sections more breathing room and a more cohesive, app-like feel.

## Current State

- `RunnerView.tsx` lines 68-77: 2-column `md:grid-cols-2` grid with both sections in `bg-white/[0.02]` wrapper cards
- `RunnerQuickActions.tsx`: Pill-style buttons in a flex-wrap row
- `RunnerAnnouncements.tsx`: Scrollable list (max-h-300px) inside wrapper card
- `BaseQuickAction.tsx`: Shared button component with variant styling

## Design

### Icon Tile Grid (Quick Actions)

Replace pill buttons with icon tile cards in a responsive grid.

**Grid**: `grid grid-cols-2 sm:grid-cols-4 gap-3`

**Each tile**:
- Container: `bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 transition-all`
- Primary variant (Find Races): `bg-primary/8 border-primary/15 hover:bg-primary/12 hover:border-primary/30`
- Icon box: `w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2` with tinted background matching variant
- Label: `text-xs font-bold uppercase tracking-wider text-white`

### Announcements Feed

Remove wrapper card. Announcement cards sit directly on page background.

**Changes to `RunnerAnnouncements.tsx`**:
- Remove `max-h-[300px] overflow-y-auto` scroll constraint (server caps at 20)
- Remove `mb-8` from container
- Keep existing announcement card styling (green gradient, badges, etc.)
- Keep existing empty state

### Layout in RunnerView

Replace lines 68-77 with:

```tsx
{/* Quick Actions */}
<div>
  <h3 className="text-sm font-bold uppercase tracking-tight text-white mb-4">Quick Actions</h3>
  <RunnerQuickActions hasApplication={hasApplication} userRole={userRole} />
</div>

{/* Announcements */}
<RunnerAnnouncements />
```

No wrapper `<div>` with grid needed. Both sections flow naturally in the parent `space-y-6 lg:space-y-8` stack.

## Files to Modify

1. **`components/dashboard/RunnerQuickActions.tsx`** — Replace pill layout with icon tile grid
2. **`components/dashboard/shared/BaseQuickAction.tsx`** — Add `tile` layout variant (icon-above-label style)
3. **`components/dashboard/RunnerAnnouncements.tsx`** — Remove scroll constraint and bottom margin
4. **`components/dashboard/RunnerView.tsx`** — Remove 2-column grid wrapper, render sections directly in the vertical stack

## Out of Scope

- No changes to announcement data fetching or API
- No changes to the empty state design
- No changes to other dashboard sections
