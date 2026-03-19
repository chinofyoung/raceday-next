# Common Development Task Recipes

Step-by-step recipes for the most frequent development tasks in this codebase. Each recipe references actual file paths and follows the patterns already established in the project.

---

## 1. Add a New Page

### Choosing the right route group

| Scenario | Route group | Example path |
|---|---|---|
| Public-facing, marketing, or browseable | `app/(marketing)/` | `app/(marketing)/pricing/page.tsx` |
| Requires auth, non-dashboard | `app/(app)/` | `app/(app)/account/page.tsx` |
| Dashboard UI with sidebar | `app/(app)/dashboard/` | `app/(app)/dashboard/runner/goals/page.tsx` |

### Layout inheritance

- **`app/(marketing)/`** — inherits `app/(marketing)/layout.tsx`: wraps children in `<Navbar>` + `<Footer>`, `pt-24` main padding.
- **`app/(app)/`** — inherits `app/(app)/layout.tsx`: enforces Clerk auth and redirects unauthenticated users to `/auth/login`. Non-dashboard pages also get `<Navbar>` + `<Footer>`.
- **`app/(app)/dashboard/`** — inherits `app/(app)/dashboard/layout.tsx` on top of the app layout: renders `<DashboardSidebar>` + `<DashboardTopBar>` inside a `SidebarProvider`. Children go into the main content area with `max-w-7xl mx-auto`.

### Marketing page skeleton

```tsx
// app/(marketing)/pricing/page.tsx
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function PricingPage() {
    return (
        <PageWrapper className="space-y-24">
            <section className="pt-12 text-center space-y-6 max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                    Simple <span className="text-primary">pricing.</span>
                </h1>
                <p className="text-xl text-text-muted leading-relaxed">
                    One plan, no surprises.
                </p>
            </section>
        </PageWrapper>
    );
}
```

`PageWrapper` handles `max-w-7xl mx-auto px-4 sm:px-0` and a fade-in animation. Pass `container={false}` if you need full-bleed sections.

### Dashboard page skeleton

```tsx
// app/(app)/dashboard/runner/goals/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function GoalsPage() {
    const data = useQuery(api.someTable.list, {});

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
                <p className="text-text-muted mt-1">Track your running goals.</p>
            </div>
            {/* content */}
        </div>
    );
}
```

Dashboard pages do not need `<PageWrapper>` — the layout already applies `max-w-7xl mx-auto`.

### Adding navigation links

**Public Navbar** (`components/layout/Navbar.tsx`)

Add an entry to the `NAV_LINKS` array near the top of the file. Provide a `label`, `href`, and a Lucide icon (used only in the mobile drawer):

```ts
const NAV_LINKS = [
    { label: "Events",         href: "/events",          icon: Calendar },
    { label: "For Organizers", href: "/for-organizers",  icon: BarChart3 },
    { label: "About",          href: "/about",           icon: Info },
    { label: "Pricing",        href: "/pricing",         icon: CreditCard }, // new
];
```

**Dashboard sidebar** (`lib/dashboard-nav.ts`)

Add to the appropriate role's `NavGroup[]` export — `runnerNav`, `organizerNav`, or `adminNav`. The `NavItem` shape requires `title`, `href`, and a Lucide `icon`:

```ts
export const runnerNav: NavGroup[] = [
    {
        label: "Main",
        items: [
            { title: "Overview", href: "/dashboard",        icon: LayoutDashboard },
            { title: "Goals",    href: "/dashboard/runner/goals", icon: Target }, // new
            { title: "Profile",  href: "/dashboard/profile", icon: User },
        ],
    },
    // ...
];
```

`getNavForRole()` in the same file returns the correct nav array based on the user's role — no other changes required for the sidebar to pick it up.

---

## 2. Add a New Convex Table

### Step 1 — Define the table in `convex/schema.ts`

Add inside the `defineSchema({})` call. Always declare indexes for the query patterns you know you will need. New optional fields on existing tables should use `v.optional()`.

```ts
// convex/schema.ts
goals: defineTable({
    userId:    v.id("users"),
    title:     v.string(),
    targetKm:  v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
}).index("by_user", ["userId"]),
```

### Step 2 — Create `convex/goals.ts`

Follow the pattern from `convex/announcements.ts` or `convex/events.ts`:

- Import `query`, `mutation`, (and `internalQuery`/`internalMutation`/`internalAction` if needed) from `./_generated/server`.
- Import `v` from `convex/values`.
- Auth check pattern: call `ctx.auth.getUserIdentity()`, then look up the user row via `ctx.db.query("users").withIndex("by_uid", ...)`.
- Always set `createdAt: Date.now()` and `updatedAt: Date.now()` on insert; only `updatedAt: Date.now()` on patch.

