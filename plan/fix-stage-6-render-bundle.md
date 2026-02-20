# Stage 6 — Rendering & Bundle Optimization
**Priority:** 🟠 High → 🟢 Low
**Issues Fixed:** #9 (scroll listener), #20 (mobile menu), #22 (Leaflet eager), #23 (recharts eager), #24 (html5-qrcode eager), #25 (uuid), #26 (date-fns module resolution)
**Files Touched:** 5
**Risk:** Low — bundle changes are additive; behavior changes are small and isolated

**Vercel Rule References:** `bundle-dynamic-imports`, `bundle-barrel-imports`, `client-passive-event-listeners`, `rerender-use-ref-transient-values`, `js-cache-function-results`

---

## Overview

This stage focuses on two categories:

1. **Runtime performance:** Passive scroll listener (immediate improvement), mobile menu auto-close
2. **Bundle size:** Dynamic imports for Leaflet (~150KB), recharts (~200KB), html5-qrcode (~80KB), and removing the `uuid` dependency

Combined, these changes should reduce initial JS bundle by **300-400KB** on the event form and scanner pages.

---

## Fix 1 — Passive Scroll Listener + `requestAnimationFrame` Throttle
**Issue:** #9
**File:** `components/layout/Navbar.tsx`

### Changes

Add `{ passive: true }` to the scroll listener and throttle with `requestAnimationFrame` to avoid layout thrashing:

```ts
// Before:
React.useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
}, []);

// After — passive + rAF throttled:
React.useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            setIsScrolled(window.scrollY > 10);
        });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
        window.removeEventListener("scroll", handleScroll);
        cancelAnimationFrame(rafId);
    };
}, []);
```

The `passive: true` flag tells the browser this handler will never call `preventDefault()` — the browser can then start scrolling immediately without waiting for the JS event handler to complete, eliminating scroll jank.

---

## Fix 2 — Mobile Menu Auto-Close on Route Change
**Issue:** #20
**File:** `components/layout/Navbar.tsx`

### Changes

Add a `useEffect` watching `pathname` to close the mobile menu when the route changes (handles browser back/forward and programmatic navigation):

```ts
// Add usePathname import (already imported in some versions, add if missing)
import { useRouter, usePathname } from "next/navigation";

// Inside Navbar component, after the existing state:
const pathname = usePathname();

// Add this effect:
React.useEffect(() => {
    setIsOpen(false);
}, [pathname]);
```

This is a one-liner addition. No other changes needed.

---

## Fix 3 — Dynamic Import: Leaflet / RouteMapViewer
**Issue:** #22
**Files:** `components/forms/event/Step3Categories.tsx`, `components/event/EventDetailClient.tsx` (and any other file that imports `RouteMapViewer`)

### Why

Leaflet is ~150KB gzipped and requires `window` — it cannot be server-side rendered. Currently it's imported directly, meaning it's bundled into the main chunk for any page that uses `Step3Categories` or the event detail page.

### Changes

**A. In `components/forms/event/Step3Categories.tsx`:**

```ts
// Remove:
import { RouteMapViewer } from "@/components/shared/RouteMapViewer";

// Add at top of file:
import dynamic from "next/dynamic";

const RouteMapViewer = dynamic(
    () => import("@/components/shared/RouteMapViewer"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-3xl">
                <div className="text-center space-y-2 opacity-40">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Loading map...</p>
                </div>
            </div>
        ),
    }
);
```

**B. Apply the same pattern in `EventDetailClient.tsx`** if it imports `RouteMapViewer` directly.

**C. Ensure `components/shared/RouteMapViewer.tsx` itself does NOT have `"use client"` directive conflict** — it should have `"use client"` since Leaflet requires the browser DOM. The dynamic import with `ssr: false` handles this correctly.

---

## Fix 4 — Dynamic Import: recharts
**Issue:** #23
**Files:** `app/(app)/dashboard/admin/analytics/page.tsx` (and any other page using recharts)

### Changes

Find all recharts usage and wrap in `next/dynamic`. Example pattern:

```ts
// In admin analytics page — replace direct imports:
// import { BarChart, Bar, XAxis, YAxis, ... } from "recharts";

// With dynamic imports:
import dynamic from "next/dynamic";

// Dynamic import the entire chart component (keeps recharts in a lazy chunk)
const AdminRevenueChart = dynamic(
    () => import("@/components/admin/AdminRevenueChart"),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
        ),
    }
);
```

**Create isolated chart components** (e.g., `components/admin/AdminRevenueChart.tsx`) that contain all recharts imports. The dynamic import boundary keeps recharts completely out of the initial bundle.

> Check all admin pages: `dashboard/admin/analytics/`, `dashboard/admin/events/`, etc.

---

## Fix 5 — Dynamic Import: html5-qrcode (QR Scanner)
**Issue:** #24
**File:** Wherever `html5-qrcode` is used (likely `app/(app)/dashboard/events/[id]/scanner/page.tsx` or similar)

### Changes

```ts
// Replace direct import:
// import { Html5QrcodeScanner } from "html5-qrcode";

// With dynamic import:
import dynamic from "next/dynamic";

const QRScanner = dynamic(
    () => import("@/components/shared/QRScannerWrapper"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full aspect-square bg-black/40 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        ),
    }
);
```

**Create `components/shared/QRScannerWrapper.tsx`** as the isolated wrapper that contains the `html5-qrcode` import:
```ts
"use client";
import { Html5QrcodeScanner } from "html5-qrcode";
// ... wrap the scanner in a React component
```

---

## Fix 6 — Replace `uuid` with `crypto.randomUUID()`
**Issue:** #25
**File:** `components/forms/event/Step3Categories.tsx`

### Changes

```ts
// Remove:
import { v4 as uuidv4 } from "uuid";

// Update addCategory:
const addCategory = () => {
    append({
        id: crypto.randomUUID(), // ← native, no import needed
        name: "",
        // ...rest
    });
};
```

`crypto.randomUUID()` is supported in:
- All modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
- Node.js 14.17+
- Next.js Edge runtime

After removing the import from `Step3Categories.tsx`, check if `uuid` is used anywhere else in the codebase. If not, uninstall it:
```bash
npm uninstall uuid
npm uninstall @types/uuid
```

---

## Fix 7 — Verify `date-fns` Tree-Shaking
**Issue:** #26
**File:** `tsconfig.json`

### Check

Open `tsconfig.json` and verify the `moduleResolution` field:

```json
{
    "compilerOptions": {
        "moduleResolution": "bundler"  // ← should be "bundler" or "node16"/"node next"
    }
}
```

If it's `"node"` (the old default), `date-fns` v4 may not tree-shake correctly. `"bundler"` is the recommended setting for Next.js 13+.

**Current `tsconfig.json` likely has:**
```json
"moduleResolution": "bundler"
```

If it already says `"bundler"`, this issue is resolved. If it says `"node"`, change it to `"bundler"` and verify the build still compiles.

---

## Acceptance Criteria

- [ ] Run `next build` and compare bundle sizes before/after — initial JS bundle should be smaller
- [ ] Scroll performance: Chrome DevTools Performance tab shows no `scroll` handler blocking paint
- [ ] On mobile: open nav menu, press browser Back → menu is closed
- [ ] Event form step 3: RouteMapViewer shows a loading spinner before the map renders
- [ ] Admin analytics page shows a skeleton while recharts loads
- [ ] QR scanner page shows a spinner while html5-qrcode loads
- [ ] `uuid` package removed from `node_modules` (if no other usages found)
- [ ] No TypeScript errors after removing `uuid` types

---

## Bundle Size Tracking

Before starting this stage, run:
```bash
ANALYZE=true npm run build
```
(Requires `@next/bundle-analyzer` — add it if not present)

Target reductions per route:
| Route | Before | Target |
|-------|--------|--------|
| `/dashboard/events/create` | ~X KB | -150KB (Leaflet) |
| `/dashboard/admin/analytics` | ~X KB | -200KB (recharts) |
| Scanner page | ~X KB | -80KB (html5-qrcode) |
