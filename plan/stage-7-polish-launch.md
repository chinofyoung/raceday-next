# Stage 7 — Polish, SEO & Launch Readiness

> **Goal:** Final polish — performance optimization, SEO, accessibility, error handling, loading states, responsive audit, and preparation for production deployment.

---

## 7.1 SEO & Metadata

### Per-Page SEO

Use Next.js `generateMetadata` for dynamic metadata:

| Page                | Title                                     | Description                                 |
| ------------------- | ----------------------------------------- | ------------------------------------------- |
| Homepage            | RaceDay — Find & Register for Running Events | Discover running events near you. Register, pay, and get your race kit in minutes. |
| Events              | Browse Running Events — RaceDay           | Search upcoming marathons, fun runs, and trail races. Filter by distance, date, and location. |
| Event Detail        | {Event Name} — RaceDay                    | {Event description excerpt}. Register now for {date} at {location}. |
| For Organizers      | Host Your Race with RaceDay               | Easy event creation, participant management, and payment processing for race organizers. |
| About               | About RaceDay                             | Learn about our mission to make race registration simple and accessible. |

### Technical SEO

- `robots.txt` — Allow all public pages, disallow `/dashboard`, `/api`.
- `sitemap.xml` — Dynamic sitemap generated from published events (`app/sitemap.ts`).
- Open Graph images — Generate dynamic OG images for event pages using `next/og` (ImageResponse API).
- Canonical URLs on all pages.
- Structured data (JSON-LD) for events — `Event` schema from schema.org.
- Proper heading hierarchy (`h1` → `h2` → `h3`) on every page.

---

## 7.2 Performance Optimization

### Image Optimization

- All images served via Cloudinary with automatic format (WebP/AVIF) and responsive sizing.
- Use `next/image` with Cloudinary loader where appropriate.
- Lazy load gallery images and below-fold content.

### Code Optimization

- Dynamic imports (`next/dynamic`) for heavy components:
  - Route map viewer (Leaflet)
  - QR scanner
  - Rich text editor
  - Charts (Recharts)
- Route-based code splitting (automatic with Next.js App Router).
- Minimize client-side JavaScript — use Server Components by default, `"use client"` only where needed.

### Data Fetching

- Use React Server Components for initial data loads.
- Implement Firestore query pagination (cursor-based) for events listing.
- Cache frequently accessed data (featured events, organizer profiles).

### Loading & Skeleton States

- `loading.tsx` files in key route segments for streaming.
- Skeleton components for:
  - Event cards grid
  - Event detail page
  - Dashboard sections
  - Data tables

---

## 7.3 Error Handling

### Error Boundaries

- `error.tsx` at root and key route segments.
- `not-found.tsx` — Custom 404 page with "Back to Home" CTA.
- `global-error.tsx` — Catch-all for unhandled errors.

### Form Errors

- Inline validation messages on all forms (via Zod + react-hook-form).
- Toast notifications for async operation failures.
- Retry mechanisms for failed payments and uploads.

### API Error Handling

- Consistent error response format from all API routes.
- Proper HTTP status codes.
- User-friendly error messages (never expose raw errors).

---

## 7.4 Accessibility (a11y)

- **Keyboard navigation** — All interactive elements focusable and operable via keyboard.
- **ARIA labels** — On icons, buttons without visible text, form fields.
- **Color contrast** — Ensure WCAG AA compliance (4.5:1 for text, 3:1 for large text).
- **Focus indicators** — Visible focus rings on all interactive elements.
- **Screen reader support** — Proper heading hierarchy, alt text on all images, `aria-live` for dynamic content.
- **Reduced motion** — Respect `prefers-reduced-motion` for animations.

---

## 7.5 Responsive Design Audit

Final pass on all pages at these breakpoints:

| Breakpoint | Width   | Device Target                 |
| ---------- | ------- | ----------------------------- |
| `xs`       | < 375px | Small phones (iPhone SE)      |
| `sm`       | 640px   | Large phones                  |
| `md`       | 768px   | Tablets (portrait)            |
| `lg`       | 1024px  | Tablets (landscape) / laptops |
| `xl`       | 1280px  | Desktops                      |

Key areas to verify:
- Navigation (hamburger ↔ full nav)
- Event cards grid (1 col → 2 → 3 → 4)
- Forms (full-width on mobile, constrained on desktop)
- Tables (horizontal scroll on mobile or card view)
- Modal/dialog sizing
- Image gallery layout
- Dashboard layout (stacked on mobile, grid on desktop)

---

## 7.6 Progressive Web App (PWA) — Optional

Consider making the app installable as a PWA for runners who want quick access:

- `manifest.json` — App name, icons, theme color, start URL.
- Service worker for basic offline support (cached shell, offline page).
- "Add to Home Screen" prompt.

---

## 7.7 Email Notifications — Future Enhancement

Not in initial launch scope but plan the architecture:

| Trigger                    | Email Content                           |
| -------------------------- | --------------------------------------- |
| Registration confirmed     | Event details, race number, QR code     |
| Payment received           | Receipt / invoice                       |
| Organizer app approved     | Welcome + next steps                    |
| Organizer app rejected     | Reason + reapply info                   |
| Event reminder (3 days)    | Event details, race kit collection info |
| Event updates/cancellation | Updated info or cancellation notice     |

Use a service like **Resend**, **SendGrid**, or **Firebase Extensions** for emails.

---

## 7.8 Deployment

### Vercel (Recommended)

- Connect GitHub repo to Vercel.
- Configure environment variables.
- Set up preview deployments for PRs.
- Custom domain setup.

### Firebase

- Firestore security rules — write comprehensive rules for all collections.
- Firestore indexes — Create composite indexes for queries (events by date + status, registrations by event + category, etc.).
- Firebase Authentication — Configure Google sign-in provider.

### Pre-Launch Checklist

- [ ] All environment variables configured in production
- [ ] Firestore security rules deployed and tested
- [ ] Firestore indexes created
- [ ] Cloudinary account configured (upload presets, folder structure)
- [ ] Payment provider account live (not sandbox)
- [ ] Payment webhooks pointed to production URL
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] `robots.txt` and `sitemap.xml` verified
- [ ] Open Graph images generating correctly
- [ ] Error monitoring set up (Sentry or Vercel analytics)
- [ ] Analytics set up (Google Analytics or Vercel Analytics)

---

## 7.9 Deliverables Checklist

- [x] SEO metadata on all pages (title, description, OG images) ✅
- [x] `robots.txt` + dynamic `sitemap.xml` ✅
- [x] Structured data (JSON-LD) for events ✅
- [ ] All heavy components lazy loaded
- [x] Skeleton/loading states on all key pages ✅
- [x] Error boundaries (`error.tsx`, `not-found.tsx`, `global-error.tsx`) ✅
- [ ] Accessibility audit passed (keyboard nav, contrast, ARIA, focus)
- [ ] Responsive design verified at all breakpoints
- [ ] Firestore security rules written and deployed
- [ ] Firestore indexes created
- [ ] Production deployment on Vercel
- [ ] Custom domain + SSL configured
- [ ] Payment webhooks configured for production
- [ ] Analytics + error monitoring set up
