# Stage 4 — Event Registration & Discovery

> **Goal:** Build the public-facing event discovery features and a multi-step registration flow for runners, including category selection, participant details, and vanity number validation.

---

## 4.1 Event Search & Filtering

### Page: `/events` (Directory)

- **Search Bar:** Real-time search for event names.
- **Filters:**
  - **Status:** Upcoming, Current, Past.
  - **Category:** Filter by distance (e.g., 5K, 10K, 21K, 42K).
  - **Location:** Filter by city/province.
- **Sorting:** Sort by "Soonest", "Newest", or "Alphabetical".
- **Empty State:** High-quality empty state when no events match filters.

---

## 4.2 Event Detail Page (`/events/[id]`)

- **Hero Section:** Large featured image with event name, date, and "Register Now" CTA.
- **Details Grid:**
  - Location (with integrated map view).
  - Description (long-form markdown).
  - Timeline (visual schedule).
- **Category Cards:**
  - Shows price, inclusions, and remaining slots estimate.
  - Interactive selection logic.
- **GPX Route Preview:** Interactive map showing the race course (from Stage 3).

---

## 4.3 Runner Registration Flow (`/events/[id]/register`)

> **Note:** This is a multi-step form separate from the organizer creation form. It uses `react-hook-form` and auto-fills data from the runner's profile.

### Registration Steps:

1. **Category Selection:** 
   - Runner picks which distance they are joining.
   - Shows base price.

2. **Runner Info:** 
   - Auto-filled fields: Name, Email, Phone, T-shirt size, Singlet size, Emergency Contact.
   - Allows "One-time override" for this specific registration.

3. **Vanity Race Number (Optional):**
   - Only shown if enabled by organizer.
   - Search field to check availability of a specific number.
   - Live validation against existing registrations for that event/category.
   - Shows premium fee preview.

4. **Waiver & Review:**
   - Display event waiver/terms.
   - Digital signature checkbox.
   - Final breakdown of fees (Base + Vanity Premium).

---

## 4.4 Data Schema & Logic

### `registrations` Collection

```typescript
interface Registration {
  id: string;
  eventId: string;
  userId: string;
  categoryId: string;
  participantInfo: {
    name: string;
    email: string;
    phone: string;
    tShirtSize: string;
    singletSize: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalConditions?: string;
  };
  vanityNumber?: string; // e.g., "777"
  raceNumber: string;    // The actual bib number (e.g., "42K-777")
  basePrice: number;
  vanityPremium: number;
  totalPrice: number;
  status: "pending" | "paid" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "failed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Logic Hooks:
- `useRegistrationForm`: Custom hook to manage the multi-step state and validataions.
- `useVanityAvailability`: Hook to check Firestore if a bib number is already taken in a specific category.

---

## 4.5 Deliverables Checklist

- [x] Updated Homepage with Featured/Upcoming events sections.
- [x] Events directory with Search/Filter/Sort functionality.
- [x] Public Event Detail page with interactive maps and category list.
- [x] Multi-step Registration Form wrapper.
- [x] Step 1: Category selection logic.
- [x] Step 2: Runner info auto-fill from Firestore profile.
- [x] Step 3: Vanity number availability checker and selection.
- [x] Step 4: Waiver agreement and fee review.
- [x] Zod validation for registration data.
- [x] Mocked "Redirect to Payment" (prepared for Stage 5).
