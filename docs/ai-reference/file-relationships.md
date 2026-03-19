# File Relationships — Dependency Graph

This document maps which files change together. Use it as a checklist whenever you add or modify a feature. All paths are relative to the project root.

---

## 1. Schema Change Cascade

When you modify `convex/schema.ts`, ripple outward in this order:

| Layer | Files to update | Why |
|---|---|---|
| **TypeScript types** | `types/*.ts` | Interfaces mirror schema shape |
| **Convex functions** | `convex/*.ts` — functions that read/write the changed table | Argument validators and field access must match |
| **Zod schemas** | `lib/validations/*.ts` | Any field that appears in a form needs a matching Zod rule |
| **Form components** | `components/forms/**/*.tsx` | Rendered inputs and defaultValues reflect schema fields |
| **Services** | `lib/services/*.ts` | Server-side wrappers re-expose the data; mapping logic may need updating |

**Index note:** Adding or removing a Convex index (`.index(...)`) in `schema.ts` requires updating every `withIndex(...)` call in `convex/*.ts` that references that index name.

---

## 2. New Event Feature Chain

Files that change together when adding an event-related feature.

```
convex/schema.ts                          ← add field to `events` table
convex/events.ts                          ← expose field via query/mutation args
types/event.ts                            ← add field to RaceEvent / EventCategory interfaces
lib/validations/event.ts                  ← add Zod rule (eventSchema / eventCategorySchema)
lib/services/eventService.ts              ← update mapping (e.g. spread or explicit field)
components/forms/event/EventForm.tsx      ← wire step to new field; update STEP_FIELDS map
components/forms/event/Step*.tsx          ← whichever step renders the new input
components/event/EventDetailClient.tsx    ← renders the public event page shell
components/event/Event*.tsx              ← specific section component (Hero, Info, Route, etc.)
app/(marketing)/events/[id]/page.tsx      ← server page; fetches via fetchQuery and passes to client
app/(app)/dashboard/organizer/events/[id]/page.tsx   ← organizer detail view
app/(app)/dashboard/organizer/events/[id]/edit/page.tsx ← edit page calls eventService.getEventById
```

**Also touch if the field affects pricing or registration eligibility:**
```
lib/earlyBirdUtils.ts                     ← price/date logic used by registration flow
app/api/payments/create-checkout/route.ts ← server-side price verification reads event fields
```

---

## 3. New Registration Feature Chain

```
convex/schema.ts                          ← add field to `registrations` table
convex/registrations.ts                   ← expose via query/mutation
types/registration.ts                     ← update Registration / ParticipantInfo interfaces
lib/validations/registration.ts           ← update registrationSchema (Zod)
lib/services/registrationService.ts       ← update field mapping in getRegistrations / getRegistrationsWithEvents
components/forms/registration/RegistrationForm.tsx  ← wire step; update STEP_FIELDS map
components/forms/registration/Step*.tsx   ← specific step that captures the new field
app/(marketing)/events/[id]/register/page.tsx       ← entry point for the registration flow
app/api/payments/create-checkout/route.ts ← reads registrationData; verify/validate new field
app/api/payments/webhook/route.ts         ← processes paid registration; may need to persist new field
app/api/payments/sync/[regId]/route.ts    ← manual payment sync; mirrors webhook logic
```

**If the field feeds into bib/QR generation:**
```
lib/bibUtils.ts                           ← calls convex/bibs.ts; update args if needed
convex/bibs.ts                            ← generate mutation reads event.categories
```

---

## 4. Auth Change Chain

```
convex/auth.config.ts                     ← Clerk JWT issuer domain / applicationID
components/providers/ConvexClientProvider.tsx  ← wraps ClerkProvider + ConvexProviderWithClerk; mounts UserSync
components/providers/UserSync.tsx         ← calls convex/users.ts:syncUser on sign-in
convex/users.ts                           ← syncUser mutation; current query; getByUid query
components/providers/AuthProvider.tsx     ← React context; wraps lib/hooks/useAuth
lib/hooks/useAuth.ts                      ← combines Clerk useUser + Convex useQuery(api.users.current)
types/user.ts                             ← User / OrganizerApplication interfaces
proxy.ts                                  ← clerkMiddleware route matcher (not a Next.js middleware file name)
```

**Note on naming:** `proxy.ts` at the project root is the actual middleware file (exported as `default` from `clerkMiddleware()`). Next.js picks it up via the `matcher` config inside it. Despite the non-standard name, it works because `next.config.ts` does not remap it — verify this if you ever rename it.

---

## 5. Dashboard Change Chain

Each role has its own view layer. Changes flow from backend to page:

