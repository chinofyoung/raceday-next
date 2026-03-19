# Project Structure — RaceDay Next

Annotated directory tree. Paths verified against the actual filesystem.

---

## Top-Level Layout

```
raceday-next/
├── app/                  # Next.js App Router — all routes
├── components/           # React components, organized by feature
├── convex/               # Convex backend: schema, queries, mutations, actions
├── lib/                  # Utilities, hooks, services, validations, constants
├── types/                # TypeScript type definitions
├── hooks/                # Standalone React hooks (non-lib)
├── public/               # Static assets served at /
├── docs/                 # Project documentation
└── design-system/        # Design tokens / Tailwind config reference
```

---

## `app/` — Routes

```
app/
├── layout.tsx                        # Root layout (fonts, providers)
├── globals.css                       # Global styles + Tailwind v4 config
├── error.tsx / loading.tsx / not-found.tsx
├── robots.ts / sitemap.ts / og/      # SEO
│
├── (marketing)/                      # Public-facing routes (no auth required)
│   ├── layout.tsx                    # Marketing shell (Navbar + Footer)
│   ├── page.tsx                      # Homepage
│   ├── about/page.tsx
│   ├── for-organizers/page.tsx       # Organizer marketing page
│   ├── branding/page.tsx             # Living design system reference
│   └── events/
│       ├── page.tsx                  # Event listing / browse
│       └── [id]/
│           ├── page.tsx              # Event detail page
│           ├── loading.tsx
│           └── register/
│               ├── page.tsx          # Multi-step registration form
│               ├── success/page.tsx  # Post-payment confirmation
│               └── failed/page.tsx  # Payment failure
│
├── (app)/                            # Authenticated routes
│   ├── layout.tsx                    # Auth guard
│   ├── dashboard/
│   │   ├── layout.tsx                # Dashboard shell (sidebar + topbar)
│   │   ├── page.tsx                  # Role-aware dashboard home
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx         # Runner + organizer profile settings
│   │   ├── become-organizer/         # Organizer application flow
│   │   │   ├── page.tsx
│   │   │   └── components/           # Multi-step form steps (Step1–Step4)
│   │   ├── events/[id]/qr/page.tsx   # Runner QR code view
│   │   ├── organizer/                # Organizer-only section
│   │   │   ├── layout.tsx            # Organizer auth guard
│   │   │   ├── page.tsx              # Organizer dashboard home
│   │   │   ├── events/
│   │   │   │   ├── page.tsx          # Event list
│   │   │   │   ├── create/page.tsx   # Event creation form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Event management overview
│   │   │   │       ├── edit/page.tsx
│   │   │   │       ├── kiosk/page.tsx    # Race-day check-in kiosk (full screen)
│   │   │   │       └── scanner/page.tsx  # QR scanner for check-in
│   │   │   ├── registrations/page.tsx
│   │   │   ├── scanner/page.tsx      # Cross-event scanner (organizer global)
│   │   │   ├── kiosk/page.tsx        # Cross-event kiosk
│   │   │   └── settings/page.tsx
│   │   └── admin/                    # Admin-only section
│   │       ├── layout.tsx            # Admin auth guard
│   │       ├── page.tsx              # Admin dashboard
│   │       ├── applications/         # Organizer application review
│   │       ├── analytics/page.tsx
│   │       ├── events/page.tsx
│   │       ├── logs/page.tsx         # Audit log viewer
│   │       └── users/page.tsx
│   └── volunteer/
│       └── accept/page.tsx           # Volunteer invitation acceptance
│
├── api/                              # Next.js API routes (server-side)
│   ├── ai/
│   │   ├── announcement-assistant/   # AI drafting for announcements
│   │   └── event-suggest/            # AI suggestions during event creation
│   ├── cloudinary/sign/              # Signed upload URL for Cloudinary
│   ├── events/[id]/
│   │   ├── announcements/            # Send announcement emails
│   │   ├── check-access/             # Volunteer/organizer access check
│   │   └── export/                   # CSV export of registrations
│   ├── payments/
│   │   ├── create-checkout/          # Create Xendit invoice
│   │   ├── sync/[regId]/             # Manual payment status sync
│   │   └── webhook/                  # Xendit webhook receiver
│   ├── registrations/check-vanity/   # Check vanity bib availability
│   └── participant/announcements/    # Fetch announcements for a participant
│
└── auth/
    ├── login/[[...index]]/page.tsx   # Clerk-hosted login page
    └── sso-callback/page.tsx         # Clerk SSO redirect handler
```

