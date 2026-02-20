# RaceDay — Organizer Application Form Improvement Plan

**Date:** 2026-02-20
**Goal:** Improve the organizer application form with better organization verification, Philippines-specific fields, and a multi-step UX — while also upgrading the admin review experience.

---

## Problem Statement

The current "Become an Organizer" form collects only **3 fields**:
1. Organization / Name
2. Business Email
3. Contact Phone

This is insufficient for proper verification. There is no way for admins to assess the legitimacy of an applicant before approving them. Since this is a Philippines-based platform handling real race registrations and payments, we need stronger identity and organization verification to:
- Prevent fraudulent organizers from creating fake events and collecting payments
- Ensure the organization is a legitimate entity (LGU, sports club, registered business, etc.)
- Collect tax-related info (BIR TIN) for compliance
- Provide admins with enough context to make informed approval decisions

---

## Current Architecture

### Files Involved
| File | Purpose |
|------|---------|
| `app/(app)/dashboard/become-organizer/page.tsx` | The application form UI (182 lines) |
| `types/user.ts` | `OrganizerApplication` and `User.organizer` types |
| `lib/services/applicationService.ts` | Fetching & reviewing applications |
| `app/(app)/dashboard/admin/applications/page.tsx` | Admin review page (291 lines) |
| `components/ui/Input.tsx` | Shared Input component |

### Current Schema
```typescript
// Zod validation (in page.tsx)
const schema = z.object({
    organizerName: z.string().min(3),
    contactEmail: z.string().email(),
    phone: z.string().min(10),
});

// Firestore type (in types/user.ts)
interface OrganizerApplication {
    id: string;
    userId: string;
    organizerName: string;
    contactEmail: string;
    phone: string;
    status: "pending" | "approved" | "rejected";
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
    rejectionReason?: string;
}
```

---

## Proposed Changes

### Stage 1: Expand Type Definitions & Validation Schema
**File:** `types/user.ts`, new file `lib/validations/organizer.ts`

#### New `OrganizerApplication` Type
```typescript
export type OrganizerType =
    | "individual"        // Solo race director
    | "sports_club"       // Running club, triathlon club, etc.
    | "business"          // Registered business (e.g. events company)
    | "lgu"               // Local Government Unit (city/municipality)
    | "school"            // School or university
    | "nonprofit";        // NGO, foundation, charity

export interface OrganizerApplication {
    id: string;
    userId: string;

    // === Step 1: Basic Info ===
    organizerName: string;          // Organization or individual name
    organizerType: OrganizerType;   // Type of organization
    description: string;            // Brief description of the org (what they do)

    // === Step 2: Contact Details ===
    contactPerson: string;          // Full name of the contact person
    contactEmail: string;           // Business email
    phone: string;                  // PH mobile (e.g. 09XX XXX XXXX)
    alternatePhone?: string;        // Optional landline or alternate mobile
    website?: string;               // Optional website or social media link

    // === Step 3: Address & Location ===
    address: {
        street: string;
        barangay: string;           // PH-specific: barangay
        city: string;               // City / Municipality
        province: string;           // Province
        region: string;             // Region (e.g. NCR, Region IV-A)
        zipCode: string;
    };

    // === Step 4: Verification Documents ===
    organizerTIN?: string;          // BIR Tax Identification Number
    dtiSecRegistration?: string;    // DTI (sole prop) or SEC (corp) reg number
    governmentId: {
        type: string;               // e.g. "Philippine National ID", "Driver's License", "Passport"
        idNumber: string;
        // File uploads stored as Cloudinary URLs
        frontImageUrl: string;
        backImageUrl?: string;
    };
    businessPermitUrl?: string;     // Scanned business/mayor's permit (optional but encouraged)
    pastEventsDescription?: string; // Free text describing past events organized
    estimatedEventsPerYear?: number;

    // === Meta ===
    status: "pending" | "approved" | "rejected" | "needs_info";
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
    rejectionReason?: string;
    adminNotes?: string;            // Internal admin notes
}
```

