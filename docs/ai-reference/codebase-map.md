# Codebase Map — RaceDay Next

Complete annotated file tree for AI agent navigation. Every file is listed; directories are annotated with their role.

**Entry points** are marked with `★`.

---

```
raceday-next/
│
├── ★ app/layout.tsx                              # Root layout: Barlow fonts, ConvexClientProvider, Toaster, OG metadata
├── ★ app/globals.css                             # Tailwind v4 @theme tokens: colors, fonts, radii, sidebar vars
├── app/error.tsx                                 # Global error boundary ("System Cramp" UI)
├── app/loading.tsx                               # Root-level Suspense fallback spinner
├── app/not-found.tsx                             # Global 404 page ("Off Track")
├── app/robots.ts                                 # robots.txt: blocks all crawlers (pre-launch config)
├── app/sitemap.ts                                # XML sitemap: static routes + dynamic published event URLs
├── app/favicon.ico                               # App favicon (binary)
│
├── app/og/
│   └── route.tsx                                 # Edge route: generates 1200×630 OG image via next/og
│
├── app/auth/                                     # Auth pages (outside route groups, no layout wrapper)
│   ├── login/[[...index]]/page.tsx               # Clerk <SignIn> hosted UI, custom-styled dark theme
│   └── sso-callback/page.tsx                     # OAuth redirect handler with 10s timeout fallback
│
├── app/api/                                      # Next.js API routes (server-side only)
│   ├── ai/
│   │   ├── announcement-assistant/route.ts       # POST: AI-generated announcement drafts via Claude
│   │   └── event-suggest/route.ts                # POST: AI event name/description/timeline suggestions via Claude
│   ├── cloudinary/
│   │   └── sign/route.ts                         # POST: server-side Cloudinary upload signature (keeps secret safe)
│   ├── events/[id]/
│   │   ├── announcements/route.ts                # GET: fetch announcements for a specific event
│   │   ├── check-access/route.ts                 # GET: verify organizer/volunteer access to an event
│   │   └── export/route.ts                       # GET: export event registrations as CSV
│   ├── participant/
│   │   └── announcements/route.ts                # GET: fetch announcements visible to a participant
│   ├── payments/
│   │   ├── create-checkout/route.ts              # POST: create Xendit invoice, persist registration, return payment URL
│   │   ├── sync/[regId]/route.ts                 # GET: sync payment status for a single registration from Xendit
│   │   └── webhook/route.ts                      # POST: Xendit webhook handler — marks registrations paid
│   └── registrations/
│       └── check-vanity/route.ts                 # GET: check if a vanity race number is available for an event
│
├── app/(marketing)/                              # Public marketing pages — layout adds Navbar + Footer
│   ├── layout.tsx                                # Marketing layout: Navbar + Footer, no auth guard
│   ├── page.tsx                                  # Homepage: hero, stats strip, featured events, how-it-works, CTA
│   ├── about/page.tsx                            # About page: mission, team, story
│   ├── branding/page.tsx                         # ★ Living design system style guide (reference when building UI)
│   ├── events/
│   │   ├── page.tsx                              # Public event listing: filter by status/distance, search
│   │   └── [id]/
│   │       ├── loading.tsx                       # Skeleton loader for event detail page
│   │       ├── page.tsx                          # Event detail server component: fetches event, renders client
│   │       └── register/
│   │           ├── page.tsx                      # Registration flow entry: category selection + multi-step form
│   │           ├── failed/page.tsx               # Payment failure page with retry link
│   │           ├── success/page.tsx              # Post-payment success: shows bib, QR code, confirmation
│   │           └── summary/page.tsx              # Registration summary before payment redirect
│   └── for-organizers/page.tsx                   # Organizer landing: features, pricing, apply CTA
│
├── app/(app)/                                    # Authenticated app — layout enforces Clerk auth + redirects
│   ├── layout.tsx                                # ★ App layout: auth guard, redirect to /auth/login if unauthed
│   ├── dashboard/
│   │   ├── layout.tsx                            # Dashboard shell: SidebarProvider + DashboardSidebar + DashboardTopBar
│   │   ├── page.tsx                              # Dashboard home: role-aware — renders RunnerView or OrganizerView
│   │   ├── profile/page.tsx                      # Runner profile view page
│   │   ├── settings/
│   │   │   ├── page.tsx                          # Settings page: switches between ProfileForm and OrganizerProfileForm
│   │   │   ├── ProfileForm.tsx                   # Runner profile edit form (personal info, emergency contact, sizes)
│   │   │   └── OrganizerProfileForm.tsx          # Organizer profile edit form (org details, contact)
│   │   ├── become-organizer/
│   │   │   ├── page.tsx                          # Organizer application page: checks existing status, renders stepper
│   │   │   └── components/
│   │   │       ├── OrganizerFormStepper.tsx      # 4-step application stepper component
│   │   │       ├── OrganizerFormSummary.tsx      # Final review step before submission
│   │   │       ├── Step1OrgInfo.tsx              # Step 1: org name, type, description
│   │   │       ├── Step2Contact.tsx              # Step 2: contact person, email, phone, website
│   │   │       ├── Step3Address.tsx              # Step 3: PH address (barangay, city, province, region)
│   │   │       └── Step4Verification.tsx         # Step 4: TIN, DTI/SEC reg, government ID uploads
│   │   ├── events/[id]/
│   │   │   └── qr/page.tsx                       # Runner QR code view for a specific event registration
│   │   ├── organizer/                            # Organizer-only section — layout blocks non-organizers
│   │   │   ├── layout.tsx                        # Organizer guard: redirects runners/unauthd to /dashboard
│   │   │   ├── page.tsx                          # Organizer dashboard overview: stats, active events, revenue
│   │   │   ├── settings/page.tsx                 # Organizer settings page (profile + org details)
│   │   │   ├── registrations/page.tsx            # All registrations across organizer's events with filters
│   │   │   ├── kiosk/page.tsx                    # Kiosk mode index: lists events to launch kiosk for
│   │   │   ├── scanner/page.tsx                  # QR scanner index: lists events to launch scanner for
│   │   │   └── events/
│   │   │       ├── page.tsx                      # Organizer event list: all events with status/actions
│   │   │       ├── create/page.tsx               # Create event page: renders EventForm in create mode
│   │   │       └── [id]/
│   │   │           ├── page.tsx                  # Event detail for organizer: registrations, announcements, stats
│   │   │           ├── edit/page.tsx             # Edit event page: renders EventForm in edit mode
│   │   │           ├── kiosk/
│   │   │           │   ├── layout.tsx            # Kiosk layout: minimal fullscreen (no sidebar)
│   │   │           │   └── page.tsx              # Race kit claim kiosk: lookup runner, mark kit claimed
│   │   │           └── scanner/page.tsx          # QR scanner page: camera scan + manual lookup for check-in
│   │   └── admin/                                # Admin-only section
│   │       ├── layout.tsx                        # Admin layout: nav tabs for admin sub-sections
│   │       ├── page.tsx                          # Admin overview: platform stats, recent events, recent users
│   │       ├── analytics/page.tsx                # Admin analytics: charts for registrations, revenue, events
│   │       ├── events/page.tsx                   # Admin event management: feature, cancel, delete events
│   │       ├── logs/page.tsx                     # Audit log viewer: admin action history
│   │       ├── users/page.tsx                    # User management: search, view, change roles
│   │       └── applications/
│   │           ├── page.tsx                      # Organizer applications queue: pending/approved/rejected tabs
│   │           └── components/
│   │               └── ApplicationCard.tsx       # Card for each application: details + approve/reject/info actions
│   └── volunteer/
│       └── accept/page.tsx                       # Volunteer invite acceptance page: verify token, link account
│
├── components/
│   ├── providers/
│   │   ├── ★ ConvexClientProvider.tsx            # Wraps app in ClerkProvider + ConvexProviderWithClerk + UserSync
│   │   ├── AuthProvider.tsx                      # React context wrapper around useAuth (optional, rarely used directly)
│   │   └── UserSync.tsx                          # Silent component: syncs Clerk user to Convex on first load
│   │
│   ├── layout/
│   │   ├── Navbar.tsx                            # Top navigation: logo, links, auth state, mobile menu
│   │   ├── Footer.tsx                            # Site footer: links, legal, branding
│   │   └── PageWrapper.tsx                       # Simple max-w-7xl centered container with px-4
│   │
│   ├── dashboard/
│   │   ├── DashboardSidebar.tsx                  # shadcn Sidebar: role-aware nav groups, role switcher, user avatar
│   │   ├── DashboardTopBar.tsx                   # Top bar inside dashboard: breadcrumb, sidebar trigger
│   │   ├── RunnerView.tsx                        # Runner dashboard composition: hero + quick actions + announcements
│   │   ├── RunnerQuickActions.tsx                # Quick action buttons for runners (find race, view profile)
│   │   ├── RunnerAnnouncements.tsx               # Announcements feed for runner's registered events
│   │   ├── OrganizerView.tsx                     # Organizer dashboard composition: stats + active events + feed
│   │   ├── AnnouncementsTab.tsx                  # Full announcements management tab for organizer event detail
│   │   ├── shared/
│   │   │   └── BaseQuickAction.tsx               # Base card component for quick action items (icon + label + link)
│   │   ├── organizer/
│   │   │   ├── OrganizerActiveEvents.tsx         # Active events list widget on organizer dashboard
│   │   │   ├── OrganizerStats.tsx                # Stats strip (total events, registrations, revenue)
│   │   │   ├── OrganizerRevenueStats.tsx         # Revenue breakdown chart/stats widget
│   │   │   ├── OrganizerRegistrationsFeed.tsx    # Live feed of recent registrations
│   │   │   ├── OrganizerQuickActions.tsx         # Quick action buttons for organizers
│   │   │   ├── OrganizerDraftsNotice.tsx         # Banner shown when organizer has unpublished draft events
│   │   │   ├── OrganizerKitFulfillment.tsx       # Race kit claim progress widget
│   │   │   ├── DemographicsTab.tsx               # Participant demographics tab: gender, size, age charts
│   │   │   ├── DraggableWidget.tsx               # Drag-and-drop wrapper for rearrangeable dashboard widgets
│   │   │   ├── InviteVolunteerDialog.tsx         # Dialog for inviting a volunteer to an event with permissions
│   │   │   └── VolunteerManagement.tsx           # Full volunteer management tab: list, invite, revoke
│   │   ├── runner/
│   │   │   ├── NextRaceHero.tsx                  # Hero card showing runner's next upcoming race
│   │   │   ├── RunnerEventCard.tsx               # Card for each event a runner is registered for
│   │   │   ├── EventRegistrationList.tsx         # List of all runner's event registrations
│   │   │   ├── RunnerSidebar.tsx                 # Right sidebar on runner dashboard (profile completion, etc.)
│   │   │   └── ProfileCompletionCard.tsx         # Card showing % complete + missing profile fields
│   │   └── volunteer/
│   │       └── VolunteerDashboard.tsx            # Volunteer dashboard view: event info, kit claim, scanner access
│   │
│   ├── event/                                    # Event detail page components (public-facing)
│   │   ├── EventDetailClient.tsx                 # Client wrapper for event detail: hydrates server data
│   │   ├── EventHero.tsx                         # Event hero: featured image, title, date, location, register CTA
│   │   ├── EventCategories.tsx                   # Race category cards: distances, prices, inclusions, availability
│   │   ├── EventTimeline.tsx                     # Event day timeline display
│   │   ├── EventRoute.tsx                        # Route map display: GPX rendering on Leaflet map
│   │   ├── EventGallery.tsx                      # Photo gallery with lightbox
│   │   ├── EventInfo.tsx                         # Event info section: location map, organizer info
│   │   ├── EventNavigation.tsx                   # Sticky section navigation tabs (Overview, Categories, Route…)
│   │   ├── EventAnnouncements.tsx                # Public announcements feed on event detail page
│   │   └── MobileStickyCTA.tsx                   # Mobile-only sticky bottom bar with "Register Now" button
│   │
│   ├── events/
│   │   └── EventCard.tsx                         # Event card for listing pages: image, date, distance badges, price
│   │
│   ├── forms/
│   │   ├── event/
│   │   │   ├── EventForm.tsx                     # 6-step event creation/edit form (orchestrator + react-hook-form)
│   │   │   ├── Step1Basic.tsx                    # Event form step 1: name, description, date, location
│   │   │   ├── Step2Images.tsx                   # Event form step 2: featured image + gallery uploads (Cloudinary)
│   │   │   ├── Step3Categories.tsx               # Event form step 3: distance categories, pricing, inclusions
│   │   │   ├── Step4Timeline.tsx                 # Event form step 4: event day timeline items
│   │   │   ├── Step5Features.tsx                 # Event form step 5: vanity numbers, early bird, registration deadline
│   │   │   ├── Step6Review.tsx                   # Event form step 6: full review before submit/publish
│   │   │   └── StationManager.tsx                # Map-based aid station manager inside Step3Categories
│   │   └── registration/
│   │       ├── RegistrationForm.tsx              # Multi-step registration form orchestrator
│   │       ├── Step0Who.tsx                      # Registration step 0: register for self or proxy
│   │       ├── Step1Category.tsx                 # Registration step 1: pick race distance/category
│   │       ├── Step2Details.tsx                  # Registration step 2: participant personal info
│   │       ├── Step3Vanity.tsx                   # Registration step 3: vanity race number selection
│   │       └── Step4Review.tsx                   # Registration step 4: review + terms + payment redirect
│   │
│   ├── shared/
│   │   ├── LoginPromptModal.tsx                  # Modal prompting unauthenticated users to log in before registering
│   │   ├── QRScannerWrapper.tsx                  # Camera-based QR scanner (html5-qrcode) with error handling
│   │   └── RouteMapViewer.tsx                    # Leaflet map viewer for GPX route files
│   │
│   ├── admin/
│   │   ├── AdminOverviewChart.tsx                # Simple bar chart for admin dashboard overview
│   │   └── AnalyticsCharts.tsx                   # Recharts analytics charts for admin analytics page
│   │
│   └── ui/                                       # shadcn/ui primitives (auto-generated / lightly customized)
│       ├── alert-dialog.tsx                      # Radix alert dialog
│       ├── badge.tsx                             # Badge/pill component
│       ├── breadcrumb.tsx                        # Breadcrumb navigation
│       ├── button.tsx                            # Button with variants: primary (orange), cta (green), outline, ghost
│       ├── card.tsx                              # Card container
│       ├── dialog.tsx                            # Modal dialog
│       ├── dropdown-menu.tsx                     # Radix dropdown menu
│       ├── ImageUpload.tsx                       # Cloudinary image upload widget with preview and drag-and-drop
│       ├── input.tsx                             # Text input
│       ├── label.tsx                             # Form label
│       ├── separator.tsx                         # Horizontal rule
│       ├── sheet.tsx                             # Slide-in sheet/drawer
│       ├── sidebar.tsx                           # shadcn sidebar primitives (large, auto-generated)
│       ├── skeleton.tsx                          # Loading skeleton
│       ├── table.tsx                             # Table primitives
│       ├── tabs.tsx                              # Tabs component
│       ├── textarea.tsx                          # Textarea input
│       └── tooltip.tsx                           # Tooltip primitive
│
├── convex/                                       # Convex backend: schema, queries, mutations, actions
│   ├── ★ schema.ts                               # Data model: users, events, registrations, bibs, applications,
│   │                                             #   auditLogs, volunteers, announcements tables + all indexes
│   ├── auth.config.ts                            # Convex auth: Clerk JWT issuer domain config
│   ├── http.ts                                   # HTTP router (currently empty — no webhooks via Convex HTTP)
│   ├── users.ts                                  # User queries/mutations: current, syncUser, getById, updateProfile,
│   │                                             #   changeRole, list (admin), updateDashboardLayout
│   ├── events.ts                                 # Event queries/mutations: getById, list, create, update, publish,
│   │                                             #   cancel, delete, feature, getByOrganizer
│   ├── registrations.ts                          # Registration queries/mutations: create, getByUser, getByEvent,
│   │                                             #   markPaid, markKitClaimed, cancel, getById, getForOrganizer
│   ├── bibs.ts                                   # Bib number queries/mutations: generate (sequential/vanity),
│   │                                             #   isTaken, counter management per event+category
│   ├── announcements.ts                          # Announcement CRUD: create, list by event, delete
│   ├── applications.ts                           # Organizer application mutations: submit, approve, reject, list
│   ├── audit.ts                                  # Audit log mutation: log admin actions to auditLogs table
│   ├── emails.ts                                 # Email action: sends via Resend (registration confirmation, etc.)
│   ├── notifications.ts                          # Push notification action (Expo push tokens)
│   ├── stats.ts                                  # Stats queries: platform-wide counts for admin dashboard
│   ├── volunteers.ts                             # Volunteer queries/mutations: invite, accept, revoke, list by event,
│   │                                             #   getByUserIdAndEvent, check permissions
│   └── _generated/                               # Auto-generated by `convex dev` — do not edit manually
│       ├── api.d.ts                              # TypeScript types for all Convex API endpoints
│       ├── api.js                                # Runtime API object (imported as `api` everywhere)
│       ├── dataModel.d.ts                        # TypeScript types for all Convex table documents
│       ├── server.d.ts                           # Server-side type declarations
│       └── server.js                             # Server-side runtime helpers
│
├── lib/                                          # Shared utilities, services, hooks, constants
│   ├── utils.ts                                  # cn(), formatDate(), formatCurrency(), formatDistance(),
│   │                                             #   toDate(), toInputDate(), generateId(), computeProfileCompletion()
│   ├── dashboard-nav.ts                          # Nav config per role (runnerNav, organizerNav, adminNav),
│   │                                             #   getNavForRole(), getActiveRole(), getAvailableRoles()
│   ├── earlyBirdUtils.ts                         # isEarlyBirdActive(), getEffectivePrice(), getEarlyBirdDaysRemaining(),
│   │                                             #   isRegistrationClosed(), isEventOver(), isCategoryFull()
│   ├── bibUtils.ts                               # isBibTaken(), generateBibNumber(), generateBibAndQR(),
│   │                                             #   getRaceNumberFormat(), formatBibNumber()
│   ├── qr.ts                                     # generateQRCode(text) → base64 Data URL via qrcode package
│   ├── volunteerAccess.ts                        # Server-side volunteer permission helpers: getVolunteerRecord(),
│   │                                             #   isEventVolunteer(), hasVolunteerPermission(), getVolunteerPermissions()
│   ├── admin/
│   │   ├── audit.ts                              # logAdminAction() — server-side helper wrapping convex audit.log
│   │   └── export.ts                             # exportToCSV() — client-side CSV download utility
│   ├── cloudinary/
│   │   └── config.ts                             # CLOUDINARY_CONFIG constants + cloudinaryLoader() for next/image
│   ├── constants/
│   │   ├── ph-id-types.ts                        # PH_GOVERNMENT_ID_TYPES array (PhilSys, DL, Passport, etc.)
│   │   └── ph-regions.ts                         # Philippines region and province data for address forms
│   ├── hooks/
│   │   ├── ★ useAuth.ts                          # Primary auth hook: merges Clerk + Convex user, exposes role/signOut
│   │   ├── useFormSteps.ts                       # Multi-step form hook with per-step validation via react-hook-form
│   │   └── usePaginatedQuery.ts                  # Convex paginated query wrapper with loadMore/hasMore interface
│   ├── services/
│   │   ├── aiService.ts                          # Client-side helpers: getAISuggestions(), getAITimeline(), improveText()
│   │   ├── announcementService.ts                # Client-side announcement fetch helpers
│   │   ├── applicationService.ts                 # Client-side organizer application submit/fetch helpers
│   │   ├── emailService.ts                       # Server-side email send via Resend (registration confirmation)
│   │   ├── eventService.ts                       # Server-side event fetch (for sitemap, SSR): getEvents(), getEventById()
│   │   ├── registrationService.ts                # Client/server registration helpers: createRegistration, getStatus
│   │   ├── statsService.ts                       # Client-side stats fetch helper
│   │   └── volunteerService.ts                   # Client-side volunteer invite/accept/revoke helpers
│   └── validations/
│       ├── event.ts                              # Zod schema for event creation form
│       ├── organizer.ts                          # Zod schema for organizer application form
│       ├── profile.ts                            # Zod schema for user profile form
│       ├── registration.ts                       # Zod schema for registration form
│       └── volunteer.ts                          # Zod schema for volunteer invite form
│
├── types/                                        # Shared TypeScript interfaces
│   ├── event.ts                                  # RaceEvent, EventCategory, TimelineItem, RaceStation, EventStatus
│   ├── user.ts                                   # User, UserRole, OrganizerApplication, OrganizerType
│   ├── registration.ts                           # Registration, ParticipantInfo, RegistrationStatus, PaymentStatus
│   ├── volunteer.ts                              # EventVolunteer, VolunteerPermission, VolunteerStatus
│   └── announcement.ts                           # Announcement type
│
├── hooks/
│   └── use-mobile.ts                             # useIsMobile() — viewport width < 768px via matchMedia
│
├── public/                                       # Static assets served at /
│   ├── favicon.ico                               # Favicon (duplicate of app/favicon.ico)
│   ├── favicon.png                               # PNG favicon
│   ├── logo.png                                  # RaceDay logo
│   ├── placeholder-running.jpg                   # Running photo placeholder for event cards
│   ├── placeholder.png                           # Generic image placeholder
│   ├── file.svg                                  # Next.js default SVG (unused)
│   ├── globe.svg                                 # Next.js default SVG (unused)
│   ├── next.svg                                  # Next.js default SVG (unused)
│   ├── vercel.svg                                # Vercel SVG (unused)
│   ├── window.svg                                # Next.js default SVG (unused)
│   └── assets/
│       ├── run.png                               # Hero image: runners at race (used on homepage/for-organizers)
│       ├── run2.png                              # Hero image variant: runners at race
│       └── ultra.png                             # Ultra trail race hero image
│
├── design-system/                                # Design spec documents (not served — for reference only)
│   ├── raceday/MASTER.md                         # Runner-facing design system spec
│   └── raceday-organizer/MASTER.md               # Organizer-facing design system spec
│
├── docs/                                         # Project documentation
│   ├── README.md                                 # Docs index: links to all onboarding + reference + AI docs
│   ├── ai-reference/
│   │   └── codebase-map.md                       # This file — complete annotated file tree for AI navigation
│   ├── onboarding/
│   │   ├── architecture.md                       # High-level architecture and data flow
│   │   ├── getting-started.md                    # Environment setup, prerequisites, first run
│   │   └── key-concepts.md                       # Domain concepts: roles, event lifecycle, features
│   ├── reference/                                # (empty — stubs planned per docs/README.md)
│   └── superpowers/
│       ├── plans/                                # AI-generated implementation plans (historical context)
│       │   ├── 2026-03-11-dashboard-shadcn-revamp.md
│       │   ├── 2026-03-11-organizer-dashboard-rearrangeable-widgets.md
│       │   ├── 2026-03-11-remove-organizer-overview-tabs.md
│       │   ├── 2026-03-12-convex-efficiency-optimizations.md
│       │   ├── 2026-03-13-dashboard-design-language-migration.md
│       │   └── 2026-03-13-runner-dashboard-improvements.md
│       └── specs/                                # Design specs for completed features
│           ├── 2026-03-11-dashboard-shadcn-revamp-design.md
│           ├── 2026-03-13-homepage-revamp-design.md
│           └── 2026-03-13-runner-dashboard-improvements-design.md
│
├── plan/                                         # Product/feature planning documents
│   ├── race-results.md                           # Race results feature plan
│   └── companion-app/                            # React Native companion app plan
│       ├── 00-overview.md
│       ├── stage-1-foundation.md
│       ├── stage-2-core-features.md
│       ├── stage-3-live-tracking.md
│       └── stage-4-polish-release.md
│
├── images/                                       # Working/scratch images (not in public/, not git-tracked)
│   └── generated-1773827758354.png               # AI-generated image asset (staging)
│
├── CLAUDE.md                                     # ★ Project coding conventions, design language, component patterns
├── README.md                                     # Basic project readme
├── next.config.ts                                # Next.js config: image domains, security headers, /settings redirect
├── package.json                                  # Dependencies + scripts (dev runs convex + next in parallel)
├── postcss.config.js                             # PostCSS config for Tailwind v4
├── tsconfig.json                                 # TypeScript config with @/ path alias
├── eslint.config.mjs                             # ESLint config (next/core-web-vitals)
├── proxy.ts                                      # Dev proxy config (raceday-next.test local domain)
├── components.json                               # shadcn/ui CLI config (component registry, style, aliases)
├── next-env.d.ts                                 # Next.js TypeScript env declarations (auto-generated)
└── raceday.pen                                   # Pencil design file (binary, used with mcp__pencil tools)
```

