# Stage 2 — Authentication & User Profiles

> **Goal:** Implement Google sign-in, role-based access, user profile with completion gauge, and the organizer application flow.

---

## 2.1 Authentication

### Google Sign-In

- `app/auth/login/page.tsx` — Login page with Google sign-in button. Clean, branded design.
- `lib/firebase/auth.ts` — `signInWithGoogle()` using Firebase `signInWithPopup` (Google provider).
- On successful sign-in:
  1. Check if user document exists in Firestore `users` collection.
  2. **First-time user** → Create user doc with default role `runner`, redirect to `/dashboard/profile?setup=true`.
  3. **Returning user** → Redirect to `/dashboard`.
- `signOut()` → Clear session, redirect to `/`.

### Auth State Management

- `lib/hooks/useAuth.ts` — Custom hook wrapping `onAuthStateChanged`. Provides `user`, `loading`, `role`.
- `components/providers/AuthProvider.tsx` — Context provider wrapping the app.
- Middleware (`middleware.ts`) — Protect `(app)` routes. Redirect unauthenticated users to `/auth/login`.

### Role System

| Role        | Description                                | Firestore Field  |
| ----------- | ------------------------------------------ | ---------------- |
| `runner`    | Default. Can register for events.          | `role: "runner"` |
| `organizer` | Can create & manage events.               | `role: "organizer"` |
| `admin`     | Super admin. Full platform access.         | `role: "admin"`  |

- Role is stored on the user's Firestore document.
- Role-based route protection via middleware + client-side guards.

---

## 2.2 Firestore User Schema

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: "runner" | "organizer" | "admin";

  // Profile fields
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalConditions: string;
  tShirtSize: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "";
  singletSize: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "";

  // Organizer fields (populated if role is organizer)
  organizer?: {
    name: string;
    contactEmail: string;
    phone: string;
    approved: boolean;
    appliedAt: Timestamp;
    approvedAt?: Timestamp;
  };

  // Metadata
  profileCompletion: number;  // 0–100
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 2.3 User Profile & Completion Gauge

### Profile Page (`/dashboard/profile`)

- Shows current profile info with an edit mode.
- **Completion gauge** — Circular progress indicator showing % complete.
  - Fields that count toward completion:
    - `displayName` (required, from Google) ✓
    - `email` (required, from Google) ✓
    - `phone`
    - `address` (all sub-fields)
    - `emergencyContact` (all sub-fields)
    - `tShirtSize`
    - `singletSize`
  - Calculation: `(filledFields / totalFields) * 100`
- Prompt banner when profile is incomplete: *"Complete your profile so we can auto-fill your race registrations!"*

### Profile Edit Form (`/dashboard/settings`)

- Uses `react-hook-form` + `zod` validation.
- **Autosave** — Debounced save (1.5s after last change). Visual indicator: "Saving…" → "Saved ✓".
- Sections:
  1. Personal Info (name, email, photo, phone)
  2. Address
  3. Emergency Contact
  4. Medical Conditions
  5. Apparel Sizes (T-shirt, Singlet)
- Photo upload via Cloudinary widget.

---

## 2.4 Organizer Application

### Apply to be an Organizer

- Accessible from runner dashboard: "Become an Organizer" card/button.
- Form fields:
  - Organizer name
  - Contact email (defaults to user email, editable)
  - Contact phone (defaults to user phone, editable)
- On submit:
  - Create pending organizer application in Firestore `organizerApplications` collection.
  - Update user doc with `organizer.approved = false`.
  - Show confirmation: *"Your application has been submitted. We'll review it within 48 hours."*
- **Application is approved by admin** (Stage 6) → User role changes to `organizer`.

### Organizer Application Schema

```typescript
interface OrganizerApplication {
  id: string;
  userId: string;
  organizerName: string;
  contactEmail: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string; // admin UID
  rejectionReason?: string;
}
```

---

## 2.5 Runner Dashboard Shell

### Dashboard Page (`/dashboard`)

- **Welcome header** — "Hello, {name}" with avatar.
- **Profile completion card** — If < 100%, show progress ring + "Complete Profile" CTA.
- **Registered Events** — List of upcoming registered events (populated in Stage 4).
- **Past Events** — List of completed events (populated in Stage 4).
- **Quick Actions** — "Browse Events", "Edit Profile", "Become an Organizer" (if runner).

---

## 2.6 Deliverables Checklist

- [ ] Google sign-in working (login page, popup flow)
- [ ] First-time user detection & redirect to profile setup
- [ ] Auth context provider + `useAuth` hook
- [ ] Middleware protecting `(app)` routes
- [ ] User Firestore schema + creation on first login
- [ ] Profile page with completion gauge
- [ ] Profile edit form with autosave
- [ ] Photo upload via Cloudinary
- [ ] Organizer application form + submission
- [ ] Runner dashboard shell with welcome header & quick actions
- [ ] Role-based navigation (runner vs organizer views)