#### New Validation Schema (`lib/validations/organizer.ts`)
```typescript
import * as z from "zod";

const phPhoneRegex = /^(09|\+639)\d{9}$/;

export const organizerStep1Schema = z.object({
    organizerName: z.string().min(3, "Organization name must be at least 3 characters"),
    organizerType: z.enum(["individual", "sports_club", "business", "lgu", "school", "nonprofit"], {
        required_error: "Please select your organization type"
    }),
    description: z.string().min(20, "Please provide at least a brief description (20 characters)")
        .max(500, "Description is too long (max 500 characters)"),
});

export const organizerStep2Schema = z.object({
    contactPerson: z.string().min(3, "Contact person name is required"),
    contactEmail: z.string().email("Please enter a valid email address"),
    phone: z.string().regex(phPhoneRegex, "Please enter a valid PH mobile number (e.g. 09171234567)"),
    alternatePhone: z.string().optional(),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export const organizerStep3Schema = z.object({
    address: z.object({
        street: z.string().min(3, "Street address is required"),
        barangay: z.string().min(2, "Barangay is required"),
        city: z.string().min(2, "City / Municipality is required"),
        province: z.string().min(2, "Province is required"),
        region: z.string().min(2, "Region is required"),
        zipCode: z.string().length(4, "Philippine ZIP codes are 4 digits"),
    }),
});

export const organizerStep4Schema = z.object({
    organizerTIN: z.string()
        .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, "TIN format: XXX-XXX-XXX-XXX")
        .optional()
        .or(z.literal("")),
    dtiSecRegistration: z.string().optional().or(z.literal("")),
    governmentId: z.object({
        type: z.string().min(1, "Please select an ID type"),
        idNumber: z.string().min(3, "ID number is required"),
        frontImageUrl: z.string().url("Please upload the front of your ID"),
        backImageUrl: z.string().url().optional().or(z.literal("")),
    }),
    businessPermitUrl: z.string().url().optional().or(z.literal("")),
    pastEventsDescription: z.string().max(1000).optional().or(z.literal("")),
    estimatedEventsPerYear: z.coerce.number().min(1).max(100).optional(),
});

export const fullOrganizerSchema = organizerStep1Schema
    .merge(organizerStep2Schema)
    .merge(organizerStep3Schema)
    .merge(organizerStep4Schema);

export type OrganizerFormValues = z.infer<typeof fullOrganizerSchema>;
```

#### Updated `User.organizer` (in `types/user.ts`)
```typescript
organizer?: {
    name: string;
    contactEmail: string;
    phone: string;
    organizerType: OrganizerType;
    approved: boolean;
    appliedAt: Timestamp;
    approvedAt?: Timestamp;
};
```

#### Tasks
- [ ] Create `lib/validations/organizer.ts` with step-by-step and full schema
- [ ] Update `OrganizerApplication` interface in `types/user.ts`
- [ ] Update `User.organizer` sub-type in `types/user.ts`
- [ ] Add `OrganizerType` type export to `types/user.ts`

---

### Stage 2: Multi-Step Form UI
**File:** `app/(app)/dashboard/become-organizer/page.tsx` (refactor into component files)

Convert the single-page form into a **4-step wizard** with progress indicator:

#### Step 1 — Organization Info
| Field | Type | Required |
|-------|------|----------|
| Organization / Name | Text Input | ✅ |
| Organization Type | Select Dropdown | ✅ |
| Description | Textarea | ✅ |

- **Organization Type** options rendered as selectable cards (like the existing registration form pattern):
  - 🏃 Individual Race Director
  - 🏅 Sports Club
  - 🏢 Registered Business
  - 🏛️ Local Government Unit (LGU)
  - 🎓 School / University
  - 🤝 Non-Profit / NGO

