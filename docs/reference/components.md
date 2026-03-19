# Component Organization Reference

A navigational map of all components in the codebase, organized by feature area. For styling conventions and design tokens, see `CLAUDE.md`. For form architecture detail, see `docs/reference/forms.md` (if present).

---

## 1. UI Primitives (`components/ui/`)

Standard shadcn/ui components. All follow shadcn conventions — built on Radix UI primitives with CVA (class-variance-authority) for variant management. Style them via Tailwind utility classes; never modify the component internals directly. See CLAUDE.md for color tokens and button patterns.

| File | Description |
|---|---|
| `alert-dialog.tsx` | Modal confirmation dialog with cancel/confirm actions, built on Radix AlertDialog |
| `badge.tsx` | Small inline label with CVA variants (default, secondary, destructive, outline) |
| `breadcrumb.tsx` | Page hierarchy breadcrumb trail with separator slots |
| `button.tsx` | Primary interactive button with CVA variants matching the design system (primary, cta, outline, ghost) |
| `card.tsx` | Surface container with header, content, and footer sub-components |
| `dialog.tsx` | Generic modal overlay built on Radix Dialog |
| `dropdown-menu.tsx` | Accessible context/action menu built on Radix DropdownMenu |
| `input.tsx` | Single-line text input with consistent border and focus ring styling |
| `label.tsx` | Form field label with htmlFor association |
| `separator.tsx` | Horizontal or vertical visual divider |
| `sheet.tsx` | Slide-in panel (drawer) from any edge, built on Radix Dialog |
| `sidebar.tsx` | Full sidebar layout system used by the dashboard — includes `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuButton`, `SidebarTrigger`, and related primitives |
| `skeleton.tsx` | Loading placeholder with pulse animation |
| `table.tsx` | Semantic HTML table with styled header, body, row, and cell sub-components |
| `tabs.tsx` | Tabbed interface built on Radix Tabs |
| `textarea.tsx` | Multi-line text input |
| `tooltip.tsx` | Hover tooltip built on Radix Tooltip |
| `ImageUpload.tsx` | Custom Cloudinary upload widget with drag-and-drop, preview, aspect ratio presets, and `resourceType` support — not a shadcn component |

---

## 2. Layout (`components/layout/`)

Structural shells used across all page types.

| File | Description |
|---|---|
| `Navbar.tsx` | Fixed top nav with scroll-triggered backdrop blur, auth-aware links (Dashboard, Manage Events, Admin Panel), Clerk `UserButton`, and a full-screen mobile drawer with slide-in animation |
| `Footer.tsx` | Three-column footer (brand blurb, Explore links, Legal links) with a bottom copyright bar |
| `PageWrapper.tsx` | Thin container wrapper applying `max-w-7xl mx-auto px-4` and a `fade-in` entry animation; accepts `container={false}` to skip the max-width constraint |

---

## 3. Providers (`components/providers/`)

App-level context and initialization components mounted at the root layout.

| File | Description |
|---|---|
| `ConvexClientProvider.tsx` | Root provider that nests `ClerkProvider` (dark theme) around `ConvexProviderWithClerk`, bridging Clerk auth tokens into Convex; also mounts `UserSync` |
| `AuthProvider.tsx` | React context exposing `user`, `loading`, `role`, and `refreshUser` from the `useAuth` hook — consumed via `useAuthContext()` |
| `UserSync.tsx` | Renderless component that fires a one-shot `users.syncUser` Convex mutation on first authenticated load, keeping the Convex user record in sync with Clerk |

---

## 4. Forms (`components/forms/`)

Multi-step wizard forms built with react-hook-form + Zod. See `forms.md` for detailed field-by-field documentation.

### Event creation (`components/forms/event/`)

Six-step wizard for organizers to create or edit a race event.

