# Multi-step Form Patterns

Reference for how multi-step forms are built in this project. Two forms exist: the event creation form (organizer-facing) and the registration form (runner-facing). Both share the same core stack and `useFormSteps` hook.

---

## 1. Form Stack

| Layer | Library |
|---|---|
| Form state | `react-hook-form` (`useForm`, `FormProvider`, `useFormContext`, `useFieldArray`, `useWatch`) |
| Schema validation | `zod` |
| Resolver bridge | `@hookform/resolvers/zod` (`zodResolver`) |
| Step navigation | `useFormSteps` custom hook (`lib/hooks/useFormSteps.ts`) |
| Notifications | `sonner` (`toast`) |

**Key configuration on `useForm`:**

```ts
const methods = useForm<T>({
  resolver: zodResolver(schema) as any,
  defaultValues: { ... },
  mode: "onChange",   // validates on every change, not just on submit
});
```

`FormProvider` wraps the form tree so all step components can call `useFormContext()` without prop drilling.

---

## 2. `useFormSteps` Hook

**Location:** `lib/hooks/useFormSteps.ts`

### Signature

```ts
function useFormSteps<T extends FieldValues>(
  totalSteps: number,
  stepFields: Record<number, Path<T>[]>
): {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  nextStep: () => Promise<void>;
  prevStep: () => void;
}
```

### How it works

- Holds `currentStep` in local state, starting at `0`.
- `nextStep()` is async:
  1. Looks up the field paths registered for the current step from the `stepFields` map.
  2. Calls `trigger(fields)` — react-hook-form's imperative validation method — on only those fields.
  3. If valid, increments `currentStep` (capped at `totalSteps - 1`).
  4. If invalid, does **not** advance. Instead it uses `requestAnimationFrame` to query the DOM for `[aria-invalid="true"]` or `.border-red-500\/50`, scrolls the first matching element into view, and focuses it.
- `prevStep()` decrements `currentStep` (floored at `0`), unconditionally — no validation on backward navigation.
- Steps with no fields listed in `stepFields` (e.g. the Review step) advance immediately without triggering validation.

### Step field map pattern

Each form defines a `STEP_FIELDS` constant above the component. Only steps that have required fields need entries; steps that are not listed advance freely.

```ts
const STEP_FIELDS: Record<number, (keyof FormValues | string)[]> = {
  0: ["field.one", "field.two"],
  1: ["anotherField"],
  // step 2 (review) not listed — no validation on advance
};
```

---

## 3. Event Creation Form (6 steps)

**Location:** `components/forms/event/EventForm.tsx`

**Steps array:**

```ts
const STEPS = ["Basic Info", "Images", "Categories", "Timeline", "Features", "Review"];
//              index 0        1        2             3           4           5
```

**Step fields validated before advancing:**

| Step index | Fields validated |
|---|---|
| 0 | `name`, `description`, `date`, `registrationEndDate`, `location.name`, `location.address` |
| 1 | `featuredImage`, `galleryImages` |
| 2 | `categories`, `earlyBird` |
| 3 | `timeline` |
| 4, 5 | (not listed — no validation gate) |

### Step descriptions

**Step 1 — Basic Info** (`Step1Basic.tsx`)

Fields: event name, event date, registration deadline, description, venue name, full address.

Notable: includes an "Improve with AI" button on the description textarea. It calls `lib/services/aiService.improveText()` with the current text and a Clerk auth token, then sets the result back via `setValue("description", result)`.

**Step 2 — Event Images** (`Step2Images.tsx`)

Fields: `featuredImage` (single URL), `galleryImages` (array of URLs, max 5).

Image upload is handled by the shared `<ImageUpload>` component (Cloudinary). The component calls `setValue("featuredImage" | "galleryImages", url, { shouldValidate: true })` directly rather than using `register`. Gallery images use a splice-on-remove pattern: `galleryImages.filter((_, i) => i !== index)`.

**Step 3 — Distance Categories** (`Step3Categories.tsx`)

Manages a `useFieldArray` on `categories`. Each category card is a `<CategoryItem>` sub-component that receives `index` and `remove`.

Per-category fields: name, distance + unit (km/mi), price, early bird price (shown only when `earlyBird.enabled` is watched as true), race number format, max participants, assembly time, gun start time, cut-off time, kit inclusions (nested `useFieldArray` on `categories.${index}.inclusions`), GPX route file upload.

Early bird config is also on this step (date range pickers shown/hidden by a checkbox).

**Step 4 — Timeline** (`Step4Timeline.tsx`)

Manages a `useFieldArray` on `timeline`. Each item: `id`, `activity`, `description`, `time`, `order`.

**Step 5 — Features** (`Step5Features.tsx`)

Controls vanity race number config: `vanityRaceNumber.enabled`, `vanityRaceNumber.premiumPrice`, `vanityRaceNumber.maxDigits`.

**Step 6 — Review** (`Step6Review.tsx`)

Summary-only step. No fields. Final publish button triggers `handleSubmit(onSubmit)`.

