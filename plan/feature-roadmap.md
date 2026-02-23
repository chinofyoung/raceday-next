# RaceDay Feature Roadmap & Improvement Plan

_Generated: Feb 23, 2026 — based on a full codebase audit_

---

## Phase 1 — Quick Wins (1–3 days each)

### 1.1 Email Notifications
Currently, registration confirmation and bib assignment happen silently. Add transactional emails for:
- **Registration confirmation** (with QR code attached)
- **Payment receipt**
- **Event reminders** (e.g., 7 days, 1 day before race day)
- **Race kit collection reminder**

**Suggested tech:** Resend or SendGrid with React Email templates.

---

### 1.2 Registration Capacity Enforcement
`EventCategory.maxParticipants` exists in the type but is **never enforced**. Add:
- Slot count check at registration time (`create-checkout`)
- "X slots remaining" badge on event detail page
- Auto-close registration when sold out
- Waitlist option (optional)

---

### 1.3 Results & Timing
After a race, organizers need to post results. Add:
- A "Results" tab on the event detail page
- CSV/Excel upload for bulk results (name, bib, finish time, rank)
- Public results page searchable by name or bib number
- Auto-compute pace (min/km) from distance + finish time

---

### 1.4 Participant Certificate Generator
Auto-generate finisher certificates (PDF or image) with:
- Runner name, event name, category, finish time
- Event branding / featured image
- Downloadable from the runner's dashboard

---

### 1.5 Social Sharing
- "Share my registration" card (OG image with bib number, event name, category)
- "Share my result" after a race
- Pre-filled social copy for Facebook/X/Instagram Stories

---

## Phase 2 — Core Experience (3–7 days each)

### 2.1 Runner Dashboard Enhancements
The runner dashboard currently shows registrations and upcoming events. Add:
- **Race history** with past results, finish times, and certificates
- **Personal records (PRs)** auto-tracked per distance
- **Running stats** (total races, total km, average pace)
- **Training log** (optional — simple weekly km tracker)

---

### 2.2 Organizer Revenue Dashboard
The organizer event detail page shows registrations but lacks financial visibility. Add:
- **Revenue breakdown** (base fees vs. vanity premiums)
- **Per-category revenue**
- **Daily registration chart** (line/bar chart over time)
- **Export registrations to CSV/Excel** (essential for race-day operations)
- **Payout tracking** (when Xendit disburses funds)

---

### 2.3 Race Kit Claim Management
The `raceKitClaimed` field exists but has no workflow. Build:
- **Race kit claim scanner** (separate from race-day QR scanner)
- **Bulk claim by CSV upload** (for large events)
- **Kit claim status** visible to runners in their dashboard
- **Real-time count** of kits claimed vs. total

---

### 2.4 Discount / Promo Codes
Beyond early bird pricing, organizers often need promo codes. Add:
- Create promo codes per event (flat ₱ or % discount)
- Set usage limits and expiry dates
- Apply at checkout (new step or input on review step)
- Track usage per code in organizer dashboard

---

### 2.5 Team / Group Registration
Allow a single person to register a team:
- Register multiple participants in one checkout
- Group discount (e.g., 10% off for 5+ runners)
- Team name displayed on results
- Captain manages the roster

---

## Phase 3 — Growth & Engagement (1–2 weeks each)

### 3.1 Event Discovery & Search
The events page currently lists all events. Improve with:
- **Search** by event name, location, or organizer
- **Filters** by distance, date range, price range, location
- **Sort** by date, distance, price, popularity
- **Map view** (using Google Maps / Mapbox) showing events geographically
- **"Near me"** location-based filtering

---

### 3.2 Runner Profiles (Public)
Create public runner profiles with:
- Race history and results (opt-in)
- Personal records
- Badges / achievements (e.g., "Marathon Finisher", "10 Races Completed")
- Follow other runners

---

### 3.3 Event Reviews & Ratings
After a race, runners can:
- Rate the event (1–5 stars)
- Leave a text review
- View aggregate rating on event card / detail page
- Organizer response capability

---

### 3.4 Route Map Visualization
`EventCategory.routeMap.gpxFileUrl` exists but isn't rendered. Add:
- **GPX file viewer** on event detail page (using Leaflet or Mapbox)
- Elevation profile chart
- Distance markers on map
- Category-specific route overlays

---

### 3.5 Mobile PWA Enhancements
The app already has `sw.js` attempts. Enhance with:
- Proper **service worker** for offline access
- **Push notifications** (race reminders, results posted)
- **Add to home screen** prompt
- **Offline QR code** access for runners

---

## Phase 4 — Platform Scale

### 4.1 Multi-Currency Support
Currently hard-coded to PHP. Add:
- Currency per event (USD, SGD, etc.)
- Auto-conversion display for international runners

### 4.2 Organizer Analytics (Advanced)
- Demographics breakdown (age, gender, location)
- Returning runner rate
- Category popularity trends
- Revenue forecasting

### 4.3 API for Third-Party Integrations
- Public REST API for event data
- Timing chip integration endpoints
- Strava/Garmin activity sync post-race

### 4.4 Multi-Language (i18n)
- Filipino / English toggle
- Auto-detect from browser locale

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Registration capacity enforcement | 🔴 High | 🟢 Low | **P0** |
| Email notifications | 🔴 High | 🟡 Med | **P0** |
| CSV export registrations | 🔴 High | 🟢 Low | **P0** |
| Results & timing | 🔴 High | 🟡 Med | **P1** |
| Discount / promo codes | 🔴 High | 🟡 Med | **P1** |
| Race kit claim workflow | 🟡 Med | 🟢 Low | **P1** |
| Finisher certificates | 🟡 Med | 🟡 Med | **P2** |
| Social sharing cards | 🟡 Med | 🟢 Low | **P2** |
| Event search & filters | 🟡 Med | 🟡 Med | **P2** |
| GPX route map viewer | 🟡 Med | 🟡 Med | **P2** |
| Team / group registration | 🟡 Med | 🔴 High | **P3** |
| Revenue dashboard | 🟡 Med | 🟡 Med | **P2** |
| Runner profiles | 🟢 Low | 🟡 Med | **P3** |
| Event reviews | 🟢 Low | 🟡 Med | **P3** |
| PWA enhancements | 🟢 Low | 🔴 High | **P3** |
| Multi-currency | 🟢 Low | 🔴 High | **P4** |
| Public API | 🟢 Low | 🔴 High | **P4** |

---

## Recommended Starting Point

> **Start with P0 items**: Registration capacity enforcement (minimal code, already typed), email notifications (huge UX lift), and CSV export (organizers need this on race day). These three alone dramatically improve the platform for both runners and organizers.
