# Organizer Tools — Recommendations

_Beyond what's already in the roadmap. Organized by impact and build effort._

---

## 🏆 Tier 1 — High Impact, Buildable Now

### 1. CSV Export (Registrations & Results)
Organizers **need this on race day**. Export filtered registrations as CSV/Excel with columns: name, bib, category, email, phone, shirt size, payment status, kit claimed.

- Add "Export" button to event detail page (organizer view)
- Server-side CSV generation via API route
- Filter by category, payment status, kit claim status

> **Effort:** ~1 day · **Impact:** 🔴 Critical for race-day ops

---

### 2. Bib Number Manager
Auto-assign or manually set bib numbers per category with configurable ranges (e.g., 3K: 1001–1999, 5K: 2001–2999).

- Bulk auto-assign with range rules
- Manual override for VIPs / sponsors
- Visible on QR pass and exportable in CSV
- Print-ready bib list view

> **Effort:** ~2 days · **Impact:** 🔴 Essential for organized events

---

### 3. Event Cloning
One-click duplicate of an existing event (copy categories, pricing, timeline, route maps) — change the date and publish. Race series organizers run the same event monthly.

- "Duplicate Event" button on event detail page
- Clone all fields except date, status (set to draft), and registrations
- Deep clone categories array

> **Effort:** ~0.5 day · **Impact:** 🟡 Huge time saver for repeat organizers

---

### 4. Announcement / Broadcast System
Send announcements to all registered participants for a specific event.

- In-app notification banner on runner dashboard
- Optional email blast via Resend/SendGrid
- Organizer writes message from event management page
- Useful for: route changes, parking info, weather advisories

> **Effort:** ~2 days · **Impact:** 🟡 Critical for race-day communication

---

## 🥈 Tier 2 — Strong Value Add

### 5. Participant Check-in Kiosk Mode
A full-screen, tablet-optimized mode for race-day check-in desks. Think: large text, big buttons, search by name/bib.

- Full-screen kiosk view (hides nav, maximizes scan area)
- Manual search fallback (name, bib, email)
- Confirmation sound/vibration on successful scan
- Queue counter: "Checked in X of Y"

> **Effort:** ~2 days · **Impact:** 🟡 Better race-day UX

---

### 6. Volunteer Management
Assign volunteers to roles (registration desk, water station, finish line) and share a link they can use without a full account.

- Volunteer roster per event
- Role assignment with descriptions
- Shareable link with limited access (view-only event info + check-in tools)
- No login required (magic link or PIN)

> **Effort:** ~3–4 days · **Impact:** 🟡 Valuable for larger events

---

### 7. Custom Registration Fields
Let organizers add custom questions to the registration form (e.g., "Are you joining the fun run or competitive?", "Meal preference").

- Field builder in event creation (text, dropdown, checkbox)
- Responses stored per registration
- Included in CSV export

> **Effort:** ~3 days · **Impact:** 🟡 Flexibility for diverse event types

---

### 8. Sponsor / Partner Showcase
Allow organizers to add sponsors with logos and links, displayed on the event detail page and finisher certificates.

- Sponsor management in event settings (name, logo, tier: gold/silver/bronze, url)
- Displayed on event page in a sponsor banner strip
- Optionally embedded on certificates

> **Effort:** ~1.5 days · **Impact:** 🟡 Helps organizers attract/retain sponsors

---

## 🥉 Tier 3 — Nice to Have / Growth

### 9. Race-Day Live Dashboard
Real-time dashboard projected on a screen at the event venue showing live stats: registrations today, kits claimed, check-in rate.

- Auto-refresh every 10s
- Large-format display optimized (no scroll, big numbers)
- Shareable public URL (read-only, no auth)

> **Effort:** ~2 days · **Impact:** 🟢 Cool factor, professional feel

---

### 10. Organizer Public Page
A branded page at `/organizer/[slug]` showing the organizer's profile, upcoming events, past events, and reviews.

- Auto-generated from organizer profile fields
- Lists all published events
- Social links and contact info
- Embeddable widget for the organizer's own website

> **Effort:** ~2 days · **Impact:** 🟢 Brand building, discoverability

---

### 11. Automated Waitlist
When a category fills up, runners can join a waitlist. If someone cancels, the next person is auto-notified.

- Waitlist queue per category
- Auto-email notification when a slot opens
- 24h claim window before moving to next

> **Effort:** ~2 days · **Impact:** 🟢 Better conversion on popular events

---

### 12. Post-Race Survey Builder
Auto-send a survey to participants after the event for feedback (rating, NPS, open-ended comments).

- Template survey per event
- Auto-triggered X days after event date
- Results aggregated in organizer dashboard

> **Effort:** ~3 days · **Impact:** 🟢 Data-driven event improvement

---

## Suggested Build Order

| Priority | Tool | Why First |
|----------|------|-----------|
| **1** | CSV Export | P0 — organizers can't function without this on race day |
| **2** | Bib Number Manager | Core event operations, needed before any event runs |
| **3** | Event Cloning | Tiny effort, massive time savings |
| **4** | Announcements | Communication gap is a liability |
| **5** | Kiosk Mode | Builds on existing scanner, big UX win |
| **6** | Custom Registration Fields | Unlocks diverse event types |
| **7** | Sponsor Showcase | Revenue enabler for organizers |
| **8+** | Rest | Build based on user demand |

---

> **My recommendation:** Start with **CSV Export → Bib Manager → Event Clone**. These three together give organizers a credible, complete toolkit for running a real race. Everything else is enhancement.
