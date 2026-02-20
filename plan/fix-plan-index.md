# RaceDay — Fix Plan Index
**Based on:** `code-review-2026-02-20.md`
**Total Issues:** 30 across 4 severity levels
**Total Stages:** 8

---

## Stage Overview

| Stage | Name | Issues Fixed | Priority |
|-------|------|-------------|----------|
| [Stage 1](./fix-stage-1-security-api.md) | Security: API Hardening | #1, #3, #4, #29 | 🔴 Critical |
| [Stage 2](./fix-stage-2-bib-atomicity.md) | Security: Bib Race Condition + QR Fix | #2, #21 | 🔴 Critical |
| [Stage 3](./fix-stage-3-form-performance.md) | Form Performance & Type Safety | #5, #6, #12, #13, #19 | 🟠 High |
| [Stage 4](./fix-stage-4-data-fetching.md) | Data Fetching & State | #7, #10, #11, #14, #17, #18 | 🟠 High |
| [Stage 5](./fix-stage-5-auth-middleware.md) | Auth Guard & Middleware | #8 | 🟠 High |
| [Stage 6](./fix-stage-6-render-bundle.md) | Rendering & Bundle Optimization | #9, #20, #22, #23, #24, #25, #26 | 🟠–🟢 |
| [Stage 7](./fix-stage-7-config-polish.md) | Config, Utilities & DX | #15, #16, #27, #28 | 🟢 Low |
| [Stage 8](./fix-stage-8-accessibility.md) | Accessibility | #30 | 🟢 Low |

---

## Quick Issue → Stage Map

| # | Issue | Stage |
|---|-------|-------|
| 1 | Xendit webhook no auth | Stage 1 |
| 2 | Bib race condition | Stage 2 |
| 3 | AI endpoint no auth/rate limit | Stage 1 |
| 4 | `console.log` leaks payment data | Stage 1 |
| 5 | `watch()` over-subscribing in EventForm | Stage 3 |
| 6 | Triple `useFormContext` in Step3Categories | Stage 3 |
| 7 | Dashboard overfetches Firestore | Stage 4 |
| 8 | Client-only auth guard | Stage 5 |
| 9 | Unthrottled scroll listener | Stage 6 |
| 10 | `usePaginatedQuery` unstable dep | Stage 4 |
| 11 | EditEventPage bypasses service layer | Stage 4 |
| 12 | Silent publish failure | Stage 3 |
| 13 | `initialData: any` type casts | Stage 3 |
| 14 | AuthProvider real-time listener overuse | Stage 4 |
| 15 | `toDate` duplicated utility | Stage 7 |
| 16 | Leaflet/recharts/html5-qrcode not lazy | Stage 6 |
| 17 | Dashboard no error state | Stage 4 |
| 18 | Profile completion stale | Stage 4 |
| 19 | `inclusionsText` may desync | Stage 3 |
| 20 | Mobile menu stays open on nav | Stage 6 |
| 21 | Free reg generates QR twice | Stage 2 |
| 22 | Leaflet loaded eagerly | Stage 6 |
| 23 | recharts not dynamic imported | Stage 6 |
| 24 | html5-qrcode not dynamic imported | Stage 6 |
| 25 | `uuid` vs `crypto.randomUUID` | Stage 6 |
| 26 | `date-fns` moduleResolution check | Stage 7 |
| 27 | Missing security headers | Stage 7 |
| 28 | Missing `og-image.png` | Stage 7 |
| 29 | Webhook no idempotency | Stage 1 |
| 30 | Missing `aria-label` on icon buttons | Stage 8 |

---

## Execution Order

Start with Stages 1 and 2 immediately — they are security-critical and can affect real revenue/data integrity in production.

```
Stage 1 (Security API)   ──► DEPLOY
Stage 2 (Bib Atomicity)  ──► DEPLOY
Stage 3 (Form Perf)      ──► test locally
Stage 4 (Data Fetching)  ──► test locally
Stage 5 (Middleware)     ──► test auth flows carefully
Stage 6 (Bundle)         ──► run `next build` and check bundle analysis
Stage 7 (Config/DX)      ──► low risk, can batch
Stage 8 (A11y)           ──► low risk, can batch
```
