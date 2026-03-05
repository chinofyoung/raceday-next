# Race Results Feature — Implementation Plan

> **Goal:** Add a full race results system to RaceDay, allowing organizers to upload results (via CSV), runners and the public to browse them, and the event detail page to surface a "Results" section when available.

---

## Table of Contents

1. [Data Model (Convex)](#1-data-model-convex)
2. [TypeScript Types](#2-typescript-types)
3. [Backend — Convex Functions](#3-backend--convex-functions)
4. [CSV Upload & Parsing](#4-csv-upload--parsing)
5. [Public Results Page (`/results`)](#5-public-results-page-results)
6. [Event Detail — Results Section](#6-event-detail--results-section)
7. [Organizer Dashboard — Results Tab](#7-organizer-dashboard--results-tab)
8. [Runner Dashboard — My Results](#8-runner-dashboard--my-results)
9. [UI/UX & Design Direction](#9-uiux--design-direction)
10. [File Manifest](#10-file-manifest)
11. [Phase Breakdown](#11-phase-breakdown)

---

## 1. Data Model (Convex)

Add a new `raceResults` table to `convex/schema.ts`:

```ts
raceResults: defineTable({
    eventId: v.id("events"),
    categoryId: v.string(),           // matches EventCategory.id

    // Participant identity (optional link to registered user)
    registrationId: v.optional(v.id("registrations")),
    userId: v.optional(v.id("users")),

    // Participant info (from CSV / manual entry)
    bibNumber: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    gender: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("X"))),
    ageGroup: v.optional(v.string()),   // e.g. "25-29", "30-34"
    club: v.optional(v.string()),
    city: v.optional(v.string()),

    // Timing
    gunTime: v.optional(v.string()),    // "HH:MM:SS" format
    chipTime: v.optional(v.string()),   // "HH:MM:SS" (net time)
    pace: v.optional(v.string()),       // "MM:SS /km"

    // Rankings
    overallRank: v.optional(v.number()),
    genderRank: v.optional(v.number()),
    ageGroupRank: v.optional(v.number()),
    categoryRank: v.optional(v.number()),

    // Status
    status: v.union(
        v.literal("finished"),
        v.literal("dnf"),    // Did Not Finish
        v.literal("dns"),    // Did Not Start
        v.literal("dsq"),    // Disqualified
    ),

    // Metadata
    uploadedAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_event", ["eventId"])
    .index("by_event_category", ["eventId", "categoryId"])
    .index("by_bib", ["eventId", "bibNumber"])
    .index("by_user", ["userId"])
    .index("by_registration", ["registrationId"]),
```

Also add an `eventResultsMeta` table for per-event results metadata:

```ts
eventResultsMeta: defineTable({
    eventId: v.id("events"),
    publishedAt: v.optional(v.number()),    // when results were made public
    isPublished: v.boolean(),
    totalFinishers: v.number(),
    totalDNF: v.number(),
    totalDNS: v.number(),
    totalDSQ: v.number(),
    uploadedBy: v.id("users"),
    lastUploadAt: v.number(),
    fileName: v.optional(v.string()),       // original CSV filename
}).index("by_event", ["eventId"]),
```

### Why Two Tables?

- `raceResults`: Individual rows — one per participant per category. Indexed for fast lookups by event, category, bib, and user.
- `eventResultsMeta`: Aggregate metadata (finisher count, published status). Prevents scanning every result row just to show "Results available" on event cards.

---

## 2. TypeScript Types

**File:** `types/result.ts`

```ts
export type ResultStatus = "finished" | "dnf" | "dns" | "dsq";

export interface RaceResult {
    id: string;
    eventId: string;
    categoryId: string;
    registrationId?: string;
    userId?: string;

    bibNumber: string;
    firstName: string;
    lastName: string;
    gender?: "M" | "F" | "X";
    ageGroup?: string;
    club?: string;
    city?: string;

    gunTime?: string;
    chipTime?: string;
    pace?: string;

    overallRank?: number;
    genderRank?: number;
    ageGroupRank?: number;
    categoryRank?: number;

    status: ResultStatus;

    uploadedAt: number;
    updatedAt: number;
}

export interface EventResultsMeta {
    id: string;
    eventId: string;
    isPublished: boolean;
    publishedAt?: number;
    totalFinishers: number;
    totalDNF: number;
    totalDNS: number;
    totalDSQ: number;
    uploadedBy: string;
    lastUploadAt: number;
    fileName?: string;
}

// CSV import mapping
export interface CSVResultRow {
    bibNumber: string;
    firstName: string;
    lastName: string;
    gender?: string;
    ageGroup?: string;
    club?: string;
    city?: string;
    gunTime?: string;
    chipTime?: string;
    pace?: string;
    overallRank?: number;
    genderRank?: number;
    ageGroupRank?: number;
    categoryRank?: number;
    status?: string;
}
```

---

## 3. Backend — Convex Functions

**File:** `convex/results.ts`

### Queries

| Function | Args | Description |
|---|---|---|
| `getByEvent` | `eventId`, `categoryId?`, `paginationOpts` | Paginated results for public view, sorted by `overallRank` |
| `getByUser` | `userId` | All results linked to a user's account |
| `getByBib` | `eventId`, `bibNumber` | Single result lookup |
| `getMeta` | `eventId` | Get `eventResultsMeta` for an event |
| `getEventsWithResults` | `paginationOpts` | List events that have published results (for `/results` page) |
| `search` | `eventId`, `query` | Search results by name or bib |

### Mutations

| Function | Args | Description |
|---|---|---|
| `uploadBatch` | `eventId`, `categoryId`, `results[]` | Bulk insert parsed CSV rows. Auth: organizer or admin |
| `deleteByEvent` | `eventId`, `categoryId?` | Clear results (before re-upload). Auth: organizer |
| `publishResults` | `eventId` | Set `isPublished = true` on meta. Auth: organizer |
| `unpublishResults` | `eventId` | Set `isPublished = false`. Auth: organizer |
| `updateSingle` | `id`, `fields...` | Edit one result row (manual fix). Auth: organizer |
| `upsertMeta` | `eventId`, `stats`, ... | Create/update meta record |

### Key Design Decisions

- **Batch uploads**: The `uploadBatch` mutation receives pre-parsed data (array of result objects). CSV parsing happens on the client so the organizer can preview/map columns before committing.
- **Auto-linking**: When results are uploaded, we try to match `bibNumber` → `registrations` table to fill in `registrationId` and `userId`. This lets runners see their results on their dashboard.
- **Rank calculation**: The CSV is expected to include ranks. Alternatively, we compute ranks server-side after upload — sort by `chipTime`, assign `overallRank`, `genderRank`, `ageGroupRank`.

---

## 4. CSV Upload & Parsing

### Standard CSV Format

Organizers typically export results from timing software (e.g., My Laps, RaceResult, ChronoTrack). We support a flexible CSV with column mapping.

#### Required Columns
| Column | Maps To | Required |
|---|---|---|
| Bib / Bib # / Bib Number | `bibNumber` | Yes |
| First Name / FirstName | `firstName` | Yes |
| Last Name / LastName | `lastName` | Yes |

#### Optional Columns
| Column | Maps To |
|---|---|
| Gender / Sex | `gender` |
| Age Group / Division | `ageGroup` |
| Club / Team | `club` |
| City / Hometown | `city` |
| Gun Time / Official Time | `gunTime` |
| Chip Time / Net Time | `chipTime` |
| Pace | `pace` |
| Overall / Overall Place | `overallRank` |
| Gender Place | `genderRank` |
| Division Place / AG Place | `ageGroupRank` |
| Status | `status` (finished/dnf/dns/dsq) |

### Client-Side Parser

**File:** `lib/csvResultsParser.ts`

- Use `papaparse` for robust CSV parsing
- Provide a **column mapping UI** — organizer sees their CSV headers and maps each to a RaceDay field
- Show a **preview table** (first 5 rows) before uploading
- Validate required fields, time formats (`HH:MM:SS`), and rank numbers
- Handle common time format variations (`1:23:45`, `01:23:45`, `83:45`)

---

## 5. Public Results Page (`/results`)

**Route:** `app/(marketing)/results/page.tsx`

### Layout

```
+---------------------------------------------+
|  RACE RESULTS                                |
|  Find your finish time and rankings.         |
|                                              |
|  [ Search by runner name or bib number ]     |
|                                              |
|  +-------------+ +-------------+ +------+    |
|  | Event Card  | | Event Card  | |  ... |    |
|  | w/ Results  | | w/ Results  | |      |    |
|  | Count Badge | | Count Badge | |      |    |
|  +-------------+ +-------------+ +------+    |
|                                              |
|  [Show More]                                 |
+----------------------------------------------+
```

### Features

1. **Events with results grid** — Shows only events that have published results (`eventResultsMeta.isPublished === true`)
2. **Event result card** — Event featured image, name, date, location, finisher count badge
3. **Click to view** — navigates to `/events/[id]#results` (event detail page, results section)
4. **Search bar** — Quick global search by runner name or bib number across all events
5. **Pagination** — Load more events as needed

### SEO

- Title: `Race Results | RaceDay`
- Meta: `Browse official race results for marathons, fun runs, and trail races on RaceDay.`

---

## 6. Event Detail — Results Section

**Modified Files:**
- `components/event/EventDetailClient.tsx` — Add "results" to sections
- `components/event/EventNavigation.tsx` — Add "Results" tab
- **New:** `components/event/EventResults.tsx`

### Behavior

- Only shows if `eventResultsMeta.isPublished === true` for the event
- Added as a new section after "Route" in the event detail page
- Added as a tab in `EventNavigation` ("results")

### `EventResults.tsx` Layout

```
+-----------------------------------------------------+
|  RESULTS                                             |
|                                                      |
|  +- Category Tabs ----------------------------+      |
|  | [5K] [10K] [21K] [42K]                     |      |
|  +---------------------------------------------+    |
|                                                      |
|  +- Quick Stats ------------------------------+      |
|  | Finishers: 1,024  | Best: 1:23:45          |      |
|  | DNF: 12           | Avg:  2:05:30          |      |
|  +---------------------------------------------+    |
|                                                      |
|  [ Search by name or bib ... ]                       |
|                                                      |
|  +- Filter Tabs ------------------------------+      |
|  | [All] [Male] [Female] [Age Groups]         |      |
|  +---------------------------------------------+    |
|                                                      |
|  +- Results Table -----------------------------+     |
|  | Rank | Bib  | Name        | AG   | Chip     |     |
|  |------+------+-------------+------+----------|     |
|  | 1    | 101  | Juan Cruz   | M30  | 1:23:45  |     |
|  | 2    | 205  | Maria S.    | F25  | 1:24:01  |     |
|  | ...  | ...  | ...         | ...  | ...      |     |
|  +---------------------------------------------+    |
|                                                      |
|  [Show More]                                         |
+------------------------------------------------------+
```

### Features

1. **Category tabs** — Filter results by race category (5K, 10K, etc.)
2. **Quick stats bar** — Total finishers, DNF count, fastest time, average time
3. **Search** — By name or bib number
4. **Gender / Age Group filters**
5. **Sortable columns** — Rank, Time, Pace (click headers)
6. **Mobile responsive** — Horizontally scrollable table with sticky first column (Rank)
7. **Highlight logged-in user** — If the user is logged in and their result is found, highlight their row with primary color

---

## 7. Organizer Dashboard — Results Tab

**Modified File:** `app/(app)/dashboard/events/[id]/page.tsx`

Add a **"Results"** tab to the organizer event management page (alongside participants, stats, revenue, announcements, volunteers).

### Results Tab Features

1. **Upload Zone** — Drag-and-drop or click to upload CSV
2. **Column Mapping UI** — After CSV is parsed, show mapping interface:
   ```
   Your Column         ->  RaceDay Field
   --------------------    ---------------
   "Runner No"         ->  [Bib Number]
   "First"             ->  [First Name]
   "Last"              ->  [Last Name]
   "Finish Time"       ->  [Chip Time]
   "Official Time"     ->  [Gun Time]
   ...
   ```
3. **Preview** — Show first 5 rows with mapped data
4. **Category selector** — Choose which category the results belong to
5. **Upload button** — Commits data to Convex
6. **Published toggle** — Publish/unpublish results
7. **View results after upload** — Shows the results table (same as public view)
8. **Re-upload** — Option to clear existing results for a category and re-upload
9. **Manual edit** — Click a result row to edit individual fields (time corrections, status)

### New Components

- `components/dashboard/organizer/ResultsUpload.tsx` — CSV upload + column mapping + preview
- `components/dashboard/organizer/ResultsManager.tsx` — Post-upload results management

---

## 8. Runner Dashboard — My Results

**Modified File:** `app/(app)/dashboard/page.tsx` (or `components/dashboard/RunnerView.tsx`)

Add a **"My Results"** section to the runner dashboard:

- Show all results linked to the user's account
- Each card shows: Event name, date, category, chip time, overall rank, gender rank, age group rank
- Links to the full event results page

### New Component

- `components/dashboard/runner/MyResults.tsx`

---

## 9. UI/UX & Design Direction

### Design Principles (aligned with existing RaceDay aesthetic)

- **Dark mode** — Consistent with `bg-background (#1f2937)`, `bg-surface (#374151)`
- **Typography** — Barlow Condensed for headings (font-black italic uppercase), Barlow for body
- **Color palette** — Primary orange (#f97316), CTA green (#22c55e), white/slate for text
- **Table design** — Dark surface with white/5 borders, hover row highlights at `white/[0.02]`
- **Rank badges** — Gold (#fbbf24) for 1st, Silver (#94a3b8) for 2nd, Bronze (#d97706) for 3rd
- **Status badges** — Green for "finished", Red for "DNF", Yellow for "DNS", Slate for "DSQ"
- **Micro-animations** — Fade-in rows, slide-in category tabs, smooth hover transitions
- **Mobile first** — Horizontally scrollable table, card-based view option for smallest screens

### Accessibility

- Minimum 4.5:1 contrast ratio for all text
- Focus-visible rings on all interactive elements
- Sortable columns announced via `aria-sort`
- Table uses proper `<thead>`, `<tbody>`, `<th scope="col">` semantics
- Search has `aria-label` and connected results count

### Performance

- Paginated results (50 per page, load more)
- Use `content-visibility: auto` for long result tables
- `prefers-reduced-motion` respected for all animations
- Server-side rendering for the results page metadata (SEO)

---

## 10. File Manifest

### New Files

| File | Purpose |
|---|---|
| `types/result.ts` | TypeScript interfaces for results |
| `convex/results.ts` | Convex queries and mutations |
| `lib/csvResultsParser.ts` | CSV parsing + column mapping logic |
| `app/(marketing)/results/page.tsx` | Public results listing page |
| `components/event/EventResults.tsx` | Results section for event detail page |
| `components/dashboard/organizer/ResultsUpload.tsx` | CSV upload + column mapper |
| `components/dashboard/organizer/ResultsManager.tsx` | Post-upload results management |
| `components/dashboard/runner/MyResults.tsx` | Runner's personal results feed |

### Modified Files

| File | Change |
|---|---|
| `convex/schema.ts` | Add `raceResults` and `eventResultsMeta` tables |
| `components/event/EventDetailClient.tsx` | Add `EventResults` section + "results" to observer |
| `components/event/EventNavigation.tsx` | Add "results" tab |
| `app/(app)/dashboard/events/[id]/page.tsx` | Add "results" tab for organizers |
| `components/dashboard/RunnerView.tsx` | Add `MyResults` section |
| `components/layout/Navbar.tsx` | Add "Results" nav link |
| `package.json` | Add `papaparse` dependency |

---

## 11. Phase Breakdown

### Phase 1: Foundation (Backend + Types)
> Priority: CRITICAL

1. Add `raceResults` and `eventResultsMeta` tables to `convex/schema.ts`
2. Create `types/result.ts`
3. Create `convex/results.ts` with all queries and mutations
4. Install `papaparse` — `npm install papaparse @types/papaparse`
5. Create `lib/csvResultsParser.ts`

### Phase 2: Organizer Upload (Dashboard)
> Priority: CRITICAL

1. Create `components/dashboard/organizer/ResultsUpload.tsx`
2. Create `components/dashboard/organizer/ResultsManager.tsx`
3. Add "Results" tab to `app/(app)/dashboard/events/[id]/page.tsx`
4. Test CSV upload flow end-to-end

### Phase 3: Public Results Display
> Priority: HIGH

1. Create `components/event/EventResults.tsx`
2. Modify `EventDetailClient.tsx` and `EventNavigation.tsx` to include results section
3. Create `app/(marketing)/results/page.tsx`
4. Add "Results" link to Navbar

### Phase 4: Runner Experience
> Priority: MEDIUM

1. Create `components/dashboard/runner/MyResults.tsx`
2. Add to runner dashboard view
3. Auto-link results to user accounts via bib -> registration matching

### Phase 5: Polish & Edge Cases
> Priority: LOW

1. Manual result editing (organizer)
2. Export results as CSV/PDF
3. Age group and gender rank computation (server-side)
4. Share result card (social sharing image generation)
5. Result notifications (push when results are published)
