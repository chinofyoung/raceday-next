# RaceDay Next — Coding Conventions for AI Agents

This document describes the patterns, idioms, and conventions observed throughout the
codebase. Follow these exactly when adding or modifying code.

> **Cross-reference:** The design system (colors, typography, component visuals) lives
> in `CLAUDE.md` at the project root. This document covers code structure and logic
> conventions only.

---

## 1. File Naming

| Context | Convention | Example |
|---|---|---|
| React components | PascalCase | `RunnerView.tsx`, `EventCard.tsx` |
| Hooks | camelCase prefixed with `use` | `useAuth.ts`, `useFormSteps.ts` |
| Services | camelCase suffixed with `Service` | `eventService.ts` |
| Utilities | camelCase | `volunteerAccess.ts` |
| Validation schemas | camelCase, in `lib/validations/` | `event.ts` |
| Convex functions | camelCase, in `convex/` | `events.ts`, `users.ts` |
| Route directories | kebab-case | `app/api/events/[id]/check-access/` |
| Type definition files | camelCase, in `types/` | `event.ts`, `user.ts` |

---

## 2. Import Conventions

Use the `@/` alias for all project-root-relative imports. Never use relative `../../` paths
except inside `convex/` files, which import from their own generated directory.

```ts
// Correct — application code
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RaceEvent } from "@/types/event";
import { cn, toDate, formatDate, formatCurrency } from "@/lib/utils";

// Correct — inside convex/ files (generated types are local)
import { api } from "../../convex/_generated/api";   // lib/hooks/useAuth.ts
```

Standard import order (no enforced linter rule observed, but follow this grouping):
1. React / Next.js built-ins
2. Third-party libraries (Convex, Clerk, Zod, Lucide)
3. Internal `@/` aliased imports — types, hooks, services, utils
4. Relative imports (component siblings, within the same directory)

---

## 3. Component Patterns

### 3.1 Client vs. Server

Add `"use client"` only when the component uses hooks, event handlers, or browser APIs.
Server Components are the default; keep them server-side whenever possible.

```tsx
"use client";  // Required when using useState, useQuery, useEffect, etc.

import { useMemo } from "react";
import { useQuery } from "convex/react";
```

### 3.2 Function Declaration Style

All components are **named function exports** — no default exports for components.

```tsx
// Correct
export function RunnerView({ completion, items, stats }: RunnerViewProps) { ... }

// Wrong — avoid default exports and arrow-function components
export default ({ completion }: RunnerViewProps) => { ... }
```

### 3.3 Props Typing

Define props with an `interface` immediately above the component. Use `inline` prop
types only for very simple single-prop components.

```tsx
interface RunnerViewProps {
    completion: number;
    items: any[];
    stats: { total: number };
}

export function RunnerView({ completion, items, stats }: RunnerViewProps) { ... }
```

### 3.4 Class Composition

Always use `cn()` (from `@/lib/utils`) for conditional or merged Tailwind classes.
Never string-concatenate class names manually.

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "text-primary", className)} />
```

### 3.5 Animations

Use Tailwind's `animate-in` / `fade-in` utilities for entry animations.

```tsx
<div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
```

---

## 4. Convex Patterns

### 4.1 Function Declaration Shape

Every Convex function is a named export from a file under `convex/`. Use the typed
context params (`QueryCtx`, `MutationCtx`) explicitly on the handler.

```ts
import { query, mutation, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
    args: { id: v.id("events") },
    handler: async (ctx: QueryCtx, args) => {
        return await ctx.db.get(args.id);
    },
});
```

### 4.2 Index-First Querying

Always use `.withIndex()` when a matching index exists. Never do a full table scan
when a filter would match an indexed field.

```ts
// Correct — uses declared index
const user = await ctx.db
    .query("users")
    .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
    .unique();

// Wrong — full scan
const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("uid"), identity.subject))
    .first();
```

Composite filters that have no matching composite index may be applied *after* a
single-field index query, with a comment explaining the trade-off:

```ts
// Filter by organizer via index, then apply status filter in-memory.
// No composite index exists on (organizerId, status) for events.
return await ctx.db.query("events")
    .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId!))
    .filter((q) => q.eq(q.field("status"), status))
    .order("desc")
    .paginate(args.paginationOpts);
```

### 4.3 Authentication

Every mutation and any query that touches user-specific data must verify identity first.
The pattern is always the same:

```ts
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");

const user = await ctx.db
    .query("users")
    .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
    .unique();

