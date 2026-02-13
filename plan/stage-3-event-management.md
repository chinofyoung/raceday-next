# Stage 3 — Event Management (Organizer)

> **Goal:** Build the full organizer experience — create, edit, and manage events with categories, timelines, images, GPX route maps, and vanity race numbers.

---

## 3.1 Firestore Event Schema

```typescript
interface RaceEvent {
  id: string;
  organizerId: string;
  organizerName: string;

  // Basic info
  name: string;
  description: string;     // Rich text / markdown
  date: Timestamp;
  location: {
    name: string;           // e.g. "BGC, Taguig"
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Images
  featuredImage: string;    // Cloudinary URL
  galleryImages: string[];  // Up to 5 Cloudinary URLs

  // Vanity race number config
  vanityRaceNumber: {
    enabled: boolean;
    premiumPrice: number;   // Additional cost
  };

  // Timeline
  timeline: TimelineItem[];

  // Distance categories
  categories: EventCategory[];

  // Status & metadata
  status: "draft" | "published" | "cancelled" | "completed";
  featured: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TimelineItem {
  id: string;
  activity: string;        // e.g. "Race Kit Collection"
  description?: string;
  time: string;            // e.g. "03:00 AM" or "Feb 15, 2026 3:00 AM"
  order: number;
}

interface EventCategory {
  id: string;
  name: string;            // e.g. "42K Full Marathon"
  distance: string;        // e.g. "42K"
  assemblyTime: string;
  gunStartTime: string;
  cutOffTime: string;
  price: number;
  categoryImage?: string;  // Cloudinary URL
  routeMap?: {
    gpxFileUrl: string;    // Uploaded .gpx file
  };
  inclusions: string[];    // e.g. ["Race bib", "Finisher medal", "T-shirt"]
  raceNumberFormat: string; // e.g. "42K-{number}" or "42{number}"
  maxParticipants?: number;
  registeredCount: number;
}
```

---

## 3.2 Create Event Flow

### Page: `/dashboard/events/create`

Multi-step form with progress indicator. Each step autosaves to a Firestore `draft`.

#### Step 1 — Basic Details
- Event name
- Event date (date picker)
- Location (name + address, optional coordinates via map picker)
- Description (rich text editor or markdown)

#### Step 2 — Images
- Featured image upload (required) — Cloudinary widget
- Gallery images (up to 5) — Drag-and-drop reorder
- Image preview with remove option

#### Step 3 — Distance Categories
- Add one or more categories:
  - Category name (e.g. "42K Full Marathon")
  - Distance
  - Assembly time, gun start time, cut off time (time pickers)
  - Price (number input)
  - Category image (optional upload)
  - Route map — Upload `.gpx` file
    - Preview route on an interactive map (use Leaflet or Mapbox with GPX overlay)
  - Inclusions — Tag-style input (add/remove items)
  - Race number format — Template string (e.g. `42K-{number}`)
  - Max participants (optional)
- Reorderable list of categories

#### Step 4 — Event Timeline
- Add timeline entries:
  - Activity name
  - Description (optional)
  - Time
- Sortable list with drag-and-drop reorder

#### Step 5 — Vanity Race Number
- Toggle: Enable/disable vanity race numbers
- If enabled: Set premium price

#### Step 6 — Review & Publish
- Full preview of the event (as runners will see it)
- "Save as Draft" / "Publish Event" buttons

---

## 3.3 Edit Event

### Page: `/dashboard/events/[id]/edit`

- Same multi-step form as create, pre-populated with existing data.
- Can save changes without publishing.
- If event has registrations, show warning before editing critical fields (date, categories, prices).

---

## 3.4 Organizer Dashboard

### Page: `/dashboard` (organizer view)

- **Overview cards:**
  - Total events (active / past)
  - Total participants across all events
  - Total revenue
- **Active Events list** — Cards showing event name, date, participant count, status badge.
- **Quick actions** — "Create New Event"

### Page: `/dashboard/events`

- Table/list of all organizer's events
- Columns: Name, Date, Status, Participants, Revenue, Actions
- Actions: View, Edit, Delete (with confirmation modal)
- Filter by status: All, Draft, Published, Completed, Cancelled
- Sort by date

### Page: `/dashboard/events/[id]`

- Event detail view for organizer:
  - Event info summary
  - **Participants tab** — List of all registered runners (name, category, race number, payment status, QR code)
  - **Revenue tab** — Breakdown by category, vanity number revenue
  - **Tools tab** — QR code scanner (Stage 5)

---

## 3.5 GPX Route Map Viewer

- Component: `components/shared/RouteMapViewer.tsx`
- Uses Leaflet.js (`react-leaflet`) with OpenStreetMap tiles
- Parses uploaded `.gpx` file and renders the polyline on the map
- Shows distance markers, elevation if available
- Interactive: zoom, pan, fullscreen toggle
- Used in both event creation form and public event detail page

### Dependencies to install

```
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

---

## 3.6 Deliverables Checklist

- [ ] Event Firestore schema defined + Zod validators
- [ ] Multi-step create event form with autosave
- [ ] Image upload (featured + gallery) via Cloudinary
- [ ] Distance category management (CRUD within form)
- [ ] Timeline management (CRUD within form)
- [ ] GPX file upload + interactive route map viewer
- [ ] Vanity race number configuration
- [ ] Edit event page (pre-populated form)
- [ ] Organizer dashboard with stats overview
- [ ] Events list with filter/sort
- [ ] Event detail page for organizer (participants, revenue)
- [ ] Delete event with confirmation
- [ ] Draft / Publish workflow
