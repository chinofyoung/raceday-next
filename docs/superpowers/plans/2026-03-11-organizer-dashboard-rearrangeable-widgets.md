# Organizer Dashboard Rearrangeable Widgets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow organizers to drag-and-drop rearrange the 4 content widgets on their dashboard overview and persist the order in Convex.

**Architecture:** Add `dashboardLayout` optional field to the users table in Convex. Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop. OrganizerView gains edit mode with a toggle button, drag handles on widgets, and save/cancel actions.

**Tech Stack:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, Convex mutations, React state

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `convex/schema.ts` | Add `dashboardLayout` field to users table |
| Modify | `convex/users.ts` | Add `updateDashboardLayout` mutation |
| Create | `components/dashboard/organizer/DraggableWidget.tsx` | Sortable wrapper with drag handle for edit mode |
| Modify | `components/dashboard/OrganizerView.tsx` | Add edit mode, dnd context, render widgets in saved order |

## Widget IDs (constants)

```ts
const DEFAULT_WIDGET_ORDER = [
  "revenue-stats",
  "kit-fulfillment",
  "active-events",
  "registrations-feed",
] as const;
```

---

### Task 1: Install @dnd-kit dependencies

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Verify installation**

```bash
npm ls @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit dependencies for dashboard widget reordering"
```

---

### Task 2: Add dashboardLayout field to Convex schema and mutation

**Files:**
- Modify: `convex/schema.ts:5-49` (users table)
- Modify: `convex/users.ts` (add mutation)

- [ ] **Step 1: Add dashboardLayout to users schema**

In `convex/schema.ts`, add to the users table definition, after `expoPushToken`:

```ts
dashboardLayout: v.optional(v.array(v.string())),
```

- [ ] **Step 2: Add updateDashboardLayout mutation to convex/users.ts**

Add at the end of the file:

```ts
export const updateDashboardLayout = mutation({
    args: {
        layout: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            dashboardLayout: args.layout,
            updatedAt: Date.now(),
        });
    },
});
```

- [ ] **Step 3: Verify Convex typegen passes**

```bash
npx convex dev --once
```

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/users.ts
git commit -m "feat: add dashboardLayout field and mutation for widget reordering"
```

---

### Task 3: Create DraggableWidget component

**Files:**
- Create: `components/dashboard/organizer/DraggableWidget.tsx`

- [ ] **Step 1: Create the DraggableWidget component**

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableWidgetProps {
    id: string;
    isEditing: boolean;
    children: React.ReactNode;
}

export function DraggableWidget({ id, isEditing, children }: DraggableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`md:col-span-2 relative ${
                isDragging ? "z-50 opacity-75" : ""
            } ${isEditing ? "ring-1 ring-white/10 rounded-2xl" : ""}`}
        >
            {isEditing && (
                <button
                    {...attributes}
                    {...listeners}
                    className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-surface border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing"
                    aria-label="Drag to reorder"
                >
                    <GripVertical size={16} />
                </button>
            )}
            {children}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/organizer/DraggableWidget.tsx
git commit -m "feat: add DraggableWidget sortable wrapper component"
```

---

### Task 4: Update OrganizerView with edit mode and drag-and-drop

**Files:**
- Modify: `components/dashboard/OrganizerView.tsx`

- [ ] **Step 1: Rewrite OrganizerView with dnd-kit integration**

Replace the entire file with:

```tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { LayoutGrid, Check, X } from "lucide-react";

import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";
import { DraggableWidget } from "./organizer/DraggableWidget";

const DEFAULT_WIDGET_ORDER = [
    "revenue-stats",
    "kit-fulfillment",
    "active-events",
    "registrations-feed",
] as const;

type WidgetId = (typeof DEFAULT_WIDGET_ORDER)[number];

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
    eventRevenue,
}: OrganizerViewProps) {
    const { user } = useAuth();
    const updateLayout = useMutation(api.users.updateDashboardLayout);

    const savedOrder = useMemo(() => {
        const layout = (user as any)?.dashboardLayout as string[] | undefined;
        if (!layout || layout.length !== DEFAULT_WIDGET_ORDER.length) {
            return [...DEFAULT_WIDGET_ORDER];
        }
        return layout as WidgetId[];
    }, [user]);

    const [isEditing, setIsEditing] = useState(false);
    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(savedOrder);

    // Sync local state when saved order changes (e.g. on first load)
    useMemo(() => {
        if (!isEditing) {
            setWidgetOrder(savedOrder);
        }
    }, [savedOrder, isEditing]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setWidgetOrder((prev) => {
                const oldIndex = prev.indexOf(active.id as WidgetId);
                const newIndex = prev.indexOf(over.id as WidgetId);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }, []);

    const handleSave = useCallback(async () => {
        await updateLayout({ layout: [...widgetOrder] });
        setIsEditing(false);
    }, [widgetOrder, updateLayout]);

    const handleCancel = useCallback(() => {
        setWidgetOrder(savedOrder);
        setIsEditing(false);
    }, [savedOrder]);

    const widgetMap: Record<WidgetId, React.ReactNode> = {
        "revenue-stats": (
            <OrganizerRevenueStats
                categoryRevenue={categoryRevenue}
                eventRevenue={eventRevenue}
                totalRevenue={stats.revenue}
            />
        ),
        "kit-fulfillment": (
            <OrganizerKitFulfillment
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
                totalParticipants={stats.secondary}
            />
        ),
        "active-events": (
            <OrganizerActiveEvents items={items} eventKitStats={eventKitStats} />
        ),
        "registrations-feed": (
            <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />
        ),
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />

            <OrganizerStats
                stats={stats}
                publishedEventsCount={publishedEvents.length}
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
            />

            {/* Edit mode controls */}
            <div className="flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/80 rounded-lg transition-colors"
                        >
                            <Check size={14} />
                            Save Layout
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        <LayoutGrid size={14} />
                        Rearrange
                    </button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {widgetOrder.map((id) => (
                            <DraggableWidget key={id} id={id} isEditing={isEditing}>
                                {widgetMap[id]}
                            </DraggableWidget>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/OrganizerView.tsx
git commit -m "feat: add drag-and-drop widget reordering to organizer dashboard"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Verify normal mode** — widgets render in default order, no drag UI visible
- [ ] **Step 2: Verify edit mode** — click "Rearrange", drag handles appear, widgets get ring highlight
- [ ] **Step 3: Verify drag-and-drop** — drag a widget to a new position, it reorders
- [ ] **Step 4: Verify save** — click "Save Layout", refresh page, order persists
- [ ] **Step 5: Verify cancel** — enter edit mode, reorder, click "Cancel", order reverts