```
convex/<table>.ts                         ← query or mutation the widget needs
app/(app)/dashboard/page.tsx              ← runner dashboard; queries convex/registrations.ts
app/(app)/dashboard/organizer/page.tsx    ← organizer overview; queries events + registrations
app/(app)/dashboard/admin/page.tsx        ← admin overview; queries via convex/stats.ts
components/dashboard/RunnerView.tsx       ← runner layout; renders runner widgets
components/dashboard/OrganizerView.tsx    ← organizer layout; renders organizer widgets
components/dashboard/runner/*.tsx         ← runner-specific widgets (NextRaceHero, RunnerEventCard, etc.)
components/dashboard/organizer/*.tsx      ← organizer widgets (OrganizerStats, OrganizerRevenueStats, etc.)
components/dashboard/volunteer/*.tsx      ← VolunteerDashboard
lib/dashboard-nav.ts                      ← runnerNav / organizerNav / adminNav config; update if adding a route
```

**Stats layer (admin only):**
```
convex/stats.ts                           ← getPlatformStats query (admin-gated)
lib/services/statsService.ts              ← thin wrapper: fetchQuery(api.stats.getPlatformStats)
app/(app)/dashboard/admin/analytics/page.tsx  ← consumes statsService
```

---

## 6. Volunteer Feature Chain

```
convex/schema.ts                          ← volunteers table; permissions array
convex/volunteers.ts                      ← invite / accept / revoke / listByEvent / getByEmail mutations+queries
types/volunteer.ts                        ← EventVolunteer / VolunteerPermission / VolunteerStatus
lib/validations/volunteer.ts              ← volunteerInviteSchema / volunteerPermissionUpdateSchema (Zod)
lib/services/volunteerService.ts          ← server-side wrappers (inviteVolunteer, getEventVolunteers, etc.)
lib/volunteerAccess.ts                    ← server-side permission checks (React.cache); called from API routes / RSC
lib/services/emailService.ts             ← sendVolunteerInvitation (Resend email)
components/dashboard/organizer/VolunteerManagement.tsx   ← UI for managing volunteers on an event
components/dashboard/organizer/InviteVolunteerDialog.tsx ← invite modal
components/dashboard/volunteer/VolunteerDashboard.tsx    ← volunteer's own view
app/(app)/dashboard/organizer/events/[id]/page.tsx       ← hosts VolunteerManagement tab
app/(app)/dashboard/organizer/events/[id]/kiosk/page.tsx ← kiosk mode; gated by volunteerAccess
app/(app)/dashboard/organizer/events/[id]/scanner/page.tsx ← scanner; gated by volunteerAccess
```

---

## 7. Announcement Feature Chain

```
convex/schema.ts                          ← announcements table (eventId, organizerId, sendEmail, sentCount)
convex/announcements.ts                   ← listByEvent / listForParticipant / create / update / remove
                                            create schedules sendAnnouncementPushes (internalAction)
convex/notifications.ts                   ← sendPush internalAction (Expo push via HTTP)
convex/emails.ts                          ← sendAnnouncementEmail action (Resend batch; reads internal queries)
types/announcement.ts                     ← Announcement / CreateAnnouncementInput interfaces
lib/services/announcementService.ts       ← server-side wrappers used by API routes
components/dashboard/AnnouncementsTab.tsx ← organizer UI; calls convex/announcements directly via useQuery/useMutation/useAction
components/dashboard/RunnerAnnouncements.tsx ← runner UI; fetches via /api/participant/announcements REST endpoint
components/event/EventAnnouncements.tsx   ← public event detail page section; receives announcements as props
app/api/events/[id]/announcements/route.ts     ← GET: fetchQuery(api.announcements.listByEvent); auth via Clerk
app/api/participant/announcements/route.ts     ← GET: fetchQuery(api.announcements.listForParticipant); auth via Clerk token
app/api/ai/announcement-assistant/route.ts     ← POST: AI drafting via Anthropic SDK; no Convex write
app/(app)/dashboard/organizer/events/[id]/page.tsx  ← mounts AnnouncementsTab
app/(app)/dashboard/page.tsx              ← mounts RunnerAnnouncements
app/(marketing)/events/[id]/page.tsx      ← passes announcements[] prop to EventAnnouncements
```

**Delivery sub-chain (on every `create` mutation):**
```
convex/announcements.ts:create
  → ctx.scheduler.runAfter → convex/announcements.ts:sendAnnouncementPushes (internalAction)
      → internal.users.getInternalBatch   (batch fetch push tokens)
      → internal.notifications.sendPush   (Expo HTTP push)
      → internal.announcements.updateSentCount (patch sentCount)
  → convex/emails.ts:sendAnnouncementEmail (triggered manually from AnnouncementsTab via useAction)
      → internal.registrations.getEmailsForEventInternal
      → internal.events.getByIdInternal
      → Resend batch API (100 emails/batch)
```

---

## 8. Organizer Application Chain