if (!user || (user._id !== event.organizerId && user.role !== "admin")) {
    throw new Error("Forbidden");
}
```

Queries that return access-check results (rather than throwing) use a graceful fallback:

```ts
// In checkAccess-style queries
if (!identity) return { hasAccess: false, permissions: [] };
```

### 4.4 Timestamps

All records use **Unix milliseconds** (`Date.now()`) for `createdAt` and `updatedAt`.
Always set both on insert; always update `updatedAt` on patch.

```ts
await ctx.db.insert("events", {
    ...args,
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

await ctx.db.patch(args.id, {
    status: args.status,
    updatedAt: Date.now(),
});
```

### 4.5 Pagination

Use Convex's built-in pagination for list queries. Import `paginationOptsValidator`
and expose it as an arg:

```ts
import { paginationOptsValidator } from "convex/server";

export const list = query({
    args: {
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("events")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});
```

### 4.6 Internal Queries

Use `internalQuery` / `internalMutation` for functions that should never be called
directly from the client:

```ts
import { internalQuery } from "./_generated/server";

export const getByIdInternal = internalQuery({
    args: { id: v.id("events") },
    handler: async (ctx, args) => ctx.db.get(args.id),
});
```

### 4.7 Schema Conventions

- Tables are defined in `convex/schema.ts` using `defineTable` + `defineSchema`.
- Every table has `createdAt: v.number()` and `updatedAt: v.number()`.
- Indexes are declared inline at the end of each `defineTable()` call, chained with
  `.index("by_<field>", ["field"])`.
- Use `v.union(v.literal(...), ...)` for enum-like string fields — never `v.string()`
  alone for fields with a fixed set of values.

---

## 5. Service Layer

Services live in `lib/services/` and are the only place `fetchQuery` / `fetchMutation`
from `convex/nextjs` are called. They are used in Server Components and API routes —
never in Client Components (use `useQuery` / `useMutation` hooks there instead).

```ts
// lib/services/eventService.ts
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";

export async function getEventById(id: string): Promise<RaceEvent | null> {
    try {
        const event = await fetchQuery(api.events.getById, { id: id as Id<"events"> });
        if (!event) return null;
        return { ...event, id: event._id } as RaceEvent;
    } catch (error) {
        console.error("Error fetching event by id:", error);
        throw error;    // re-throw; callers decide how to surface the error
    }
}
```

Key rules:
- Always wrap in `try/catch`, `console.error` the failure, then re-throw.
- Cast `string` IDs to `Id<"tableName">` at the service boundary.
- Map `_id` → `id` when returning to the application layer (`{ ...doc, id: doc._id }`).
- Export typed option interfaces for functions with multiple parameters
  (`GetEventsOptions`, etc.).

---

## 6. API Routes

Routes live under `app/api/` following Next.js App Router conventions. Every route
that requires auth follows this shape:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";

// Opt out of static caching for all data-fetching routes
export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }   // params is a Promise in Next.js 15+
) {
    try {
        const { userId: clerkId, getToken } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Pass Convex JWT when querying data that requires auth
        const token = await getToken({ template: "convex" });
        const { id } = await context.params;   // always await params

        // Validate ID before sending to Convex
        if (!id || id === "undefined" || id.length < 10) {
            return new NextResponse("Invalid ID", { status: 400 });
        }

        // ... fetch and process ...

        return NextResponse.json({ ... });
    } catch (error) {
        console.error("Error in route:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
```

Key rules:
- `export const dynamic = "force-dynamic"` on every route that fetches live data.
- `context.params` is `Promise<{ ... }>` — always `await` it.
- Return plain `new NextResponse("message", { status: N })` for error responses;
  return `NextResponse.json({ ... })` for success.
- Validate IDs before passing to Convex (null check, `"undefined"` string guard,
  minimum length check).

---

## 7. Validation Schemas (Zod)

Schemas live in `lib/validations/` and mirror the Convex schema shape. Export:
1. The schema object itself (e.g., `eventSchema`)
2. An inferred TypeScript type (e.g., `EventFormValues`)
3. A companion "form input" type when the form deals with strings that the schema
   coerces (e.g., `EventFormInput` where `date` is `string` not `Date`).

```ts
import * as z from "zod";

export const eventSchema = z.object({
    name: z.string().min(5, "Event name is too short"),
    date: z.coerce.date({ message: "Event date is required" }),
    status: z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
    // ...
});

export type EventFormValues = z.infer<typeof eventSchema>;

// Companion type for form state (dates as strings from HTML inputs)
export type EventFormInput = Omit<EventFormValues, "date"> & { date: string };
```

Use `.refine()` at the schema level for cross-field business rules (e.g., end date must
be after start date, early bird prices must be below regular price). Attach `path` to
highlight the offending field.

---

## 8. Type Definitions

All shared TypeScript types live in `types/`. Do not define types inside component
files unless they are strictly local to that file.

Patterns observed:

```ts
// Union string types for enums
export type EventStatus = "draft" | "published" | "cancelled" | "completed";

// Interfaces for domain objects
export interface RaceEvent {
    id: string;          // mapped from Convex _id at the service layer
    organizerId: string;
    date: number;        // Unix milliseconds
    // ...
}
```

- Use `interface` for object shapes that may be extended; use `type` for unions and
  aliases.
- Convex document types can be accessed via `Doc<"tableName">` from
  `@/convex/_generated/dataModel` when you need the raw DB shape (including `_id`,
  `_creationTime`).
- The service layer's `{ ...doc, id: doc._id }` pattern bridges `Doc<"events">` →
  `RaceEvent`.

---

## 9. Custom Hooks

Hooks live in `lib/hooks/` and always start with `"use client"` (they use React hooks
internally). They follow the standard `use<Name>` naming convention and return a plain
object (not an array) for hooks with multiple return values.

```ts
"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useAuth = () => {
    const { user: clerkUser, isLoaded: clerkLoading } = useUser();
    const convexUser = useQuery(api.users.current);

    return {
        user: convexUser as User | null,
        clerkUser,
        loading: !clerkLoading || (!!clerkUser && convexUser === undefined),
        role: convexUser?.role || null,
        signOut,
    };
};
```

---

## 10. Utility Functions (`lib/utils.ts`)

`lib/utils.ts` is the shared utilities barrel. Key exports:

| Function | Purpose |
|---|---|
| `cn(...inputs)` | Merge Tailwind classes with clsx + tailwind-merge |
| `toDate(value)` | Normalize any date-like value (Date, number, ISO string) → `Date` |
| `toInputDate(date)` | Format a date for `<input type="date">` (YYYY-MM-DD) |
| `formatDate(date, format)` | Human-readable date string ("short", "long", "full") |
| `formatCurrency(amount)` | Philippine Peso formatting via `Intl.NumberFormat` ("en-PH", PHP) |
| `formatDistance(dist, unit)` | Display string for distance + unit, handles legacy string format |
| `generateId()` | `crypto.randomUUID()` with fallback for non-secure contexts |
| `computeProfileCompletion(user)` | Weighted percentage score for profile fields |

Always import these from `@/lib/utils` rather than reimplementing them.

---

## 11. State Management

No Redux, MobX, or Zustand. State is managed via:

| Need | Approach |
|---|---|
| Server/real-time data | `useQuery(api.*)` from `convex/react` |
| Mutations | `useMutation(api.*)` from `convex/react` |
| Form state | `react-hook-form` with Zod resolver |
| Local UI state | `useState` / `useReducer` |
| Cross-render ephemeral state | `sessionStorage` (e.g., pending registration flow) |
| URL-driven state | Next.js `useSearchParams` / `useRouter` |

---

## 12. Error Handling

### In Convex handlers
Throw `Error` with a human-readable message; Convex surfaces these to the client.

```ts
if (!identity) throw new Error("Unauthorized");
if (!event) throw new Error("Event not found");
if (!user || user._id !== event.organizerId) throw new Error("Forbidden");
```

### In services and API routes
`try/catch` every async call. Log with `console.error`, then either re-throw (service
layer) or return an appropriate HTTP error response (API routes).

### In Client Components
Surface errors to the user with `toast` from `sonner`:

```ts
import { toast } from "sonner";

toast.success("Registration confirmed");
toast.error("Something went wrong. Please try again.");
```

Never silently swallow errors. If a catch block does nothing, it must at minimum log.

---

## 13. Styling

All styling is done with Tailwind CSS utility classes. No CSS Modules, no inline
`style` props (except for dynamic values that cannot be expressed as classes, e.g.,
computed widths or gradients).

- Use `cn()` for conditional class composition.
- Follow the design token conventions in `CLAUDE.md` (colors, spacing, typography,
  component patterns).
- The `/branding` route (`app/(marketing)/branding/page.tsx`) is the living style guide
  — reference it when building new UI.
- Background glows: radial gradients at 5–8% opacity max.
- Hover effects: `hover:-translate-y-1` and border brightening — no scale transforms.

---

## 14. Directory Structure (Quick Reference)

```
app/
  (marketing)/          # Public-facing pages (no auth required)
  (dashboard)/          # Authenticated app pages
  api/                  # Next.js API routes
components/
  dashboard/            # Dashboard-scoped components, organized by view
  ui/                   # Reusable shadcn/ui primitives
convex/
  schema.ts             # Single source of truth for DB schema + indexes
  *.ts                  # One file per domain entity (events, users, registrations…)
  _generated/           # Never edit — auto-generated by Convex CLI
lib/
  hooks/                # Custom React hooks
  services/             # Server-side data access (fetchQuery/fetchMutation wrappers)
  utils.ts              # Shared utility functions
  validations/          # Zod schemas
types/                  # Shared TypeScript interfaces and type aliases
docs/                   # Developer documentation (you are here)
public/                 # Static assets
```