#### Step 2 — Contact Details
| Field | Type | Required |
|-------|------|----------|
| Contact Person (Full Name) | Text Input | ✅ |
| Business Email | Email Input | ✅ |
| Mobile Number | Phone Input (PH format) | ✅ |
| Alternate Phone | Phone Input | ❌ |
| Website / Social Media Link | URL Input | ❌ |

- Pre-fill email and phone from the user's profile if available.
- Show PH phone format hint: `09XX XXX XXXX`

#### Step 3 — Address & Location
| Field | Type | Required |
|-------|------|----------|
| Street Address | Text Input | ✅ |
| Barangay | Text Input | ✅ |
| City / Municipality | Text Input | ✅ |
| Province | Select / Combobox | ✅ |
| Region | Select / Combobox | ✅ |
| ZIP Code | Text Input (4 digits) | ✅ |

- Use cascading Region → Province selects for better UX (Philippines has 17 regions, 82 provinces)
- Create a `lib/constants/ph-regions.ts` data file mapping regions to provinces for the dropdowns

#### Step 4 — Verification & Documents
| Field | Type | Required |
|-------|------|----------|
| BIR TIN | Text Input (masked: XXX-XXX-XXX-XXX) | Optional (encouraged for businesses) |
| DTI/SEC Registration No. | Text Input | Optional |
| Government ID Type | Select Dropdown | ✅ |
| Government ID Number | Text Input | ✅ |
| ID Front Photo | Image Upload (Cloudinary) | ✅ |
| ID Back Photo | Image Upload (Cloudinary) | Optional |
| Business/Mayor's Permit | File Upload (Cloudinary) | Optional |
| Past Events Organized | Textarea | Optional |
| Estimated Events Per Year | Number Input | Optional |

- **Government ID options** (Philippines-specific):
  - Philippine National ID (PhilSys)
  - Driver's License (LTO)
  - Passport (DFA)
  - SSS ID
  - GSIS ID
  - PRC ID
  - Postal ID
  - Voter's ID
  - Senior Citizen ID
  - PWD ID

- Use the existing Cloudinary upload infrastructure for document photos
- Add a note: _"Your documents are encrypted and only visible to our admin team for verification purposes."_

#### UI/UX Requirements
- **Progress Stepper:** Horizontal step indicator at top showing Steps 1–4 with labels
- **Step Navigation:** "Previous" and "Next" buttons, with validation on each step before advancing
- **Summary Step (optional):** After Step 4, show a read-only summary of all info before final submission
- **Mobile-first:** The form should be responsive and easy to fill on mobile
- **Visual style:** Match the existing design system (dark theme, italic uppercase headings, etc.)
- **Placeholder examples:** Contextual for PH (e.g., "e.g. Brgy. San Antonio", "e.g. Makati City")

#### File Structure
```
app/(app)/dashboard/become-organizer/
├── page.tsx                          # Main page shell, step router
├── components/
│   ├── OrganizerFormStepper.tsx      # Step progress indicator
│   ├── Step1OrgInfo.tsx              # Organization info step
│   ├── Step2Contact.tsx              # Contact details step
│   ├── Step3Address.tsx              # Address & location step
│   ├── Step4Verification.tsx         # Verification & documents step
│   └── OrganizerFormSummary.tsx      # Review summary before submit
```

#### Tasks
- [ ] Create `OrganizerFormStepper.tsx` progress indicator component
- [ ] Create `Step1OrgInfo.tsx` — Organization type selector cards + name + description
- [ ] Create `Step2Contact.tsx` — Contact person, email, phones, website
- [ ] Create `Step3Address.tsx` — Full PH address with region/province cascading
- [ ] Create `Step4Verification.tsx` — ID, TIN, permits, file uploads
- [ ] Create `OrganizerFormSummary.tsx` — Read-only review before final submit
- [ ] Refactor `page.tsx` to orchestrate the multi-step flow using `react-hook-form`'s `FormProvider`
- [ ] Create `lib/constants/ph-regions.ts` with PH region-to-province mapping
- [ ] Create `lib/constants/ph-id-types.ts` with government ID options

