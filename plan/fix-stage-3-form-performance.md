# Stage 3 — Form Performance & Type Safety
**Priority:** 🟠 High
**Issues Fixed:** #5 (watch() over-subscribing), #6 (Triple useFormContext), #12 (Silent publish failure), #13 (initialData: any), #19 (inclusionsText desync)
**Files Touched:** 3
**Risk:** Low-Medium — UI-only changes. Test each form step thoroughly.

**Vercel Rule References:** `rerender-memo`, `rerender-dependencies`, `rerender-derived-state-no-effect`, `rerender-move-effect-to-event`

---

## Overview

The 6-step `EventForm` re-renders on every keystroke because it subscribes to all form values with `watch()`. Combined with triple `useFormContext` calls and an unmemoized `saveDraft` function, the form accumulates significant rendering overhead as categories grow. These fixes target re-render frequency directly.

---

## Fix 1 — Replace `watch()` with Targeted `useWatch` + Memoize `saveDraft`
**Issues:** #5, #12 (silent failure)
**File:** `components/forms/event/EventForm.tsx`

### Changes

**A. Replace `watch()` with `useWatch` for only the fields used in the progress indicator:**

```ts
// Remove this:
const { handleSubmit, trigger, watch } = methods;
const values = watch(); // ← subscribes to everything

// Add this import at the top:
import { useForm, FormProvider, useWatch } from "react-hook-form";

// Replace with targeted subscriptions:
const { handleSubmit, trigger, control } = methods;

// Only the fields actually used in the isAccomplished checks
const [watchName, watchDescription, watchDate, watchFeaturedImage, watchCategories, watchTimeline, watchVanity] =
    useWatch({
        control,
        name: ["name", "description", "date", "featuredImage", "categories", "timeline", "vanityRaceNumber"],
    });
```

**B. Update the `isAccomplished` logic to use the watched variables instead of `values.*`:**

```ts
// Step 0
if (i === 0) return !!(watchName?.length >= 5 && watchDescription?.length >= 20 && watchDate && watchLocation?.name && watchLocation?.address);
// Step 1
if (i === 1) return !!watchFeaturedImage;
// Step 2
if (i === 2) return (watchCategories?.length || 0) > 0;
// Step 3
if (i === 3) return (watchTimeline?.length || 0) > 0;
// Step 4
if (i === 4) return i < currentStep || (isEditing && watchVanity);
```

> Also watch `location.name` and `location.address` — add them to the `useWatch` name array.

**C. Memoize `saveDraft` with `useCallback`:**

```ts
import { useCallback } from "react";

const saveDraft = useCallback(async () => {
    if (!user) {
        toast.error("You must be logged in to save.", {
            description: "Session may have expired. Please refresh."
        });
        return;
    }

    const loadingToast = toast.loading("Saving draft...");
    const values = methods.getValues();

    try {
        if (draftId && typeof draftId === "string" && draftId.length > 0) {
            await updateDoc(doc(db, "events", draftId), {
                ...values,
                updatedAt: serverTimestamp(),
            });
        } else {
            const res = await addDoc(collection(db, "events"), {
                ...values,
                organizerId: user.uid,
                organizerName: user.displayName || "Unknown Organizer",
                status: "draft",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setDraftId(res.id);
        }
        toast.success("Draft saved successfully!", { id: loadingToast });
    } catch (e) {
        console.error("Error saving draft:", e);
        toast.error("Failed to save draft.", {
            id: loadingToast,
            description: "Please check your connection and try again."
        });
    }
}, [user, draftId, methods]);
```