---

## `components/` — React Components

```
components/
├── ui/                   # shadcn/ui primitives (button, card, dialog, table, etc.)
├── layout/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── PageWrapper.tsx   # Standard page container with max-width + padding
├── providers/
│   ├── ConvexClientProvider.tsx  # Wraps app with ConvexReactClient
│   ├── AuthProvider.tsx          # Clerk provider
│   └── UserSync.tsx              # Syncs Clerk user → Convex users table on login
├── forms/
│   ├── event/            # 6-step event creation/edit form
│   │   ├── EventForm.tsx         # Orchestrator with step state
│   │   ├── Step1Basic.tsx – Step6Review.tsx
│   │   └── StationManager.tsx    # Aid/water station map editor
│   └── registration/     # 5-step registration flow
│       ├── RegistrationForm.tsx  # Orchestrator
│       ├── Step0Who.tsx          # Self vs. proxy registration
│       ├── Step1Category.tsx
│       ├── Step2Details.tsx      # Participant info
│       ├── Step3Vanity.tsx       # Optional vanity bib selection
│       └── Step4Review.tsx
├── event/                # Sections on the public event detail page
│   ├── EventDetailClient.tsx     # Client wrapper / scroll spy
│   ├── EventHero.tsx
│   ├── EventInfo.tsx
│   ├── EventCategories.tsx
│   ├── EventTimeline.tsx
│   ├── EventRoute.tsx
│   ├── EventGallery.tsx
│   ├── EventAnnouncements.tsx
│   ├── EventNavigation.tsx       # In-page anchor nav
│   └── MobileStickyCTA.tsx
├── events/
│   └── EventCard.tsx             # Card used in event listing
├── dashboard/
│   ├── DashboardSidebar.tsx
│   ├── DashboardTopBar.tsx
│   ├── RunnerView.tsx            # Runner dashboard home
│   ├── RunnerQuickActions.tsx
│   ├── RunnerAnnouncements.tsx
│   ├── OrganizerView.tsx         # Organizer dashboard home
│   ├── AnnouncementsTab.tsx      # Shared announcements management tab
│   ├── runner/                   # Runner-specific widgets
│   │   ├── NextRaceHero.tsx
│   │   ├── EventRegistrationList.tsx
│   │   ├── RunnerEventCard.tsx
│   │   ├── RunnerSidebar.tsx
│   │   └── ProfileCompletionCard.tsx
│   ├── organizer/                # Organizer-specific widgets
│   │   ├── OrganizerStats.tsx
│   │   ├── OrganizerRevenueStats.tsx
│   │   ├── OrganizerRegistrationsFeed.tsx
│   │   ├── OrganizerActiveEvents.tsx
│   │   ├── OrganizerKitFulfillment.tsx
│   │   ├── OrganizerQuickActions.tsx
│   │   ├── OrganizerDraftsNotice.tsx
│   │   ├── DemographicsTab.tsx
│   │   ├── VolunteerManagement.tsx
│   │   ├── InviteVolunteerDialog.tsx
│   │   └── DraggableWidget.tsx   # Rearrangeable dashboard widget wrapper
│   ├── volunteer/
│   │   └── VolunteerDashboard.tsx
│   └── shared/
│       └── BaseQuickAction.tsx   # Shared quick-action button primitive
├── admin/
│   ├── AdminOverviewChart.tsx
│   └── AnalyticsCharts.tsx
└── shared/
    ├── LoginPromptModal.tsx      # Modal shown when unauthenticated user tries to register
    ├── QRScannerWrapper.tsx      # Camera-based QR scanning (used in kiosk + scanner pages)
    └── RouteMapViewer.tsx        # GPX route visualization on a map
```