```ts
// convex/goals.ts
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db
            .query("goals")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        userId:   v.id("users"),
        title:    v.string(),
        targetKm: v.number(),
    },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("goals", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("goals") },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const goal = await ctx.db.get(args.id);
        if (!goal) throw new Error("Goal not found");

        await ctx.db.delete(args.id);
    },
});
```

After saving, Convex regenerates `convex/_generated/api.ts` automatically — `api.goals.listByUser`, `api.goals.create`, etc. become available immediately.

### Step 3 — Create `types/goal.ts`

Mirror the schema shape in TypeScript. Use `id: string` (not `_id`) to match the convention used across the rest of the codebase (see `types/event.ts`, `types/announcement.ts`):

```ts
// types/goal.ts
export interface Goal {
    id: string;
    userId: string;
    title: string;
    targetKm: number;
    completedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export type CreateGoalInput = Omit<Goal, "id" | "createdAt" | "updatedAt">;
```

### Step 4 — Create a service in `lib/services/goalService.ts` (server-side access only)

Only needed if the table must be queried from API routes or server components. For client components, call Convex directly via `useQuery` / `useMutation`. Follow the pattern in `lib/services/eventService.ts`:

```ts
// lib/services/goalService.ts
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { Goal } from "@/types/goal";

export async function getGoalsByUser(userId: string): Promise<Goal[]> {
    const results = await fetchQuery(api.goals.listByUser, {
        userId: userId as Id<"users">,
    });
    return results.map(g => ({ ...g, id: g._id })) as Goal[];
}
```

### Step 5 — Create `lib/validations/goal.ts` (only if forms write to this table)

Use Zod, following the pattern from `lib/validations/registration.ts` or `lib/validations/event.ts`:

```ts
// lib/validations/goal.ts
import * as z from "zod";

export const goalSchema = z.object({
    title:    z.string().min(3, "Title is too short"),
    targetKm: z.number().positive("Distance must be positive"),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
```

---

## 3. Add a Field to an Existing Table

### Step 1 — Update `convex/schema.ts`

Wrap the new field in `v.optional()` to avoid breaking existing documents that do not yet have the field:

```ts
// Before
users: defineTable({
    displayName: v.string(),
    // ...
})

// After
users: defineTable({
    displayName: v.string(),
    bio: v.optional(v.string()), // new field
    // ...
})
```

### Step 2 — Update `types/*.ts`

Add the field as optional to the TypeScript interface. For the `users` table, update `types/user.ts`; for events, update `types/event.ts`.

```ts
// types/user.ts
export interface RaceUser {
    // ...existing fields...
    bio?: string; // new field
}
```

### Step 3 — Update `lib/validations/*.ts` (if a form writes to this field)

Add the field to the matching Zod schema. Keep it optional unless the form requires it:

```ts
// lib/validations/profile.ts
export const profileSchema = z.object({
    // ...existing fields...
    bio: z.string().max(280, "Bio is too long").optional(),
});
```

### Step 4 — Update the relevant form component

Add the form control in the step component where it belongs. Use the existing shadcn/ui `Input`, `Textarea`, or custom control, wired to `react-hook-form` via `FormField` / `Controller`.

### Step 5 — Update relevant Convex functions

- **Queries** that `select *` automatically include the new field — no change needed.
- **Mutations** that write to the table need the new field added to `args` and forwarded to `ctx.db.insert()` or `ctx.db.patch()`.

```ts
// convex/users.ts — example patch mutation
export const updateProfile = mutation({
    args: {
        id:  v.id("users"),
        bio: v.optional(v.string()), // add here
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            bio: args.bio,
            updatedAt: Date.now(),
        });
    },
});
```

---

## 4. Add a New API Route

API routes live in `app/api/[feature]/route.ts`. They are used when the frontend cannot call Convex directly (e.g., calling third-party services, webhook receivers, or operations that require a server secret).

### Auth pattern

Use Clerk's server-side `auth()` helper. When the route also needs to call Convex, get a JWT token with the `"convex"` template and pass it to `fetchQuery` / `fetchMutation`:

```ts
// app/api/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
    try {
        const { userId, getToken } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });

        const user = await fetchQuery(
            api.users.getByUid,
            { uid: userId },
            { token: token ?? undefined }
        );
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const goals = await fetchQuery(
            api.goals.listByUser,
            { userId: user._id as Id<"users"> },
            { token: token ?? undefined }
        );

        return NextResponse.json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, getToken } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });
        const body = await req.json();

        const result = await fetchMutation(
            api.goals.create,
            { ...body },
            { token: token ?? undefined }
        );

        return NextResponse.json({ id: result });
    } catch (error) {
        console.error("Error creating goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
```