**D. Fix silent publish failure (#12) — add error toast in `onSubmit`:**

```ts
const onSubmit = async (data: EventFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
        // ...existing publish logic
        router.push("/dashboard/events");
    } catch (e: any) {
        console.error("Error publishing event:", e);
        toast.error("Failed to publish event.", {       // ← ADD THIS
            description: e?.message || "Please check your connection and try again."
        });
    } finally {
        setLoading(false);
    }
};
```

---

## Fix 2 — Consolidate `useFormContext` Calls in Step3Categories
**Issue:** #6
**File:** `components/forms/event/Step3Categories.tsx`

### Changes

**A. Single `useFormContext` call + `useWatch` for reactive value:**

```ts
// Remove the three separate useFormContext calls.
// Replace the top of Step3Categories with:

import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";

export function Step3Categories() {
    const { control, register, formState: { errors } } = useFormContext<EventFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: "categories" });

    // useWatch is more efficient than watch() for a single boolean
    const isEarlyBirdEnabled = useWatch({ control, name: "earlyBird.enabled" });

    // ...rest of component
}
```

**B. Replace the inline `useFormContext` in JSX for the checkbox:**

```tsx
// Before (line ~59):
{...useFormContext<EventFormValues>().register("earlyBird.enabled")}

// After (using the register destructured at the top):
{...register("earlyBird.enabled")}
```

**C. Replace the inline `useFormContext` for the date inputs:**

```tsx
// Before (lines ~74-83):
{...useFormContext<EventFormValues>().register("earlyBird.startDate")}
{...useFormContext<EventFormValues>().register("earlyBird.endDate")}

// After:
{...register("earlyBird.startDate")}
{...register("earlyBird.endDate")}
```

---

## Fix 3 — Fix `inclusionsText` Desync in `CategoryItem`
**Issue:** #19
**File:** `components/forms/event/Step3Categories.tsx` — `CategoryItem` component

### The Problem

`inclusionsText` is a local `useState` initialized from `field.inclusions` on mount. If the form resets or AI populates categories, the textarea shows stale data because the local state is not re-synced.

### The Fix

Use `useWatch` to read the current inclusions value from the form, and derive the textarea display value from it:

```ts
function CategoryItem({ index, remove, field }: { index: number, remove: (index: number) => void, field: any }) {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<EventFormValues>();

    // Watch the actual form value instead of local state
    const currentInclusions = useWatch({ control, name: `categories.${index}.inclusions` }) as string[] | undefined;

    // Derive the display string from the form value (always in sync)
    const inclusionsText = (currentInclusions || []).join(", ");

    const handleInclusionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Parse comma-separated text and sync to form
        const items = e.target.value.split(",").map((item: string) => item.trim()).filter(Boolean);
        setValue(`categories.${index}.inclusions`, items, { shouldValidate: true });
    };

    // ...rest of component

    // In JSX — replace the textarea:
    <textarea
        value={inclusionsText}
        onChange={handleInclusionsChange}
        // remove onBlur handler — no longer needed
        placeholder="List inclusions separated by commas (e.g. Finisher Medal, Shirt, Bib, Food)"
        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-text text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[100px] resize-none"
    />
}
```

> Note: This makes the textarea fully controlled and always reflects the form state. Typing will feel identical to the user but will now stay in sync when categories are reset or populated by AI.

---

## Fix 4 — Type Safety: Proper `EventFormInput` Type
**Issue:** #13
**Files:** `lib/validations/event.ts`, `components/forms/event/EventForm.tsx`, `app/(app)/dashboard/events/[id]/edit/page.tsx`

### The Root Cause

The form's date fields use `"YYYY-MM-DD"` strings (for native `<input type="date">`), but the Zod schema uses `z.coerce.date()` which expects a `Date`. This mismatch is hidden with `as any`.

### The Fix

Define a separate input type where dates are strings, and keep `EventFormValues` as the validated output type:

**In `lib/validations/event.ts` — add at the bottom:**

```ts
// EventFormValues = validated output (Zod inferred) — dates are Date objects
export type EventFormValues = z.infer<typeof eventSchema>;

// EventFormInput = what the form works with — dates are strings (YYYY-MM-DD)
export type EventFormInput = Omit<EventFormValues, "date" | "registrationEndDate" | "earlyBird"> & {
    date: string;
    registrationEndDate: string;
    earlyBird?: Omit<NonNullable<EventFormValues["earlyBird"]>, "startDate" | "endDate"> & {
        enabled: boolean;
        startDate?: string;
        endDate?: string;
    };
};
```

**In `components/forms/event/EventForm.tsx`:**

```ts
// Update the import
import { eventSchema, EventFormValues, EventFormInput } from "@/lib/validations/event";

// Update the interface
interface EventFormProps {
    initialData?: EventFormInput; // ← typed now
    isEditing?: boolean;
}

// Update the useForm — use EventFormInput for the form's internal type
const methods = useForm<EventFormInput>({
    resolver: zodResolver(eventSchema) as any, // still needed; Zod coerces strings to Date on submit
    defaultValues: initialData || { ... },
    mode: "onChange"
});
```

**In `app/(app)/dashboard/events/[id]/edit/page.tsx`:**

```ts
// Replace the cast:
// Before:
<EventForm initialData={eventData as any} isEditing />

// After (formattedData already has string dates):
<EventForm initialData={formattedData as EventFormInput} isEditing />
```

> This doesn't fully eliminate the `zodResolver as any` cast (that requires a deeper RHF + Zod integration fix), but it removes all consumer-facing `as any` casts and makes `initialData` typed.

---

## Acceptance Criteria

- [ ] Typing in any form field does NOT cause the entire `EventForm` to re-render (verify with React DevTools Profiler)
- [ ] `Step3Categories` uses exactly **1** `useFormContext` call
- [ ] The inclusions textarea always shows current form state — if you add a category via AI suggest, the textarea is populated
- [ ] Publishing an event that throws an error shows a toast notification
- [ ] `initialData` prop is typed as `EventFormInput` — no `as any` at call sites
- [ ] `saveDraft` is stable across renders (wrap in useCallback, verify no infinite loops)