---

### Stage 3: Submission Logic & Firestore
**File:** `app/(app)/dashboard/become-organizer/page.tsx`, `lib/services/applicationService.ts`

#### Updated Submission Flow
1. On final submit, save all form data to the `organizerApplications` collection
2. Upload all images to Cloudinary first, then store the URLs in the document
3. Update `user.organizer` with the new expanded fields
4. Show the success state (already exists, just update copy)

#### New Service Functions
```typescript
// lib/services/applicationService.ts
export async function submitOrganizerApplication(
    userId: string,
    data: OrganizerFormValues
): Promise<string> {
    // 1. Create the application document
    const docRef = await addDoc(collection(db, "organizerApplications"), {
        userId,
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // 2. Update user profile with organizer info
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
        "organizer.name": data.organizerName,
        "organizer.contactEmail": data.contactEmail,
        "organizer.phone": data.phone,
        "organizer.organizerType": data.organizerType,
        "organizer.appliedAt": serverTimestamp(),
        "organizer.approved": false,
    });

    return docRef.id;
}

export async function checkExistingApplication(userId: string): Promise<OrganizerApplication | null> {
    // Check if user already has a pending/approved application
    const q = query(
        collection(db, "organizerApplications"),
        where("userId", "==", userId),
        where("status", "in", ["pending", "approved"]),
        limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as OrganizerApplication;
}
```

#### Tasks
- [ ] Create `submitOrganizerApplication()` in `applicationService.ts`
- [ ] Create `checkExistingApplication()` to prevent duplicate applications
- [ ] Add duplicate application guard on page load — redirect or show status if already applied
- [ ] Handle image uploads via `lib/cloudinary` before submission
- [ ] Update success confirmation messaging

---

### Stage 4: Admin Review Page Enhancement
**File:** `app/(app)/dashboard/admin/applications/page.tsx`

The admin review page must be upgraded to display and leverage all the new verification fields.

#### Changes
1. **Expandable Application Cards:** Each card now shows a summary row with action buttons, and an expandable details panel with all verification info
2. **Verification Checklist:** Add a visual checklist for admins:
   - ✅ Government ID uploaded
   - ✅ TIN provided
   - ✅ Business permit uploaded
   - ✅ Address complete
   - ⚠️ No past events described
3. **Document Viewer:** Inline image viewer for uploaded government IDs and permits
4. **"Needs More Info" Status:** Add the ability for admins to request additional information from an applicant (status: `needs_info`) with a message
5. **Admin Notes:** Private notes field per application for internal tracking
6. **Quick Filters:** Add filter by `organizerType` in addition to status
7. **Enhanced Export:** Include all new fields in the CSV export

#### Tasks
- [ ] Add expandable detail panel to each application card
- [ ] Add document/image preview modal for uploaded IDs
- [ ] Add verification completeness indicator
- [ ] Add `needs_info` status support — admin can request more docs
- [ ] Add internal admin notes field
- [ ] Add organizer type filter
- [ ] Update CSV export to include all new fields

---

### Stage 5: Data Constants & Utilities
**Files:** New files in `lib/constants/`