---

## Key entry points

| File | Why it matters |
|---|---|
| `app/layout.tsx` | Every page starts here — fonts, providers, toast |
| `app/globals.css` | All design tokens (colors, spacing, fonts) — edit here to change the theme |
| `convex/schema.ts` | The complete data model — understand this before touching any query/mutation |
| `components/providers/ConvexClientProvider.tsx` | Clerk + Convex integration bridge |
| `lib/hooks/useAuth.ts` | The primary auth hook used everywhere for user/role access |
| `lib/dashboard-nav.ts` | Role-based navigation config — add routes here when adding dashboard sections |
| `app/(app)/layout.tsx` | Auth gate for all protected routes |
| `app/(app)/dashboard/organizer/layout.tsx` | Role gate — only organizers and admins pass |
| `app/(marketing)/branding/page.tsx` | Living style guide — reference before building any new UI |
| `CLAUDE.md` | Coding conventions and design language rules — read before writing any code |

---

## Dependency map (what imports what)

```
pages/components
  → lib/hooks/useAuth          (auth state)
  → convex/_generated/api      (data queries/mutations)
  → lib/utils                  (formatting helpers)
  → lib/earlyBirdUtils         (pricing/date logic)
  → lib/services/*             (API call helpers)
  → types/*                    (shared interfaces)
  → components/ui/*            (shadcn primitives)

convex/*.ts
  → convex/schema              (table definitions)
  → convex/_generated/server   (query/mutation/action helpers)

app/api/*/route.ts
  → convex/_generated/api      (server-side fetchQuery/fetchMutation)
  → lib/services/*             (business logic helpers)
  → lib/admin/audit            (admin action logging)

components/providers/ConvexClientProvider
  → convex/_generated/api      (bootstrap Convex client)
  → components/providers/UserSync (Clerk→Convex user sync)
```

