# Stage 7 — Config, Utilities & DX Polish
**Priority:** 🟢 Low
**Issues Fixed:** #15 (toDate duplicated), #16 (lazy imports confirmed), #27 (security headers), #28 (og-image.png)
**Files Touched:** 3
**Risk:** Very Low — additive config changes, one utility consolidation

---

## Overview

Small but important housekeeping: eliminate a utility duplication that can cause divergent behavior, add HTTP security headers that improve browser security posture, and fix a broken Open Graph image reference that affects social sharing previews.

---

## Fix 1 — Deduplicate `toDate` Utility
**Issue:** #15
**Files:** `lib/utils.ts`, `lib/earlyBirdUtils.ts`

### The Problem

`toDate()` is implemented twice with slightly different signatures:

```ts
// lib/utils.ts — handles Firestore Timestamp via .toDate() method
export function toDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value?.seconds) return new Date(value.seconds * 1000);
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// lib/earlyBirdUtils.ts — private, only handles Timestamp + Date + string
function toDate(date: Timestamp | Date | string | number): Date {
    if (!date) return new Date();
    if (date instanceof Timestamp) { return date.toDate(); }
    if (date instanceof Date) { return date; }
    return new Date(date);
}
```

The `utils.ts` version is more robust (handles raw `{ seconds }` objects) and is already exported.

### Changes

**In `lib/earlyBirdUtils.ts`:**

```ts
// Remove the private toDate function at the bottom of the file

// Add import at the top:
import { toDate } from "@/lib/utils";

// Remove:
// import { Timestamp } from "firebase/firestore"; ← only needed if used elsewhere
```

Verify the `Timestamp` import from `firebase/firestore` is still needed (used in the type annotation `event.earlyBird.startDate: Timestamp | Date | string`). If only used in the private `toDate` type signature, it can be removed too.

---

## Fix 2 — Add HTTP Security Headers
**Issue:** #27
**File:** `next.config.ts`

### Changes

Add a `headers()` function to apply security headers to all routes:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            }
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    // Prevent clickjacking
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    // Prevent MIME type sniffing
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    // Control referrer information
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    // Prevent XSS in older browsers
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    // Control browser features/APIs
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(self)",
                    },
                ],
            },
            {
                // Strict HSTS for all pages (forces HTTPS)
                // Only add this when you're certain the site is fully on HTTPS
                source: "/(.*)",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
```

> **Note on CSP:** A full Content Security Policy (CSP) is the most impactful security header but requires careful configuration to avoid breaking Firebase, Cloudinary, and inline styles. Leave CSP for a dedicated security sprint to avoid unintended breakage.

> **Note on `geolocation=(self)`:** The `Permissions-Policy` allows geolocation only for the same origin — needed if you ever use geolocation for location picking. Adjust if not needed.

---

## Fix 3 — Create / Add `og-image.png`
**Issue:** #28
**File:** `public/og-image.png` (create/add), `app/layout.tsx` (verify)

### The Problem

`app/layout.tsx` references `/og-image.png` for Open Graph and Twitter Card previews:
```ts
images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "RaceDay - The Ultimate Running Platform" }]
```

If the file doesn't exist in `/public`, social previews (Slack, Twitter/X, Facebook, iMessage) will show no image.

### The Fix

**Create the OG image.** Recommended spec:
- Size: **1200 × 630px**
- Format: PNG (or JPG for smaller file size)
- Content: RaceDay logo centered, brand colors, tagline

**Option A — Static image:** Design in Figma/Canva and export as `public/og-image.png`

**Option B — Programmatic (next/og):** Use Next.js Image Response API to generate it dynamically:

Create `app/og/route.tsx`:
```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: "#111827",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ fontSize: 72, fontWeight: 900, color: "#f97316", letterSpacing: "-2px" }}>
                    RACEDAY
                </div>
                <div style={{ fontSize: 28, color: "#9ca3af", marginTop: 16 }}>
                    The Ultimate Running Platform
                </div>
                <div style={{ fontSize: 18, color: "#4b5563", marginTop: 8 }}>
                    Discover • Register • Race
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
```

Then update `app/layout.tsx`:
```ts
images: [{ url: "/og", width: 1200, height: 630, alt: "RaceDay - The Ultimate Running Platform" }]
```

**Option B is recommended** because it's always available (no missing file) and can be updated by editing code.

---

## Acceptance Criteria

- [ ] `lib/earlyBirdUtils.ts` has zero local `toDate` function — it imports from `lib/utils.ts`
- [ ] All early bird date calculations still work correctly after deduplication
- [ ] Run `curl -I https://your-domain.com` and verify response headers include `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] Paste the site URL into https://www.opengraph.xyz — preview image appears
- [ ] Paste the site URL into Twitter Card Validator — preview image appears
- [ ] No TypeScript errors in `next.config.ts`

---

## Quick Verification Commands

```bash
# Check security headers locally
curl -I http://localhost:3000

# Check OG image renders
open http://localhost:3000/og

# Verify toDate imports
grep -r "function toDate" lib/   # should only appear in lib/utils.ts
```
