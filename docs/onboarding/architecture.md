# RaceDay — Architecture Overview

A high-level map of how the system is structured. Start here before diving into any specific area of the codebase.

---

## 1. Architecture Diagram

```
Browser
  │
  ├── Static assets / fonts (Next.js CDN)
  │
  ▼
Next.js App Router (app/)
  │
  ├── Middleware (proxy.ts)            — Clerk auth on every request
  ├── (marketing)/                     — Public pages, SSR + ISR
  ├── (app)/dashboard/                 — Authenticated dashboard, client-rendered
  ├── auth/                            — Clerk sign-in / SSO callback
  └── api/                             — Server-side route handlers
        │
        ├── /api/payments/*            — Xendit checkout + webhooks
        ├── /api/ai/*                  — Anthropic AI endpoints
        ├── /api/cloudinary/sign       — Signed upload requests
        └── /api/events/*, /api/registrations/*, /api/participant/*

  │                           │
  ▼                           ▼
Convex (real-time DB)      External Services
  │                           │
  ├── queries (read)          ├── Xendit       — Payments (GCash, Maya, bank)
  ├── mutations (write)       ├── Cloudinary   — Image upload + CDN
  ├── actions (side effects)  ├── Resend       — Transactional email
  └── http.ts (webhooks)      └── Anthropic    — AI drafting + suggestions

  │
  ▼
Clerk (Auth)
  — Identity, session management, SSO
  — Token passed to Convex via ConvexProviderWithClerk
```

---

## 2. Three Layers

### Presentation
Next.js pages live in `app/` and React components in `components/`. Pages are thin — they wire up data hooks and hand off to components. UI is built with Tailwind CSS v4 and shadcn/ui, following the design language defined in `CLAUDE.md` and rendered live at `/branding`.

```
app/
  (marketing)/          Public-facing pages (home, events listing, event detail,
  │                     registration flow, about, for-organizers, branding)
  (app)/dashboard/      Authenticated dashboard
  │   admin/            Admin: users, events, applications, logs, analytics
  │   organizer/        Organizer: event management, registrations, kiosk, scanner
  │   become-organizer/ Multi-step application form
  │   profile/          Runner profile
  │   settings/         Account settings
  └── volunteer/        Volunteer invite acceptance

components/
  providers/            ConvexClientProvider, UserSync (see §4)
  ui/                   shadcn/ui primitives
  [feature]/            Feature-specific components
```

### Service
Server-side logic lives in two places:

- `lib/services/` — Convex query/mutation wrappers used in API routes and server components. Each file maps to a domain: `eventService`, `registrationService`, `announcementService`, `applicationService`, `volunteerService`, `statsService`, `aiService`, `emailService`.
- `app/api/` — Next.js Route Handlers for anything that needs a server-side boundary: payment orchestration, webhook ingestion, signed upload URLs, AI streaming, and data exports.
- `lib/hooks/` — Client-side hooks (`useAuth`, `usePaginatedQuery`, `useFormSteps`).
- `lib/validations/` — Zod schemas shared across client and server.
- `lib/admin/` — Admin-specific utilities (audit logging, CSV export).

### Data
Convex is the source of truth for all application data. Functions live in `convex/`:

```
convex/
  schema.ts             Table definitions and index declarations
  users.ts              User creation, sync, role management
  events.ts             Event CRUD, publishing, status transitions
  registrations.ts      Registration lifecycle, bib assignment
  announcements.ts      Event announcements
  applications.ts       Organizer applications + admin review
  volunteers.ts         Volunteer management
  bibs.ts               Bib number allocation
  emails.ts             Email trigger actions (calls Resend)
  notifications.ts      Push notification actions (Expo, future)
  stats.ts              Aggregate statistics queries
  audit.ts              Admin audit log mutations
  auth.config.ts        Clerk JWT configuration for Convex
  http.ts               HTTP action handlers (Xendit webhook ingestion)
```

---

## 3. Route Groups

Next.js route groups control layout nesting without affecting the URL.

| Group              | URL prefix          | Purpose                                      | Auth required |
|--------------------|---------------------|----------------------------------------------|---------------|
| `(marketing)`      | `/`, `/events`, etc | Public pages: discovery, event detail, registration flow | No |
| `(app)`            | `/dashboard/*`      | Runner, organizer, and admin dashboards      | Yes (Clerk)   |
| `auth`             | `/auth/login`, `/auth/sso-callback` | Clerk-hosted sign-in UI | No |
| *(root)*           | `/api/*`, `/og`     | API routes, OG image, robots, sitemap        | Varies        |

Route groups each have their own `layout.tsx`. The `(app)` layout enforces authentication. The `(marketing)` layout renders the public nav and footer.

---

## 4. Authentication Pipeline

```
User visits page
      │
      ▼
proxy.ts (clerkMiddleware)
  — Validates session token on every matched request
  — Protects /dashboard/* routes; redirects unauthenticated users to /auth/login
      │
      ▼
app/layout.tsx
  — Mounts <ConvexClientProvider>
        │
        ├── <ClerkProvider>          — Provides Clerk context to the React tree
        │     │
        │     └── <ConvexProviderWithClerk>
        │           — Passes Clerk's JWT to Convex on every request
        │           — Convex validates the token against auth.config.ts
        │                 │
        │                 └── <UserSync>
        │                       — Runs once after sign-in
        │                       — Calls users.syncUser mutation
        │                       — Creates or updates the Convex user record
        │                         (maps Clerk userId → Convex user document)
        │
        └── {children}              — All pages rendered inside this tree
```

In components, `lib/hooks/useAuth.ts` provides a single unified user object that merges the Clerk identity with the Convex user document (role, organizer profile, etc). Prefer this hook over calling `useUser` and `useQuery(api.users.*)` separately.

---

## 5. Real-time Data

Convex queries are reactive by default. When underlying data changes, every subscribed client receives the update automatically — no polling, no manual refetching.

**Client components** (dashboards, registration flow):
- `useQuery(api.events.list)` — subscribes and re-renders on change
- `useMutation(api.registrations.create)` — optimistically updates UI

**Server components and API routes**:
- `fetchQuery` / `fetchMutation` from `convex/nextjs` — one-shot reads/writes, used where reactivity is not needed (e.g., generating OG images, export endpoints)

Convex actions (in `convex/*.ts`) run in Convex's cloud and are used for side effects that touch external services: sending email via Resend, triggering push notifications, or calling Anthropic. Actions are called from mutations or directly from API routes.

---

## 6. External Services

| Service      | Purpose                                         | Integration point                          |
|--------------|-------------------------------------------------|--------------------------------------------|
| **Xendit**   | Payment processing — GCash, Maya, bank transfer (PH market) | `app/api/payments/create-checkout` initiates; `app/api/payments/webhook` + `convex/http.ts` receive callbacks |
| **Cloudinary** | Image upload and CDN delivery               | `app/api/cloudinary/sign` issues signed upload tokens; `lib/cloudinary/config.ts` holds SDK config |
| **Resend**   | Transactional email (confirmations, bib delivery, announcements) | Called from Convex actions in `convex/emails.ts` via `lib/services/emailService.ts` |
| **Anthropic** | AI-assisted announcement drafting and event suggestions | `app/api/ai/announcement-assistant` and `app/api/ai/event-suggest`; wrapped in `lib/services/aiService.ts` |
| **Expo Push** | Mobile push notifications (planned)         | `convex/notifications.ts` — scaffolded, not yet active |

All secrets for external services are stored as environment variables and never committed to the repository. Server-side service calls happen in API routes or Convex actions — never directly from client components.