```
convex/schema.ts                          ← organizerApplications table
convex/applications.ts                    ← submit / update / list / getByUserId / review mutations+queries
types/user.ts                             ← OrganizerApplication interface (lives alongside User)
lib/validations/organizer.ts              ← organizerStep1–4Schema + fullOrganizerSchema (Zod)
lib/services/applicationService.ts        ← getOrganizerApplications / submitOrganizerApplication / reviewApplication
app/(app)/dashboard/become-organizer/page.tsx            ← multi-step form; uses fullOrganizerSchema + applicationService
app/(app)/dashboard/become-organizer/components/Step*.tsx ← individual form steps
app/(app)/dashboard/admin/applications/page.tsx           ← admin review list
app/(app)/dashboard/admin/applications/components/ApplicationCard.tsx ← admin review action
```

**When an application is approved** the mutation patches `users.organizer` and sets `role = "organizer"`, so also touch:
```
convex/users.ts                           ← updateProfile / role-change logic inside applications.review
types/user.ts                             ← User.organizer sub-object
```

---

## 9. Payment Flow Chain

The payment flow touches multiple layers. All three API routes share the same bib/QR generation utility.

```
app/(marketing)/events/[id]/register/page.tsx     ← registration entry; mounts RegistrationForm
components/forms/registration/RegistrationForm.tsx ← on submit calls /api/payments/create-checkout
app/api/payments/create-checkout/route.ts
  → fetchQuery(api.events.getById)                 ← price verification
  → fetchQuery(api.registrations.checkExisting)    ← duplicate check
  → fetchMutation(api.registrations.create)        ← creates pending registration
  → lib/bibUtils.ts:generateBibAndQR               ← race number + QR code
  → Xendit API                                     ← creates invoice; returns redirect URL

app/api/payments/webhook/route.ts                  ← Xendit calls this on PAID/SETTLED
  → fetchQuery(api.registrations.getById)
  → lib/bibUtils.ts:generateBibAndQR               ← assign bib if not yet assigned
  → fetchMutation(api.registrations.markPaid)      ← status → paid

app/api/payments/sync/[regId]/route.ts             ← manual re-sync trigger (organizer/runner)
  → Xendit API (fetch invoice status)
  → Same bib+mark-paid path as webhook

lib/bibUtils.ts
  → fetchQuery(api.bibs.isTaken)
  → fetchMutation(api.bibs.generate)               ← uses bibCounters table + category.raceNumberFormat
  → lib/qr.ts:generateQRCode                       ← qrcode library → data URL

convex/bibs.ts                                     ← isTaken query; generate mutation (reads bibCounters)
convex/schema.ts                                   ← bibCounters table
lib/qr.ts                                          ← thin wrapper around `qrcode` npm package
```

---

## 10. AI Feature Chain

Two independent AI features share the same authentication pattern (Clerk `auth()` + rate limiting).

**Event creation assistant:**
```
components/forms/event/Step1Basic.tsx     ← "Suggest with AI" button
lib/services/aiService.ts                 ← getAISuggestions / getAITimeline / improveText (fetch wrappers)
app/api/ai/event-suggest/route.ts         ← POST; Anthropic SDK; streams or returns JSON
```

**Announcement drafting assistant:**
```
components/dashboard/AnnouncementsTab.tsx ← "Draft with AI" button; fetch call inline
app/api/ai/announcement-assistant/route.ts ← POST; Anthropic SDK; per-IP rate limiting
```

Neither AI route writes to Convex directly. They return text that the client then submits through the normal mutation path.

---

## 11. Image Upload Chain

Cloudinary is used for all media uploads (event images, category images, organizer ID documents).

```
lib/cloudinary/config.ts                  ← NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + upload preset
app/api/cloudinary/sign/route.ts          ← POST; returns a signed upload params object
components/ui/ImageUpload.tsx             ← shared upload widget; calls /api/cloudinary/sign then uploads directly
components/forms/event/Step2Images.tsx    ← uses ImageUpload for featuredImage + galleryImages
components/forms/event/Step3Categories.tsx ← uses ImageUpload for per-category categoryImage
app/(app)/dashboard/become-organizer/components/Step4Verification.tsx ← uses ImageUpload for gov ID docs
```

The resulting Cloudinary URL is stored in the Convex document field (e.g. `events.featuredImage`, `events.categories[].categoryImage`).

---

## Cross-Cutting Utilities

These files are imported widely and are not specific to a single feature. Changes here have broad blast radius.

| File | Used by | Purpose |
|---|---|---|
| `lib/utils.ts` | Most components | `cn()`, `toDate()`, `toInputDate()`, `computeProfileCompletion()` |
| `lib/earlyBirdUtils.ts` | RegistrationForm, create-checkout route, event detail | Price/date logic |
| `lib/hooks/useAuth.ts` | Almost every page and dashboard component | Current user + role |
| `lib/hooks/useFormSteps.ts` | EventForm, RegistrationForm | Multi-step form step validation |
| `lib/hooks/usePaginatedQuery.ts` | Admin pages, organizer registration list | Convex pagination helper |
| `lib/dashboard-nav.ts` | DashboardSidebar, DashboardTopBar | Nav items per role |
| `convex/_generated/` | Every file that imports `api` or `Id` | Auto-generated; never edit manually — runs after `npx convex dev` |