**When `getToken` is not needed:** Routes that only read public data (no user-scoped Convex calls) can use `fetchQuery` without a token, as in `app/api/events/[id]/announcements/route.ts`.

**Dynamic route segments:** Access `params` via the second argument to the handler — note that in Next.js 15+ params is a Promise:

```ts
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    // ...
}
```

**Webhook routes** (no Clerk auth): See `app/api/payments/webhook/route.ts` for the pattern — validate the request using a provider signature instead.

---

## 5. Add a New Dashboard Widget

### Step 1 — Create the component

Place it in the subfolder matching the role it belongs to:

| Role | Directory |
|---|---|
| Organizer | `components/dashboard/organizer/` |
| Runner | `components/dashboard/runner/` |
| Volunteer | `components/dashboard/volunteer/` |
| Shared | `components/dashboard/shared/` |

Follow the pattern from `components/dashboard/organizer/OrganizerStats.tsx`:

```tsx
// components/dashboard/runner/GoalsWidget.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export function GoalsWidget() {
    const { user } = useAuth();
    const goals = useQuery(
        api.goals.listByUser,
        user?._id ? { userId: user._id as Id<"users"> } : "skip"
    );

    if (!goals) return null; // or a <Skeleton /> while loading

    return (
        <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
                    <Target size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-white">My Goals</h3>
            </div>
            {/* widget body */}
        </Card>
    );
}
```

Pass `"skip"` as the args to `useQuery` when the required ID is not yet available — this prevents the query from running until the dependency is ready.

### Step 2 — Add to the role's view component

For runners, import and render inside `components/dashboard/RunnerView.tsx`. For organizers, import inside `components/dashboard/OrganizerView.tsx`. The organizer view has a drag-and-drop widget system — add a new entry to `DEFAULT_WIDGET_ORDER` and register the component in the `widgetComponents` map inside that file. For a simple, non-draggable widget, just render it directly in the JSX.

---

## 6. Add a New Step to a Multi-Step Form

This applies to both `EventForm` (`components/forms/event/`) and `RegistrationForm` (`components/forms/registration/`).

### Step 1 — Create the step component

```tsx
// components/forms/event/Step7Sponsors.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { EventFormInput } from "@/lib/validations/event";

export function Step7Sponsors() {
    const { register, formState: { errors } } = useFormContext<EventFormInput>();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Sponsors</h2>
            {/* form fields */}
        </div>
    );
}
```

### Step 2 — Update the parent form

In `components/forms/event/EventForm.tsx`:

1. Import the new step component.
2. Add a label to the `STEPS` array (index order matters).
3. Add the field names that belong to this step to `STEP_FIELDS` under the new step index. These are validated when the user clicks Next.
4. Add the component to the `renderStep()` switch or conditional in `EventFormContent`.

```ts
// EventForm.tsx — STEPS and STEP_FIELDS
const STEPS = [
    "Basic Info",
    "Images",
    "Categories",
    "Timeline",
    "Features",
    "Review",
    "Sponsors", // new — index 6
];

const STEP_FIELDS: Record<number, (keyof EventFormInput | string)[]> = {
    0: ["name", "description", "date", "registrationEndDate", "location.name", "location.address"],
    1: ["featuredImage", "galleryImages"],
    2: ["categories", "earlyBird"],
    3: ["timeline"],
    6: ["sponsors"], // new — fields validated on Next
};
```

### Step 3 — Update the validation schema in `lib/validations/event.ts`

Add the new step's fields to `eventSchema`. Use `v.optional()` / `z.optional()` if the step is not always required:

```ts
// lib/validations/event.ts
export const eventSchema = z.object({
    // ...existing fields...
    sponsors: z.array(z.object({
        name: z.string().min(1, "Sponsor name is required"),
        logoUrl: z.string().optional(),
    })).optional(),
});
```

### Step 4 — How `useFormSteps` works

`lib/hooks/useFormSteps.ts` is a thin hook that wraps `react-hook-form`'s `trigger()`. When the user clicks Next, it validates only the fields listed in `STEP_FIELDS[currentStep]`. If validation fails, it scrolls to the first invalid field. You do not need to modify this hook.

---

## 7. Add a New Event Detail Section

### Step 1 — Create the component in `components/event/`

```tsx
// components/event/EventSponsors.tsx
"use client";

import { RaceEvent } from "@/types/event";

interface EventSponsorsProps {
    event: RaceEvent;
}

export function EventSponsors({ event }: EventSponsorsProps) {
    return (
        <section id="sponsors" className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Sponsors</h2>
            {/* sponsor grid */}
        </section>
    );
}
```

Give the root element `id="sponsors"` — `EventDetailClient` uses an `IntersectionObserver` keyed on section IDs to track the active navigation section.

### Step 2 — Import and render in `components/event/EventDetailClient.tsx`