---

## `convex/` — Backend

```
convex/
├── schema.ts             # Database schema (source of truth for all data shapes)
├── auth.config.ts        # Clerk JWT config for Convex auth
├── http.ts               # HTTP action routes (e.g., Xendit webhook)
├── users.ts              # User queries and mutations
├── events.ts             # Event CRUD, status transitions
├── registrations.ts      # Registration creation, cancellation, kit claiming
├── volunteers.ts         # Volunteer invite, accept, revoke
├── applications.ts       # Organizer application submit, approve, reject
├── announcements.ts      # Announcement CRUD
├── emails.ts             # Email send actions (via email service)
├── notifications.ts      # Push notification actions
├── bibs.ts               # Bib number assignment and counter management
├── audit.ts              # Audit log write helpers
└── stats.ts              # Aggregated stats queries
```

---

## `lib/` — Utilities & Services

```
lib/
├── utils.ts                      # General helpers (cn, date formatting, etc.)
├── earlyBirdUtils.ts             # Early bird pricing window logic
├── bibUtils.ts                   # Bib assignment helpers
├── qr.ts                         # QR code generation
├── volunteerAccess.ts            # Volunteer permission checks
├── dashboard-nav.ts              # Dashboard sidebar nav config
├── admin/
│   ├── audit.ts                  # Audit log write helpers (client-side)
│   └── export.ts                 # CSV export logic
├── cloudinary/
│   └── config.ts                 # Cloudinary SDK setup
├── constants/
│   ├── ph-regions.ts             # Philippine regions/provinces list
│   └── ph-id-types.ts            # Philippine ID type list
├── hooks/
│   ├── useAuth.ts                # Wrapper around Clerk + Convex user state
│   ├── useFormSteps.ts           # Multi-step form state management
│   └── usePaginatedQuery.ts      # Paginated Convex query helper
├── services/
│   ├── aiService.ts              # AI API call wrappers (announcement, event suggest)
│   ├── announcementService.ts    # Announcement business logic
│   ├── applicationService.ts     # Organizer application logic
│   ├── eventService.ts           # Event business logic
│   ├── emailService.ts           # Email send wrapper
│   ├── registrationService.ts    # Registration business logic
│   ├── statsService.ts           # Stats aggregation helpers
│   └── volunteerService.ts       # Volunteer invite/accept logic
└── validations/
    ├── event.ts                  # Zod schemas for event form
    ├── organizer.ts              # Zod schemas for organizer application
    ├── profile.ts                # Zod schemas for user profile
    ├── registration.ts           # Zod schemas for registration form
    └── volunteer.ts              # Zod schemas for volunteer invite
```

---

## `types/` — TypeScript Types

```
types/
├── event.ts              # Event and Category types
├── registration.ts       # Registration types
├── user.ts               # User and role types
├── volunteer.ts          # Volunteer types
└── announcement.ts       # Announcement types
```

---

## `hooks/` — Standalone Hooks

```
hooks/
└── use-mobile.ts         # Detects mobile viewport (used for responsive UI)
```

Shared hooks used across the app live in `lib/hooks/` instead.

---

## `public/` — Static Assets

Static files served at the root URL. Contains images, icons, and other assets referenced directly in markup.

---

## `docs/` — Documentation

```
docs/
├── README.md
├── onboarding/           # This documentation
│   ├── key-concepts.md
│   └── project-structure.md
└── superpowers/
    ├── plans/            # Implementation plans (feature-level)
    └── specs/            # Design specs
```