### Auto-save (draft) behavior

`EventForm` wraps step navigation with a `saveDraft` call on every forward step:

```ts
const nextStep = async () => {
  await baseNextStep();         // validate + advance
  setMaxStepReached(prev => Math.max(prev, next));
  saveDraft();                  // fire-and-forget draft save
};
```

`saveDraft` reads current form values via `getValues()`, strips internal Convex fields via `prepareEventPayload()`, sets `status: "draft"`, then:
- If `draftId` exists (Convex ID, length > 20 chars): calls `api.events.update`.
- Otherwise: calls `api.events.create` and stores the returned ID in `draftId` state.

A manual "Save Draft" button in the footer also calls `saveDraft` directly.

### Edit vs create mode

`EventForm` accepts `initialData?: EventFormInput` and `isEditing?: boolean`.

- In create mode, `maxStepReached` starts at `0` — the user must advance step by step.
- In edit mode, `maxStepReached` starts at `STEPS.length - 1` — all steps are immediately clickable via the progress header.
- In edit mode, if the event status is `"published"`, a "Save & Publish" button appears alongside "Next Step" on every step before the review step, allowing the organizer to immediately publish without navigating to step 6.
- `draftId` is seeded from `initialData.id` so saves always update the existing record.

---

## 4. Registration Form (5 steps)

**Location:** `components/forms/registration/RegistrationForm.tsx`

**Steps array:**

```ts
const STEPS = ["Who", "Category", "Details", "Vanity", "Review"];
//              0      1          2           3        4
```

**Step fields validated before advancing:**

| Step index | Fields validated |
|---|---|
| 0 | `registrationType` |
| 1 | `categoryId` |
| 2 | `participantInfo.name`, `.email`, `.phone`, `.gender`, `.birthDate`, `.tShirtSize`, `.singletSize`, `.emergencyContact.name`, `.emergencyContact.phone`, `.emergencyContact.relationship` |
| 3 | `vanityNumber` |
| 4 | (not listed — review step, validated only on submit) |

Navigation also calls `window.scrollTo({ top: 0, behavior: "smooth" })` on every step change (both forward and back).

### Step descriptions

**Step 0 — Who** (`Step0Who.tsx`)

Two clickable cards: "Myself" and "Someone Else". Sets `registrationType` to `"self"` or `"proxy"` via `setValue("registrationType", type, { shouldValidate: true })`.

**Step 1 — Category** (`Step1Category.tsx`)

Renders one card per `event.categories` entry. On selection, calls:

```ts
setValue("categoryId", categoryId);
setValue("basePrice", numericPrice);
setValue("totalPrice", numericPrice + vanityPremium);
```

Uses `getEffectivePrice(event, cat)` from `lib/earlyBirdUtils` to apply early bird discounts. Displays a strikethrough original price and green "Early Bird" badge when the effective price is lower than the regular price.

**Step 2 — Details** (`Step2Details.tsx`)

Participant info fields: name, email, phone, gender, birth date, t-shirt size, singlet size, emergency contact (name, phone, relationship), medical conditions.

**Step 3 — Vanity** (`Step3Vanity.tsx`)

Optional vanity bib number input. Only rendered/relevant when `event.vanityRaceNumber.enabled` is true. If a vanity number is entered, `vanityPremium` and `totalPrice` are updated to include the surcharge.

**Step 4 — Review** (`Step4Review.tsx`)

Summary of all selections. Final "Submit" button triggers `handleSubmit(onSubmit)`.

### Pre-fill with user data

`RegistrationForm` sets `defaultValues` from `user` data (from `useAuth`) at mount. In addition, `RegistrationFormContent` has a `useEffect` that re-runs `reset()` whenever `registrationType` changes to `"self"`, re-applying the current user's profile fields. When type is `"proxy"`, no reset occurs so the organizer can fill in different details.

### Profile sync on submit

On successful form submission (for `registrationType === "self"`), `syncProfileFromRegistration` is called before the payment API call. It writes the participant info back to `api.users.updateProfile` along with a recalculated `profileCompletion` score. This is non-fatal — errors are caught and logged but do not block registration.

### Submission and payment

`onSubmit` POSTs to `/api/payments/create-checkout`. The response either:
- `result.free === true` — redirects to `/events/[id]/register/success?id=[registrationId]`
- `result.checkoutUrl` — redirects to the payment provider URL via `window.location.href`

There is no session storage for pending registrations currently implemented in the form itself; the user must be authenticated before the form renders.

---

## 5. Validation Schemas

### Event schema (`lib/validations/event.ts`)

**Top-level fields:**

| Field | Rule |
|---|---|
| `name` | `string`, min 5 chars |
| `description` | `string`, min 20 chars |
| `date` | `z.coerce.date()` — coerces string input to Date |
| `registrationEndDate` | `z.coerce.date()` |
| `location.name` | `string`, min 3 chars |
| `location.address` | `string`, min 5 chars |
| `featuredImage` | `string`, min 1 char (required) |
| `galleryImages` | array of strings, max 5 items |
| `categories` | array of `eventCategorySchema`, min 1 item |
| `timeline` | array of `timelineItemSchema` |
| `status` | enum: `draft`, `published`, `cancelled`, `completed` |
| `featured` | boolean |