```tsx
// components/event/EventDetailClient.tsx
import { EventSponsors } from "./EventSponsors";

// Inside the JSX, alongside the other section components:
<EventSponsors event={event} />
```

### Step 3 — Add a navigation item in `components/event/EventNavigation.tsx` (if applicable)

Read `EventNavigation.tsx` to find the nav items array and add your section's label and anchor ID.

---

## 8. Integrate a New External Service

### Step 1 — Add env vars to `.env.local`

```
NEXT_PUBLIC_SERVICE_KEY=...   # only if needed client-side
SERVICE_SECRET_KEY=...         # server-side only — never expose to client
```

### Step 2 — Create `lib/[service]/config.ts`

Follow the pattern from `lib/cloudinary/config.ts`:

```ts
// lib/stripe/config.ts
export const STRIPE_CONFIG = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY, // server-side only
};
```

### Step 3 — Create `lib/services/[service]Service.ts`

Keep all HTTP calls and SDK initialization in this file. Export typed functions:

```ts
// lib/services/stripeService.ts
import Stripe from "stripe";
import { STRIPE_CONFIG } from "@/lib/stripe/config";

const stripe = new Stripe(STRIPE_CONFIG.secretKey!);

export async function createPaymentIntent(amountCents: number, currency = "php") {
    return stripe.paymentIntents.create({ amount: amountCents, currency });
}
```

### Step 4 — Create an API route if the frontend needs to call it

```ts
// app/api/stripe/create-intent/route.ts
import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { createPaymentIntent } from "@/lib/services/stripeService";

export async function POST(req: Request) {
    const { userId } = await clerkAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amountCents } = await req.json();
    const intent = await createPaymentIntent(amountCents);
    return NextResponse.json({ clientSecret: intent.client_secret });
}
```

### Step 5 — If Convex needs to call the service, use an action

Convex queries and mutations cannot make HTTP calls. Create an `internalAction` (or exported `action`) in the relevant Convex file:

```ts
// convex/stripe.ts
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const chargeRegistration = internalAction({
    args: { amountCents: v.number(), description: v.string() },
    handler: async (_ctx, args) => {
        const response = await fetch("https://api.stripe.com/v1/...", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
            body: JSON.stringify(args),
        });
        return response.json();
    },
});
```

Then call it from a mutation via `ctx.scheduler.runAfter(0, internal.stripe.chargeRegistration, { ... })`.

---

## 9. Add a New Admin Feature

### Step 1 — Create the page

```
app/(app)/dashboard/admin/[feature]/page.tsx
```

The page is automatically protected by `app/(app)/dashboard/admin/layout.tsx`, which checks `role === "admin"` via `useAuth()` and redirects non-admins to `/dashboard`.

```tsx
// app/(app)/dashboard/admin/announcements/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminAnnouncementsPage() {
    const announcements = useQuery(api.announcements.listByEvent, { eventId: "..." as any });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                <p className="text-text-muted mt-1">Manage all event announcements.</p>
            </div>
            {/* content */}
        </div>
    );
}
```

### Step 2 — Create components in `components/admin/`

Follow the pattern from `components/admin/AdminOverviewChart.tsx` or `components/admin/AnalyticsCharts.tsx`.

### Step 3 — Add navigation in `lib/dashboard-nav.ts`

Add to the `adminNav` array:

```ts
export const adminNav: NavGroup[] = [
    {
        label: "Admin",
        items: [
            // ...existing items...
            {
                title: "Announcements",
                href: "/dashboard/admin/announcements",
                icon: Bell,  // Lucide icon
            },
        ],
    },
];
```

### Step 4 — Add audit logging for mutations

Any admin action that creates, updates, or deletes data must be logged. Use `logAdminAction` from `lib/admin/audit.ts`:

```ts
import { logAdminAction } from "@/lib/admin/audit";

// Inside a server action or API route handler:
await logAdminAction(
    adminId,          // Convex user._id string
    adminName,        // display name
    "delete_event",   // one of AdminActionType from lib/admin/audit.ts
    targetId,         // the affected record's ID
    targetName,       // human-readable name of the affected record
    "Removed due to policy violation"  // optional detail string
);
```

`logAdminAction` calls `api.audit.log` via `fetchMutation` and requires `CONVEX_ADMIN_SECRET` to be set in the server environment. Failures are caught and logged to stderr rather than thrown, so they will not break the main operation.

Existing `AdminActionType` values (defined in `lib/admin/audit.ts`):
`approve_organizer`, `reject_organizer`, `request_info_organizer`, `change_user_role`, `feature_event`, `unfeature_event`, `cancel_event`, `delete_event`, `ban_user`.

To add a new action type, extend the union in `lib/admin/audit.ts`.