---

## Route structure summary

| URL pattern | File | Auth |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Public |
| `/about` | `app/(marketing)/about/page.tsx` | Public |
| `/events` | `app/(marketing)/events/page.tsx` | Public |
| `/events/[id]` | `app/(marketing)/events/[id]/page.tsx` | Public |
| `/events/[id]/register` | `app/(marketing)/events/[id]/register/page.tsx` | Public (login wall inside) |
| `/events/[id]/register/success` | `app/(marketing)/events/[id]/register/success/page.tsx` | Public |
| `/events/[id]/register/failed` | `app/(marketing)/events/[id]/register/failed/page.tsx` | Public |
| `/events/[id]/register/summary` | `app/(marketing)/events/[id]/register/summary/page.tsx` | Public |
| `/for-organizers` | `app/(marketing)/for-organizers/page.tsx` | Public |
| `/auth/login` | `app/auth/login/[[...index]]/page.tsx` | Public |
| `/auth/sso-callback` | `app/auth/sso-callback/page.tsx` | Public |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Authed |
| `/dashboard/profile` | `app/(app)/dashboard/profile/page.tsx` | Authed |
| `/dashboard/settings` | `app/(app)/dashboard/settings/page.tsx` | Authed |
| `/dashboard/become-organizer` | `app/(app)/dashboard/become-organizer/page.tsx` | Authed |
| `/dashboard/events/[id]/qr` | `app/(app)/dashboard/events/[id]/qr/page.tsx` | Authed |
| `/dashboard/organizer` | `app/(app)/dashboard/organizer/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/events` | `app/(app)/dashboard/organizer/events/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/events/create` | `app/(app)/dashboard/organizer/events/create/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/events/[id]` | `app/(app)/dashboard/organizer/events/[id]/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/events/[id]/edit` | `app/(app)/dashboard/organizer/events/[id]/edit/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/events/[id]/kiosk` | `app/(app)/dashboard/organizer/events/[id]/kiosk/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/events/[id]/scanner` | `app/(app)/dashboard/organizer/events/[id]/scanner/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/registrations` | `app/(app)/dashboard/organizer/registrations/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/kiosk` | `app/(app)/dashboard/organizer/kiosk/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/scanner` | `app/(app)/dashboard/organizer/scanner/page.tsx` | Organizer/Admin |
| `/dashboard/organizer/settings` | `app/(app)/dashboard/organizer/settings/page.tsx` | Organizer/Admin |
| `/dashboard/admin` | `app/(app)/dashboard/admin/page.tsx` | Admin only |
| `/dashboard/admin/users` | `app/(app)/dashboard/admin/users/page.tsx` | Admin only |
| `/dashboard/admin/events` | `app/(app)/dashboard/admin/events/page.tsx` | Admin only |
| `/dashboard/admin/applications` | `app/(app)/dashboard/admin/applications/page.tsx` | Admin only |
| `/dashboard/admin/analytics` | `app/(app)/dashboard/admin/analytics/page.tsx` | Admin only |
| `/dashboard/admin/logs` | `app/(app)/dashboard/admin/logs/page.tsx` | Admin only |
| `/volunteer/accept` | `app/(app)/volunteer/accept/page.tsx` | Authed |