#### `lib/constants/ph-regions.ts`
```typescript
export const PH_REGIONS = [
    { code: "NCR", name: "National Capital Region (NCR)" },
    { code: "CAR", name: "Cordillera Administrative Region (CAR)" },
    { code: "I", name: "Region I — Ilocos Region" },
    { code: "II", name: "Region II — Cagayan Valley" },
    { code: "III", name: "Region III — Central Luzon" },
    { code: "IV-A", name: "Region IV-A — CALABARZON" },
    { code: "IV-B", name: "Region IV-B — MIMAROPA" },
    { code: "V", name: "Region V — Bicol Region" },
    { code: "VI", name: "Region VI — Western Visayas" },
    { code: "VII", name: "Region VII — Central Visayas" },
    { code: "VIII", name: "Region VIII — Eastern Visayas" },
    { code: "IX", name: "Region IX — Zamboanga Peninsula" },
    { code: "X", name: "Region X — Northern Mindanao" },
    { code: "XI", name: "Region XI — Davao Region" },
    { code: "XII", name: "Region XII — SOCCSKSARGEN" },
    { code: "XIII", name: "Region XIII — Caraga" },
    { code: "BARMM", name: "Bangsamoro Autonomous Region (BARMM)" },
];

export const PH_PROVINCES: Record<string, string[]> = {
    "NCR": ["Metro Manila"],
    "CAR": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
    "I": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    // ... full mapping
};
```

#### `lib/constants/ph-id-types.ts`
```typescript
export const PH_GOVERNMENT_ID_TYPES = [
    { value: "philsys", label: "Philippine National ID (PhilSys)" },
    { value: "drivers_license", label: "Driver's License (LTO)" },
    { value: "passport", label: "Passport (DFA)" },
    { value: "sss_id", label: "SSS ID" },
    { value: "gsis_id", label: "GSIS ID" },
    { value: "prc_id", label: "PRC ID" },
    { value: "postal_id", label: "Postal ID" },
    { value: "voters_id", label: "Voter's ID" },
    { value: "senior_id", label: "Senior Citizen ID" },
    { value: "pwd_id", label: "PWD ID" },
    { value: "tin_id", label: "TIN Card (BIR)" },
    { value: "umid", label: "UMID" },
];
```

#### Tasks
- [ ] Create `lib/constants/ph-regions.ts` — Full region & province mapping
- [ ] Create `lib/constants/ph-id-types.ts` — Government ID options
- [ ] Create shared `Select` UI component if not already existing
- [ ] Create shared `Textarea` UI component if not already existing
- [ ] Create shared `FileUpload` component for document uploads (reuse Cloudinary logic)

---

## Implementation Order

```
Stage 5 (Constants & Utilities)   ──► Foundation data & shared components
Stage 1 (Types & Validation)      ──► Schema definitions
Stage 2 (Multi-Step Form UI)      ──► Main feature work
Stage 3 (Submission Logic)        ──► Connect form to Firestore
Stage 4 (Admin Review)            ──► Enhanced admin experience
```

**Estimated effort:** 3–4 focused sessions

---

## Summary of New Fields (Quick Reference)

| Category | Field | Required | PH-Specific |
|----------|-------|----------|-------------|
| Organization | Name | ✅ | |
| Organization | Type (enum) | ✅ | |
| Organization | Description | ✅ | |
| Contact | Contact Person | ✅ | |
| Contact | Email | ✅ | |
| Contact | Mobile | ✅ | ✅ 09XX format |
| Contact | Alternate Phone | ❌ | |
| Contact | Website/Social | ❌ | |
| Address | Street | ✅ | |
| Address | Barangay | ✅ | ✅ |
| Address | City/Municipality | ✅ | ✅ |
| Address | Province | ✅ | ✅ |
| Address | Region | ✅ | ✅ 17 regions |
| Address | ZIP Code | ✅ | ✅ 4-digit |
| Verification | BIR TIN | ❌ | ✅ |
| Verification | DTI/SEC Reg No. | ❌ | ✅ |
| Verification | Gov't ID Type | ✅ | ✅ |
| Verification | Gov't ID Number | ✅ | ✅ |
| Verification | ID Front Photo | ✅ | |
| Verification | ID Back Photo | ❌ | |
| Verification | Business Permit | ❌ | ✅ Mayor's Permit |
| Verification | Past Events | ❌ | |
| Verification | Events/Year | ❌ | |

**Total new required fields: 14** (up from 3)
**Total new optional fields: 9**