| File | Description |
|---|---|
| `EventForm.tsx` | Root wizard controller — manages step state, `react-hook-form` context, Zod validation (`eventSchema`), and submit/save-draft logic |
| `Step1Basic.tsx` | Basic event details: name, date, location, description |
| `Step2Images.tsx` | Featured image and gallery uploads via `ImageUpload` |
| `Step3Categories.tsx` | Race category configuration (distance, price, slots, early-bird pricing) |
| `Step4Timeline.tsx` | Event day schedule/timeline entries |
| `Step5Features.tsx` | Route GPX upload and aid/water station placement via `StationManager` |
| `Step6Review.tsx` | Full summary review before publish or save-as-draft |
| `StationManager.tsx` | Interactive Leaflet map for placing and editing aid/water stations along a route polyline |

### Registration (`components/forms/registration/`)

Five-step wizard for runners registering for an event.

| File | Description |
|---|---|
| `RegistrationForm.tsx` | Root wizard controller — manages step state, `react-hook-form` context, Zod validation (`registrationSchema`), and Convex mutation submission |
| `Step0Who.tsx` | Registrant type selection (self vs. someone else) and login gate |
| `Step1Category.tsx` | Race category and distance selection with early-bird price display |
| `Step2Details.tsx` | Participant personal details (name, age, emergency contact, shirt size, etc.) |
| `Step3Vanity.tsx` | Optional vanity race number selection |
| `Step4Review.tsx` | Full registration summary before final submission |

---

## 5. Event Detail (`components/event/`)

Modular sections composing the public event detail page. Orchestrated by `EventDetailClient`, which handles scroll-spy, lazy map loading, and registration state.

| File | Description |
|---|---|
| `EventDetailClient.tsx` | Top-level client shell — fetches registration state, drives scroll-spy `activeSection`, lazy-loads the route map, and composes all section components |
| `EventHero.tsx` | Full-bleed hero with featured image, event name, date/location badges, registration CTA button, and organizer edit shortcut |
| `EventNavigation.tsx` | Sticky section tab bar (Info, Announcements, Categories, Timeline, Route) that highlights the active section via scroll-spy |
| `EventInfo.tsx` | General event information block: description, date, venue, and key details |
| `EventAnnouncements.tsx` | Chronological list of organizer announcements for the event |
| `EventCategories.tsx` | Race category cards with distance, gun time, price, slot availability, and early-bird status |
| `EventTimeline.tsx` | Chronological schedule of event day activities |
| `EventRoute.tsx` | Route overview with per-category GPX polyline selector, passing the map component as a prop for SSR-safe dynamic import |
| `EventGallery.tsx` | Photo gallery grid for event images |
| `MobileStickyCTA.tsx` | Fixed bottom bar on mobile with a prominent register button; hidden when registration is closed or event is over |

---

## 6. Dashboard (`components/dashboard/`)

Role-gated dashboard views. The top-level dashboard page selects the correct view based on the authenticated user's role.

### Runner (`components/dashboard/runner/`)

| File | Description |
|---|---|
| `NextRaceHero.tsx` | Prominent hero card for the runner's next upcoming race — shows countdown, race number, kit claim status, and quick links |
| `ProfileCompletionCard.tsx` | Dismissible prompt card showing profile completion percentage; hidden when profile is 100% complete |
| `RunnerEventCard.tsx` | Card representing a single registered event in the runner's event list |
| `EventRegistrationList.tsx` | Tabbed list of the runner's upcoming and past event registrations |
| `RunnerSidebar.tsx` | Right sidebar composing `RunnerAnnouncements` and an athlete stats summary |

### Organizer (`components/dashboard/organizer/`)