**Early bird (`earlyBird`):**

- `enabled`: boolean
- When `enabled`, `startDate` and `endDate` are required (refinement error path: `startDate`)
- When `enabled`, `startDate` must be `<=` `endDate` (refinement error path: `endDate`)

**Cross-field refinements on the root schema:**

1. When `earlyBird.enabled`, every category must have `earlyBirdPrice` defined and `earlyBirdPrice < price`. Error path: `categories`.
2. `registrationEndDate` must be `<=` `date` (event date). Error path: `registrationEndDate`.

**Category schema (`eventCategorySchema`):**

| Field | Rule |
|---|---|
| `name` | min 3 chars |
| `distance` | positive number |
| `distanceUnit` | enum `km` / `mi`, default `km` |
| `assemblyTime` | min 1 char (required time string) |
| `gunStartTime` | min 1 char |
| `cutOffTime` | min 1 char |
| `price` | number, min 0 |
| `earlyBirdPrice` | number, min 0, optional |
| `inclusions` | array of strings, min 1 item |
| `raceNumberFormat` | min 1 char; use `{number}` as placeholder |
| `maxParticipants` | number, min 0, optional |

**Type aliases:**

- `EventFormValues` — full Zod-inferred type (dates are `Date` objects)
- `EventFormInput` — form working type; `date`, `registrationEndDate`, and early bird dates are `string` (YYYY-MM-DD). The `prepareEventPayload()` function converts these back to timestamps before Convex mutations.

### Registration schema (`lib/validations/registration.ts`)

| Field | Rule |
|---|---|
| `registrationType` | enum `self` / `proxy` |
| `eventId` | string |
| `categoryId` | string, min 1 char ("Please select a category") |
| `participantInfo.name` | min 2 chars |
| `participantInfo.email` | valid email |
| `participantInfo.phone` | min 10 chars |
| `participantInfo.gender` | enum `male` / `female` / `other` |
| `participantInfo.birthDate` | string, min 1 char |
| `participantInfo.tShirtSize` | min 1 char |
| `participantInfo.singletSize` | min 1 char |
| `participantInfo.emergencyContact.name` | min 2 chars |
| `participantInfo.emergencyContact.phone` | min 10 chars |
| `participantInfo.emergencyContact.relationship` | min 2 chars |
| `participantInfo.medicalConditions` | string, optional |
| `vanityNumber` | optional string; if provided, digits only (regex `/^[0-9]+$/`) |
| `basePrice` | number |
| `vanityPremium` | number |
| `totalPrice` | number |
| `termsAccepted` | boolean, must be `true` |

---

## 6. Pattern: Adding a New Form Step

The following checklist applies to either form.

### Step 1 — Create the step component

Create `components/forms/<form>/StepNName.tsx`. The component must:
- Be a client component (`"use client"`)
- Call `useFormContext<FormValues>()` to access `register`, `watch`, `setValue`, `formState.errors`
- Render field inputs and display `errors.fieldName?.message` below each field
- Add `animate-in fade-in slide-in-from-bottom-4 duration-500` to the root div for consistent entry animation

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { EventFormValues } from "@/lib/validations/event";

export function Step4Example() {
  const { register, formState: { errors } } = useFormContext<EventFormValues>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 border-b border-white/5 pb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white">Step Heading</h2>
        <p className="text-text-muted font-medium">Brief description.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Field Label</label>
        <input {...register("someField")} className="..." />
        {errors.someField?.message && (
          <p className="text-xs text-red-500 font-bold uppercase tracking-wide">
            {errors.someField.message}
          </p>
        )}
      </div>
    </div>
  );
}
```

### Step 2 — Add the field(s) to the Zod schema

Add any new fields to the relevant schema in `lib/validations/event.ts` or `lib/validations/registration.ts`. Update the exported type if needed.

### Step 3 — Register the step in the parent form

In `EventForm.tsx` or `RegistrationForm.tsx`:

1. Add the step label to the `STEPS` array.
2. Add the field paths that must pass validation before advancing to `STEP_FIELDS` at the new index.
3. Import and render the new step component conditionally:

```tsx
{currentStep === 3 && <StepNName />}
```

4. Update any `maxStepReached` logic or progress-indicator completion checks if the event form's step indicator should reflect whether the step is "accomplished".

### Step 4 — Handle any `defaultValues`

Add sensible defaults for the new fields in the `useForm` `defaultValues` object inside `EventForm` or `RegistrationForm`. When editing, ensure `prepareEventPayload` (event form) strips or transforms any fields that Convex does not accept.

### Step 5 — Test navigation

- Confirm the "Next Step" button does not advance when required fields on the new step are empty.
- Confirm `useFormSteps` scrolls to and focuses the first invalid field.
- For the event form, confirm `saveDraft` fires after advancing past the new step.
