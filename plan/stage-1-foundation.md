# Stage 1 — Foundation & Core Setup

> **Goal:** Establish the project foundation — folder structure, design system, shared layouts, Firebase/Cloudinary config, and all static/marketing pages.

---

## 1.1 Project Scaffolding & Dependencies

### Install Dependencies

```
npm install firebase cloudinary next-cloudinary react-hook-form zod @hookform/resolvers
npm install lucide-react clsx
npm install -D @types/node
```

| Package              | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `firebase`           | Auth, Firestore, Storage                        |
| `cloudinary` / `next-cloudinary` | Image uploads & optimized delivery     |
| `react-hook-form`    | Performant forms with autosave                  |
| `zod`                | Schema validation (shared between client & server) |
| `@hookform/resolvers`| Zod ↔ react-hook-form bridge                    |
| `lucide-react`       | Icon library (tree-shakeable, modern)            |
| `clsx`               | Conditional class merging                        |

### Folder Structure

```
├── app/
│   ├── (marketing)/          # Public pages — Homepage, For Organizers, About
│   │   ├── layout.tsx        # Marketing layout (navbar + footer)
│   │   ├── page.tsx          # Homepage
│   │   ├── for-organizers/
│   │   │   └── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── (app)/                # Authenticated pages — Dashboard, Events
│   │   ├── layout.tsx        # App layout (sidebar / app nav)
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── settings/
│   │   └── admin/
│   ├── auth/                 # Login / callback pages
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout (fonts, providers)
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── ui/                   # Reusable primitives (Button, Input, Card, Badge …)
│   ├── layout/               # Navbar, Footer, Sidebar, PageWrapper
│   ├── forms/                # Form field components with autosave
│   └── shared/               # Domain-specific shared components
├── lib/
│   ├── firebase/
│   │   ├── config.ts         # Firebase app init (client)
│   │   ├── admin.ts          # Firebase Admin SDK (server)
│   │   ├── auth.ts           # Auth helpers
│   │   └── firestore.ts      # Firestore helpers
│   ├── cloudinary/
│   │   └── config.ts         # Cloudinary setup
│   ├── validators/           # Zod schemas (shared)
│   ├── hooks/                # Custom React hooks
│   ├── utils.ts              # General utilities
│   └── constants.ts          # App-wide constants
├── types/                    # Global TypeScript types/interfaces
│   ├── user.ts
│   ├── event.ts
│   └── index.ts
├── public/
│   ├── images/
│   └── icons/
└── plan/
```

---

## 1.2 Design System & UI Primitives

### Tailwind v4 Theme

Configure Tailwind v4 CSS theme in `globals.css`:

- **Colors** — Brand primary (energetic orange/coral), secondary (deep navy), accent, neutral grays, success/error/warning semantic colors.
- **Typography** — Use Google Fonts `Inter` (body) + `Outfit` (headings). Define font-size scale.
- **Spacing** — Consistent spacing scale.
- **Border-radius** — Rounded, pill, card corners.
- **Shadows** — Subtle elevation system.
- **Transitions** — Default ease durations for micro-animations.

### UI Components to build

| Component       | Notes                                                        |
| --------------- | ------------------------------------------------------------ |
| `Button`        | Variants: primary, secondary, outline, ghost, danger. Sizes: sm, md, lg. Loading state. |
| `Input`         | Text, email, phone, textarea. Error states, helper text.     |
| `Select`        | Styled select with options.                                  |
| `Card`          | Elevated card with optional image, header, footer sections.  |
| `Badge`         | Status pills — upcoming, live, completed, pending, etc.      |
| `Avatar`        | User photo with fallback initials.                           |
| `Modal`         | Dialog overlay with focus trap.                              |
| `Toast`         | Notification toasts (success, error, info).                  |
| `Skeleton`      | Loading placeholder shimmer.                                 |
| `PageWrapper`   | Consistent page padding/margins.                             |
| `SectionHeader` | Section title + optional subtitle/action button.             |

---

## 1.3 Shared Layouts

### Marketing Layout (`(marketing)/layout.tsx`)

- **Navbar** — Logo, nav links (Events, For Organizers, About), CTA "Sign In" / user avatar.
- **Footer** — Logo, links (Privacy, Terms), social media icons, copyright.
- Sticky navbar with backdrop blur on scroll.
- Mobile hamburger menu with slide-in drawer.

### App Layout (`(app)/layout.tsx`)

- **Mobile** — Bottom tab navigation (Dashboard, Events, Settings).
- **Desktop** — Sidebar navigation with collapsible sections.
- Auth-protected via middleware.

---

## 1.4 Firebase & Cloudinary Configuration

### Firebase

- `lib/firebase/config.ts` — Initialize Firebase app with env vars.
- `lib/firebase/admin.ts` — Firebase Admin SDK for server-side (API routes, middleware).
- `lib/firebase/auth.ts` — `signInWithGoogle()`, `signOut()`, `onAuthStateChanged` listener.
- `lib/firebase/firestore.ts` — Generic typed helpers: `getDoc`, `setDoc`, `updateDoc`, `queryCollection`.

### Cloudinary

- `lib/cloudinary/config.ts` — Cloudinary cloud name + unsigned upload preset.
- Use `next-cloudinary` `CldUploadWidget` for image uploads.
- Use `CldImage` for optimized image delivery.

### Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_SERVICE_ACCOUNT=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## 1.5 Static / Marketing Pages

### Homepage (`/`)

- **Hero section** — Bold headline, subtext, CTA buttons ("Browse Events" / "Host an Event"). Animated background or hero image.
- **Upcoming Events** — Horizontal scrollable cards showing soonest events.
- **Featured Events** — Highlight grid with large event cards.
- **Events Near You** — Location-based suggestions (uses browser geolocation API).
- **How It Works** — 3-step visual: Find → Register → Run.
- **For Organizers CTA** — Banner to attract organizers.
- **Social proof** — Stats (events hosted, runners registered, etc.) with count-up animations.

### For Organizers (`/for-organizers`)

- **Hero** — "Host your next race with RaceDay" with CTA.
- **Benefits grid** — Easy event creation, participant management, payment processing, race kit tools.
- **Feature showcase** — Screenshots/mockups of organizer dashboard.
- **Pricing** — If applicable, or "Free to get started".
- **CTA** — "Apply to be an organizer" button (links to application form after login).

### About (`/about`)

- **Mission statement** — What RaceDay is about.
- **Team section** — Team member cards with photos, names, roles.
- **Contact form** — Name, email, message (or link to email).

---

## 1.6 Deliverables Checklist

- [ ] All dependencies installed
- [ ] Folder structure created
- [ ] Tailwind v4 theme configured with brand colors & typography
- [ ] All UI primitives built (Button, Input, Card, Badge, Avatar, Modal, Toast, Skeleton)
- [ ] Marketing layout with responsive Navbar & Footer
- [ ] App layout shell with mobile bottom nav & desktop sidebar
- [ ] Firebase client + admin SDK initialized
- [ ] Cloudinary config set up
- [ ] `.env.local.example` with all required env vars
- [ ] Homepage built with all sections
- [ ] For Organizers page built
- [ ] About page built
- [ ] Mobile-first responsive design verified