| File | Description |
|---|---|
| `OrganizerStats.tsx` | Four-tile stats strip: total events, total registrations, revenue, and kit claim count |
| `OrganizerActiveEvents.tsx` | Card list of the organizer's active/upcoming events with quick-action links |
| `OrganizerRegistrationsFeed.tsx` | Live table feed of recent registrations across all organizer events |
| `OrganizerRevenueStats.tsx` | Revenue breakdown by category or by event, toggled via a view switcher |
| `OrganizerKitFulfillment.tsx` | Race kit claim progress bar and counts |
| `OrganizerQuickActions.tsx` | Grid of quick-action tiles (Create Event, View Registrations, etc.) |
| `OrganizerDraftsNotice.tsx` | Alert banner shown when the organizer has unpublished draft events |
| `DraggableWidget.tsx` | `@dnd-kit/sortable` wrapper that makes any dashboard widget reorderable when the organizer enters edit mode |
| `InviteVolunteerDialog.tsx` | Modal dialog for inviting a volunteer to an event by email |
| `VolunteerManagement.tsx` | Table of assigned volunteers with status management |
| `DemographicsTab.tsx` | Analytics tab showing participant demographic breakdowns (age, gender, etc.) |

### Volunteer (`components/dashboard/volunteer/`)

| File | Description |
|---|---|
| `VolunteerDashboard.tsx` | Full volunteer dashboard — shows assigned events, station responsibilities, and check-in tools |

### Runner-level dashboard components (top-level `dashboard/`)

These live directly in `components/dashboard/` rather than a sub-folder.

| File | Description |
|---|---|
| `RunnerView.tsx` | Composes the runner's dashboard page from `NextRaceHero`, `ProfileCompletionCard`, and `EventRegistrationList` |
| `OrganizerView.tsx` | Composes the organizer's dashboard from all organizer sub-components; manages `@dnd-kit` drag context for widget reordering |
| `RunnerQuickActions.tsx` | Quick-action tile grid for runners (Find Races, Profile, Settings, Become Organizer) |
| `RunnerAnnouncements.tsx` | Fetches and displays announcements relevant to the runner's registered events |
| `AnnouncementsTab.tsx` | Organizer-facing tab for composing and managing event announcements, with AI-assist and email-blast options |

### Shared dashboard (`components/dashboard/shared/`)

| File | Description |
|---|---|
| `BaseQuickAction.tsx` | Reusable quick-action tile/button used by both runner and organizer quick-action grids; supports `inline` and `tile` layouts and four color variants |

### Dashboard chrome

| File | Description |
|---|---|
| `DashboardSidebar.tsx` | Persistent left sidebar built on `components/ui/sidebar`; renders role-aware nav links, role switcher, and a Clerk `UserButton` in the footer |
| `DashboardTopBar.tsx` | Slim top header bar for the dashboard layout with a mobile sidebar trigger and the Clerk `UserButton` |

---

## 7. Admin (`components/admin/`)

Components used exclusively on the `/dashboard/admin` page.

| File | Description |
|---|---|
| `AdminOverviewChart.tsx` | Recharts `AreaChart` visualizing platform-level registration volume over time |
| `AnalyticsCharts.tsx` | Suite of Recharts charts (bar, pie, line) for detailed admin analytics — registrations by category, revenue trends, user growth |

---

## 8. Shared Utilities (`components/shared/`)

Cross-cutting components used in multiple feature areas.

| File | Description |
|---|---|
| `LoginPromptModal.tsx` | Overlay modal prompting unauthenticated users to sign in via Clerk `openSignIn`; preserves pending form data across the auth redirect |
| `QRScannerWrapper.tsx` | Camera-based QR code scanner using `html5-qrcode`; manages scanner lifecycle and exposes `onScanSuccess`/`onScanFailure` callbacks |
| `RouteMapViewer.tsx` | Read-only Leaflet map rendering a GPX polyline with aid/water station markers; loaded dynamically (SSR disabled) to avoid server-side Leaflet errors |

---

## 9. Events Listing (`components/events/`)

| File | Description |
|---|---|
| `EventCard.tsx` | Card component for the `/events` browse page — shows featured image, event name, date, location, category count, registration status badge, and quick-action links (view, edit, delete) based on the viewer's role |
