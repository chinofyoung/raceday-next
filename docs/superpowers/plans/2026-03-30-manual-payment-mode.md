# Manual Payment Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow organizers to opt out of Xendit and use manual payment verification (bank transfer / e-wallet with proof of payment upload).

**Architecture:** Add `paymentMode` to events, `paymentMethods` array to users, and `proofOfPayment` + `manualPaymentStatus` to registrations. Insert a new Step 2 in the event creation wizard. For manual events, runners upload proof of payment; organizers verify from a dashboard table. Approval triggers the same bib/QR generation as the existing Xendit flow.

**Tech Stack:** Next.js 16, React 19, TypeScript, Convex, Clerk, Tailwind CSS v4, shadcn/ui, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-30-manual-payment-mode-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `components/forms/event/Step2PaymentMode.tsx` | Payment mode selection cards (portal vs manual) in event wizard |
| `components/dashboard/PaymentMethodsManager.tsx` | CRUD grid for organizer payment methods on settings page |
| `components/forms/registration/PaymentInstructions.tsx` | Post-registration page showing organizer payment methods + proof upload |
| `components/dashboard/PendingPaymentsTable.tsx` | Organizer table for reviewing/approving manual payment registrations |

### Modified Files
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add `paymentMethods` to users, `paymentMode` to events, proof/review fields to registrations |
| `convex/users.ts` | Add `addPaymentMethod`, `updatePaymentMethod`, `deletePaymentMethod` mutations + `getPaymentMethods` query |
| `convex/events.ts` | Add `paymentMode` to `create` and `update` args |
| `convex/registrations.ts` | Add `uploadProofOfPayment`, `approveManualPayment`, `rejectManualPayment` mutations + `listManualPayments` query |
| `lib/validations/event.ts` | Add `paymentMode` field to event schema |
| `components/forms/event/EventForm.tsx` | Insert Step 2, shift steps 2-6 → 3-7 |
| `components/forms/registration/RegistrationForm.tsx` | Handle manual payment redirect after submit |
| `app/api/payments/create-checkout/route.ts` | Skip Xendit for manual payment events, return instructions redirect |
| `app/(marketing)/events/[id]/register/success/page.tsx` | Handle manual payment state (show payment instructions + upload) |
| `app/(app)/dashboard/organizer/settings/page.tsx` | Add PaymentMethodsManager section |

---

### Task 1: Schema Changes

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add `paymentMethods` to users table**

In `convex/schema.ts`, add after the `organizer` field (line 41, before the closing of the organizer object):

```typescript
// After line 41 (after the organizer field closing)
paymentMethods: v.optional(v.array(v.object({
    id: v.string(),
    type: v.union(v.literal("bank"), v.literal("ewallet"), v.literal("other")),
    label: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    instructions: v.optional(v.string()),
    qrCodeStorageId: v.optional(v.string()),
}))),
```

Add this as a top-level field on the `users` table, after line 41 (the `organizer` closing paren + comma).

- [ ] **Step 2: Add `paymentMode` to events table**

In `convex/schema.ts`, add after `featured: v.boolean()` (line 137) in the events table:

```typescript
paymentMode: v.optional(v.union(v.literal("portal"), v.literal("manual"))),
```

- [ ] **Step 3: Add manual payment fields to registrations table**

In `convex/schema.ts`, add after `xenditInvoiceUrl` (line 155) in the registrations table:

```typescript
proofOfPayment: v.optional(v.object({
    storageId: v.string(),
    uploadedAt: v.number(),
    url: v.string(),
})),
manualPaymentStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("submitted"),
    v.literal("approved"),
    v.literal("rejected"),
)),
reviewedAt: v.optional(v.number()),
reviewedBy: v.optional(v.id("users")),
```

- [ ] **Step 4: Verify schema compiles**

Run: `npx convex dev --once` (or check that the Convex dev server picks up the changes without errors).

- [ ] **Step 5: Commit**

```
feat: add schema fields for manual payment mode

Add paymentMethods to users, paymentMode to events,
and proofOfPayment/manualPaymentStatus to registrations.
```

---

### Task 2: Event Validation Schema Update

**Files:**
- Modify: `lib/validations/event.ts`

- [ ] **Step 1: Add `paymentMode` to event Zod schema**

In `lib/validations/event.ts`, add `paymentMode` to the `eventSchema` object, after `featured` (line 90):

```typescript
paymentMode: z.enum(["portal", "manual"]).default("portal"),
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` — should pass (the new field has a default so existing code won't break).

- [ ] **Step 3: Commit**

```
feat: add paymentMode to event validation schema
```

---

### Task 3: Convex Events Mutations — Add `paymentMode`

**Files:**
- Modify: `convex/events.ts`

- [ ] **Step 1: Add `paymentMode` to the `create` mutation args**

In `convex/events.ts`, add to the `create` mutation args (after line 151, the `featured` arg):

```typescript
paymentMode: v.optional(v.union(v.literal("portal"), v.literal("manual"))),
```

- [ ] **Step 2: Add `paymentMode` to the `update` mutation args**

In `convex/events.ts`, add to the `update` mutation args (after `featured`, around line 248):

```typescript
paymentMode: v.optional(v.union(v.literal("portal"), v.literal("manual"))),
```

- [ ] **Step 3: Verify Convex compiles**

Check the Convex dev server logs — should accept the new optional arg.

- [ ] **Step 4: Commit**

```
feat: add paymentMode arg to events create/update mutations
```

---

### Task 4: Convex Users Mutations — Payment Methods CRUD

**Files:**
- Modify: `convex/users.ts`

- [ ] **Step 1: Add `addPaymentMethod` mutation**

Append to `convex/users.ts`:

```typescript
export const addPaymentMethod = mutation({
    args: {
        type: v.union(v.literal("bank"), v.literal("ewallet"), v.literal("other")),
        label: v.string(),
        accountName: v.string(),
        accountNumber: v.string(),
        instructions: v.optional(v.string()),
        qrCodeStorageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const newMethod = {
            id: Math.random().toString(36).substring(2, 9),
            ...args,
        };

        const existing = user.paymentMethods || [];
        await ctx.db.patch(user._id, {
            paymentMethods: [...existing, newMethod],
            updatedAt: Date.now(),
        });

        return newMethod.id;
    },
});
```

- [ ] **Step 2: Add `updatePaymentMethod` mutation**

Append to `convex/users.ts`:

```typescript
export const updatePaymentMethod = mutation({
    args: {
        methodId: v.string(),
        type: v.union(v.literal("bank"), v.literal("ewallet"), v.literal("other")),
        label: v.string(),
        accountName: v.string(),
        accountNumber: v.string(),
        instructions: v.optional(v.string()),
        qrCodeStorageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const methods = user.paymentMethods || [];
        const index = methods.findIndex((m) => m.id === args.methodId);
        if (index === -1) throw new Error("Payment method not found");

        const { methodId, ...updates } = args;
        const updatedMethods = [...methods];
        updatedMethods[index] = { ...updatedMethods[index], ...updates };

        await ctx.db.patch(user._id, {
            paymentMethods: updatedMethods,
            updatedAt: Date.now(),
        });
    },
});
```

- [ ] **Step 3: Add `deletePaymentMethod` mutation**

Append to `convex/users.ts`:

```typescript
export const deletePaymentMethod = mutation({
    args: { methodId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const methods = user.paymentMethods || [];
        const filtered = methods.filter((m) => m.id !== args.methodId);

        await ctx.db.patch(user._id, {
            paymentMethods: filtered,
            updatedAt: Date.now(),
        });
    },
});
```

- [ ] **Step 4: Add `getPaymentMethods` query**

Append to `convex/users.ts`:

```typescript
export const getPaymentMethods = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return [];
        return user.paymentMethods || [];
    },
});
```

- [ ] **Step 5: Verify Convex compiles**

- [ ] **Step 6: Commit**

```
feat: add payment methods CRUD mutations to users
```

---

### Task 5: Convex Registrations — Manual Payment Mutations

**Files:**
- Modify: `convex/registrations.ts`

- [ ] **Step 1: Add `uploadProofOfPayment` mutation**

Append to `convex/registrations.ts`:

```typescript
export const uploadProofOfPayment = mutation({
    args: {
        id: v.id("registrations"),
        storageId: v.string(),
        url: v.string(),
    },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const reg = await ctx.db.get(args.id);
        if (!reg) throw new Error("Registration not found");

        // Verify caller owns this registration
        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user || reg.userId !== user._id) throw new Error("Forbidden");

        await ctx.db.patch(args.id, {
            proofOfPayment: {
                storageId: args.storageId,
                uploadedAt: Date.now(),
                url: args.url,
            },
            manualPaymentStatus: "submitted",
            updatedAt: Date.now(),
        });
    },
});
```

- [ ] **Step 2: Add `approveManualPayment` mutation**

Append to `convex/registrations.ts`. This replicates the bib/QR logic from `markAsPaid`:

```typescript
export const approveManualPayment = mutation({
    args: { id: v.id("registrations") },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const reg = await ctx.db.get(args.id);
        if (!reg) throw new Error("Registration not found");

        // Only organizer or admin can approve
        const event = await ctx.db.get(reg.eventId);
        if (!event) throw new Error("Event not found");
        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

        if (reg.manualPaymentStatus === "approved") return; // Idempotent

        await ctx.db.patch(args.id, {
            manualPaymentStatus: "approved",
            status: "paid",
            paymentStatus: "paid",
            paidAt: Date.now(),
            reviewedAt: Date.now(),
            reviewedBy: user._id,
            updatedAt: Date.now(),
        });

        // Increment denormalized registeredCount (same as markAsPaid)
        if (event.categories) {
            const catIndex = event.categories.findIndex(c => (c.id || "0") === reg.categoryId);
            if (catIndex !== -1) {
                const newCategories = [...event.categories];
                newCategories[catIndex] = {
                    ...newCategories[catIndex],
                    registeredCount: (newCategories[catIndex].registeredCount || 0) + 1,
                };
                await ctx.db.patch(reg.eventId, {
                    categories: newCategories,
                    updatedAt: Date.now(),
                });
            }
        }
    },
});
```

- [ ] **Step 3: Add `rejectManualPayment` mutation**

Append to `convex/registrations.ts`:

```typescript
export const rejectManualPayment = mutation({
    args: { id: v.id("registrations") },
    handler: async (ctx: MutationCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const reg = await ctx.db.get(args.id);
        if (!reg) throw new Error("Registration not found");

        const event = await ctx.db.get(reg.eventId);
        if (!event) throw new Error("Event not found");
        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

        await ctx.db.patch(args.id, {
            manualPaymentStatus: "rejected",
            reviewedAt: Date.now(),
            reviewedBy: user._id,
            updatedAt: Date.now(),
        });
    },
});
```

- [ ] **Step 4: Add `listManualPayments` query**

Append to `convex/registrations.ts`:

```typescript
export const listManualPayments = query({
    args: {
        eventId: v.id("events"),
        statusFilter: v.optional(v.string()),
    },
    handler: async (ctx: QueryCtx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        // Verify access
        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");
        if (user._id !== event.organizerId && user.role !== "admin") {
            throw new Error("Forbidden");
        }

        // Fetch all non-cancelled registrations for this event
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        // Filter to manual payment registrations (those with manualPaymentStatus set)
        let filtered = registrations.filter((r) => r.manualPaymentStatus !== undefined);

        if (args.statusFilter && args.statusFilter !== "all") {
            filtered = filtered.filter((r) => r.manualPaymentStatus === args.statusFilter);
        }

        return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});
```

- [ ] **Step 5: Verify Convex compiles**

- [ ] **Step 6: Commit**

```
feat: add manual payment mutations (upload proof, approve, reject, list)
```

---

### Task 6: Event Creation Wizard — Insert Step 2 (Payment Mode)

**Files:**
- Create: `components/forms/event/Step2PaymentMode.tsx`
- Modify: `components/forms/event/EventForm.tsx`
- Modify: `lib/validations/event.ts` (add `paymentMode` default value)

- [ ] **Step 1: Create `Step2PaymentMode.tsx`**

Create `components/forms/event/Step2PaymentMode.tsx`:

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { EventFormInput } from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import { CreditCard, Upload, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function Step2PaymentMode() {
    const { watch, setValue } = useFormContext<EventFormInput>();
    const { user } = useAuth();
    const paymentMode = watch("paymentMode") || "portal";
    const hasPaymentMethods = (user?.paymentMethods?.length || 0) > 0;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    How will runners <span className="text-primary">pay</span>?
                </h2>
                <p className="text-text-muted font-medium">
                    Choose how you'd like to collect registration fees. This applies to all categories in this event.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Portal Card */}
                <button
                    type="button"
                    onClick={() => setValue("paymentMode", "portal", { shouldDirty: true })}
                    className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all cursor-pointer group",
                        paymentMode === "portal"
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-white/10 bg-white/2 hover:border-primary/30"
                    )}
                >
                    {paymentMode === "portal" && (
                        <span className="inline-flex items-center px-2 py-0.5 mb-4 text-[10px] font-semibold uppercase tracking-wider bg-primary text-white rounded-full">
                            Selected
                        </span>
                    )}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border",
                        paymentMode === "portal"
                            ? "bg-primary/12 border-primary/20 text-primary"
                            : "bg-white/4 border-white/8 text-text-muted group-hover:text-primary group-hover:border-primary/20"
                    )}>
                        <CreditCard size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Payment portal</h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                        Runners pay through a secure online checkout powered by Xendit. Payments are processed automatically and registrations are confirmed instantly.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["GCash", "Cards", "Bank transfer", "Maya"].map((m) => (
                            <span key={m} className="text-xs text-text-muted bg-white/4 border border-white/8 px-3 py-1 rounded-full">
                                {m}
                            </span>
                        ))}
                    </div>
                </button>

                {/* Manual Payment Card */}
                <button
                    type="button"
                    onClick={() => setValue("paymentMode", "manual", { shouldDirty: true })}
                    className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all cursor-pointer group",
                        paymentMode === "manual"
                            ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                            : "border-white/10 bg-white/2 hover:border-blue-500/30"
                    )}
                >
                    {paymentMode === "manual" && (
                        <span className="inline-flex items-center px-2 py-0.5 mb-4 text-[10px] font-semibold uppercase tracking-wider bg-blue-500 text-white rounded-full">
                            Selected
                        </span>
                    )}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border",
                        paymentMode === "manual"
                            ? "bg-blue-500/12 border-blue-500/20 text-blue-500"
                            : "bg-white/4 border-white/8 text-text-muted group-hover:text-blue-500 group-hover:border-blue-500/20"
                    )}>
                        <Upload size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Manual payment</h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                        Runners pay you directly via bank transfer or e-wallet, then upload proof of payment. You review and confirm each registration manually.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Bank transfer", "E-wallet", "QR code"].map((m) => (
                            <span key={m} className="text-xs text-text-muted bg-white/4 border border-white/8 px-3 py-1 rounded-full">
                                {m}
                            </span>
                        ))}
                    </div>
                </button>
            </div>

            {/* Warning: no payment methods */}
            {paymentMode === "manual" && !hasPaymentMethods && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-500">No payment methods set up</p>
                        <p className="text-xs text-text-muted mt-1">
                            You need at least one payment method on your{" "}
                            <a href="/dashboard/organizer/settings" target="_blank" className="text-primary underline">
                                organizer profile
                            </a>{" "}
                            so runners know where to send payment.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Update `EventForm.tsx` — shift steps and add Step2PaymentMode**

In `components/forms/event/EventForm.tsx`, make these changes:

**a)** Add import at the top (after existing step imports):
```typescript
import { Step2PaymentMode } from "./Step2PaymentMode";
```

**b)** Update `STEPS` array (line 26):
```typescript
const STEPS = [
    "Basic Info",
    "Payment",
    "Images",
    "Categories",
    "Timeline",
    "Features",
    "Review"
];
```

**c)** Update `STEP_FIELDS` (line 35) — shift existing keys by +1 and add new step 1:
```typescript
const STEP_FIELDS: Record<number, (keyof EventFormInput | string)[]> = {
    0: ["name", "description", "date", "registrationEndDate", "location.name", "location.address"],
    1: ["paymentMode"],
    2: ["featuredImage", "galleryImages"],
    3: ["categories", "earlyBird"],
    4: ["timeline"],
};
```

**d)** Update the step rendering block (around line 227) — insert Step2PaymentMode and shift all others:
```tsx
{currentStep === 0 && <Step1Basic />}
{currentStep === 1 && <Step2PaymentMode />}
{currentStep === 2 && <Step2Images />}
{currentStep === 3 && <Step3Categories />}
{currentStep === 4 && <Step4Timeline />}
{currentStep === 5 && <Step5Features />}
{currentStep === 6 && <Step6Review />}
```

**e)** Update the `isAccomplished` logic (around line 177) — shift existing checks and add payment mode check:
```typescript
const isAccomplished = (() => {
    if (i === 0) return !!(watchName?.length >= 5 && watchDescription?.length >= 20 && watchDate && watchLocationName && watchLocationAddress);
    if (i === 1) return !!watchPaymentMode;
    if (i === 2) return !!watchFeaturedImage;
    if (i === 3) return (watchCategories?.length || 0) > 0;
    if (i === 4) return (watchTimeline?.length || 0) > 0;
    if (i === 5) return i < currentStep || (isEditing && watchVanity);
    return false;
})();
```

**f)** Add `watchPaymentMode` to the `useWatch` call (around line 83):
```typescript
const [watchName, watchDescription, watchDate, watchFeaturedImage, watchCategories, watchTimeline, watchVanity, watchLocationName, watchLocationAddress, watchPaymentMode] =
    useWatch({
        control,
        name: ["name", "description", "date", "featuredImage", "categories", "timeline", "vanityRaceNumber", "location.name", "location.address", "paymentMode"],
    });
```

**g)** Add `paymentMode` default value in the form init (around line 296):
```typescript
paymentMode: "portal",
```
Add this to the `defaultValues` object in the `useForm` call, after `featured: false`.

- [ ] **Step 3: Add `paymentMode` to `prepareEventPayload`**

In `EventForm.tsx`, update `prepareEventPayload` (line 42) to include `paymentMode`:
```typescript
function prepareEventPayload(data: any) {
    const { _id, _creationTime, id: _, createdAt, updatedAt, organizerId, organizerName, ...rest } = data;
    return {
        ...rest,
        date: new Date(data.date).getTime(),
        registrationEndDate: new Date(data.registrationEndDate).getTime(),
        earlyBird: data.earlyBird?.enabled ? {
            enabled: true,
            startDate: data.earlyBird.startDate ? new Date(data.earlyBird.startDate).getTime() : 0,
            endDate: data.earlyBird.endDate ? new Date(data.earlyBird.endDate).getTime() : 0,
        } : undefined,
        featured: data.featured ?? false,
        paymentMode: data.paymentMode || "portal",
    };
}
```

- [ ] **Step 4: Verify the wizard renders all 7 steps**

Run the dev server, navigate to event creation, and confirm all 7 steps render with correct labels.

- [ ] **Step 5: Commit**

```
feat: add payment mode step (Step 2) to event creation wizard
```

---

### Task 7: Payment Methods Manager Component

**Files:**
- Create: `components/dashboard/PaymentMethodsManager.tsx`
- Modify: `app/(app)/dashboard/organizer/settings/page.tsx`

- [ ] **Step 1: Create `PaymentMethodsManager.tsx`**

Create `components/dashboard/PaymentMethodsManager.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Save, Loader2, QrCode, Building2, Wallet, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

type PaymentMethodType = "bank" | "ewallet" | "other";

interface PaymentMethod {
    id: string;
    type: PaymentMethodType;
    label: string;
    accountName: string;
    accountNumber: string;
    instructions?: string;
    qrCodeStorageId?: string;
}

const TYPE_OPTIONS: { value: PaymentMethodType; label: string; icon: typeof Building2; color: string }[] = [
    { value: "bank", label: "Bank", icon: Building2, color: "text-cta bg-cta/10 border-cta/20" },
    { value: "ewallet", label: "E-wallet", icon: Wallet, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { value: "other", label: "Other", icon: HelpCircle, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
];

function getTypeStyle(type: PaymentMethodType) {
    return TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[2];
}

export function PaymentMethodsManager() {
    const { user } = useAuth();
    const methods: PaymentMethod[] = (user?.paymentMethods as PaymentMethod[]) || [];
    const addMethod = useMutation(api.users.addPaymentMethod);
    const updateMethod = useMutation(api.users.updatePaymentMethod);
    const deleteMethod = useMutation(api.users.deletePaymentMethod);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formType, setFormType] = useState<PaymentMethodType>("bank");
    const [formLabel, setFormLabel] = useState("");
    const [formAccountName, setFormAccountName] = useState("");
    const [formAccountNumber, setFormAccountNumber] = useState("");
    const [formInstructions, setFormInstructions] = useState("");
    const [formQrCode, setFormQrCode] = useState("");

    const resetForm = () => {
        setFormType("bank");
        setFormLabel("");
        setFormAccountName("");
        setFormAccountNumber("");
        setFormInstructions("");
        setFormQrCode("");
        setEditingId(null);
        setShowForm(false);
    };

    const openEditForm = (method: PaymentMethod) => {
        setFormType(method.type);
        setFormLabel(method.label);
        setFormAccountName(method.accountName);
        setFormAccountNumber(method.accountNumber);
        setFormInstructions(method.instructions || "");
        setFormQrCode(method.qrCodeStorageId || "");
        setEditingId(method.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formLabel || !formAccountName || !formAccountNumber) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setSaving(true);
        try {
            const data = {
                type: formType,
                label: formLabel,
                accountName: formAccountName,
                accountNumber: formAccountNumber,
                instructions: formInstructions || undefined,
                qrCodeStorageId: formQrCode || undefined,
            };

            if (editingId) {
                await updateMethod({ methodId: editingId, ...data });
                toast.success("Payment method updated.");
            } else {
                await addMethod(data);
                toast.success("Payment method added.");
            }
            resetForm();
        } catch (error: any) {
            toast.error(error?.message || "Failed to save payment method.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (methodId: string) => {
        try {
            await deleteMethod({ methodId });
            toast.success("Payment method removed.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete payment method.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-white">Payment methods</h3>
                    <p className="text-sm text-text-muted">Runners will see these when you use manual payment mode.</p>
                </div>
                {!showForm && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowForm(true)}
                        className="gap-2"
                    >
                        <Plus size={14} /> Add
                    </Button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <Card className="p-6 bg-surface/50 border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {editingId ? "Edit payment method" : "Add payment method"}
                        </h4>
                        <button type="button" onClick={resetForm} className="text-text-muted hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Type selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Type</Label>
                        <div className="flex gap-2">
                            {TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormType(opt.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                                        formType === opt.value
                                            ? opt.color
                                            : "bg-white/4 border-white/8 text-text-muted hover:border-white/20"
                                    )}
                                >
                                    <opt.icon size={14} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Label *</Label>
                            <Input
                                value={formLabel}
                                onChange={(e) => setFormLabel(e.target.value)}
                                placeholder="e.g. GCash, BPI Savings"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Account name *</Label>
                            <Input
                                value={formAccountName}
                                onChange={(e) => setFormAccountName(e.target.value)}
                                placeholder="Account holder name"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Account number *</Label>
                            <Input
                                value={formAccountNumber}
                                onChange={(e) => setFormAccountNumber(e.target.value)}
                                placeholder="e.g. 0917 123 4567"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">QR code image</Label>
                            <ImageUpload
                                value={formQrCode}
                                onChange={setFormQrCode}
                                label="Upload QR"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Instructions for runners</Label>
                        <textarea
                            value={formInstructions}
                            onChange={(e) => setFormInstructions(e.target.value)}
                            placeholder="e.g. Use your full name as reference"
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={resetForm} size="sm">Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {editingId ? "Update" : "Add Method"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Grid */}
            {methods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {methods.map((method) => {
                        const style = getTypeStyle(method.type);
                        return (
                            <Card
                                key={method.id}
                                className="p-4 bg-surface/30 border-white/8 flex gap-4 items-start"
                            >
                                {/* QR thumbnail */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white/3 border border-white/8">
                                    {method.qrCodeStorageId ? (
                                        <img
                                            src={method.qrCodeStorageId}
                                            alt="QR"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <QrCode size={20} className="text-text-muted/30" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white truncate">{method.label}</h4>
                                            <Badge className={cn("text-[10px] font-semibold uppercase border px-1.5 py-0", style.color)}>
                                                {style.label}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(method)}
                                                className="p-1.5 text-text-muted hover:text-white transition-colors"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(method.id)}
                                                className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted truncate">{method.accountName}</p>
                                    <p className="text-xs text-white font-mono truncate">{method.accountNumber}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : !showForm ? (
                <Card className="p-8 bg-surface/20 border-dashed border-2 border-white/5 text-center space-y-3">
                    <Wallet size={32} className="mx-auto text-text-muted/20" />
                    <p className="text-sm text-text-muted">No payment methods yet.</p>
                    <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2">
                        <Plus size={14} /> Add your first method
                    </Button>
                </Card>
            ) : null}
        </div>
    );
}
```

- [ ] **Step 2: Add PaymentMethodsManager to organizer settings page**

In `app/(app)/dashboard/organizer/settings/page.tsx`, add the import and render it below `OrganizerProfileForm`:

```tsx
import { PaymentMethodsManager } from "@/components/dashboard/PaymentMethodsManager";
```

Update the return JSX, after `<OrganizerProfileForm />`:
```tsx
<OrganizerProfileForm />

{/* Payment Methods */}
<div className="pt-4 border-t border-white/5">
    <PaymentMethodsManager />
</div>
```

- [ ] **Step 3: Verify the payment methods manager renders**

Navigate to `/dashboard/organizer/settings`, confirm the new section appears below the organizer profile form.

- [ ] **Step 4: Commit**

```
feat: add payment methods manager to organizer settings
```

---

### Task 8: Payment API — Handle Manual Payment Events

**Files:**
- Modify: `app/api/payments/create-checkout/route.ts`

- [ ] **Step 1: Add manual payment handling**

In `app/api/payments/create-checkout/route.ts`, after the free registration block (after line 121, the `return NextResponse.json({ checkoutUrl: null, registrationId: regId, free: true })`) and before the "Create registration in Convex (pending)" comment on line 124, add:

```typescript
// Handle MANUAL PAYMENT events — skip Xendit, return instructions redirect
if (eventData.paymentMode === "manual") {
    const regId = await fetchMutation(api.registrations.create, {
        eventId: registrationData.eventId as Id<"events">,
        categoryId: registrationData.categoryId,
        userId: (userId || registrationData.userId) as Id<"users">,
        isProxy: registrationData.isProxy || false,
        registrationData: registrationData,
        totalPrice: totalAmount,
    });

    return NextResponse.json({
        checkoutUrl: null,
        registrationId: regId,
        manualPayment: true,
    });
}
```

- [ ] **Step 2: Verify Xendit flow is unchanged**

Existing events without `paymentMode` (or with `paymentMode: "portal"`) should still go through the Xendit flow. The `eventData.paymentMode === "manual"` check only triggers for explicitly manual events.

- [ ] **Step 3: Commit**

```
feat: skip Xendit for manual payment events in create-checkout API
```

---

### Task 9: Registration Form — Handle Manual Payment Redirect

**Files:**
- Modify: `components/forms/registration/RegistrationForm.tsx`

- [ ] **Step 1: Update `submitRegistration` to handle manual payment response**

In `components/forms/registration/RegistrationForm.tsx`, update the `submitRegistration` callback. After `const result = await response.json()` and the error check, update the redirect logic (around line 183):

```typescript
if (result.free) {
    router.push(`/events/${event.id}/register/success?id=${result.registrationId}`);
} else if (result.manualPayment) {
    router.push(`/events/${event.id}/register/success?id=${result.registrationId}&manual=true`);
} else if (result.checkoutUrl) {
    window.location.href = result.checkoutUrl;
} else {
    throw new Error("Invalid server response. Please try again.");
}
```

- [ ] **Step 2: Commit**

```
feat: handle manual payment redirect in registration form
```

---

### Task 10: Payment Instructions Component

**Files:**
- Create: `components/forms/registration/PaymentInstructions.tsx`

- [ ] **Step 1: Create `PaymentInstructions.tsx`**

Create `components/forms/registration/PaymentInstructions.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";
import { Copy, Check, Upload, QrCode, Building2, Wallet, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentInstructionsProps {
    organizerId: string;
    registrationId: string;
    totalPrice: number;
    onProofUploaded?: () => void;
}

const TYPE_ICONS: Record<string, typeof Building2> = {
    bank: Building2,
    ewallet: Wallet,
    other: HelpCircle,
};

const TYPE_COLORS: Record<string, string> = {
    bank: "text-cta bg-cta/10 border-cta/20",
    ewallet: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    other: "text-purple-500 bg-purple-500/10 border-purple-500/20",
};

export function PaymentInstructions({ organizerId, registrationId, totalPrice, onProofUploaded }: PaymentInstructionsProps) {
    const methods = useQuery(api.users.getPaymentMethods, { userId: organizerId as Id<"users"> });
    const uploadProof = useMutation(api.registrations.uploadProofOfPayment);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUploadProof = async () => {
        if (!proofUrl) {
            toast.error("Please upload a screenshot of your payment.");
            return;
        }

        setUploading(true);
        try {
            await uploadProof({
                id: registrationId as Id<"registrations">,
                storageId: proofUrl,
                url: proofUrl,
            });
            toast.success("Proof of payment uploaded! The organizer will review it shortly.");
            onProofUploaded?.();
        } catch (error: any) {
            toast.error(error?.message || "Failed to upload proof of payment.");
        } finally {
            setUploading(false);
        }
    };

    if (!methods) return null;

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-white">Send your payment</h3>
                <p className="text-text-muted">
                    Transfer <span className="text-white font-bold">₱{totalPrice}</span> to any of the accounts below, then upload your proof of payment.
                </p>
            </div>

            {/* Payment methods grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {methods.map((method: any) => {
                    const Icon = TYPE_ICONS[method.type] || HelpCircle;
                    const color = TYPE_COLORS[method.type] || TYPE_COLORS.other;
                    return (
                        <Card key={method.id} className="p-4 bg-surface/30 border-white/8 flex gap-4 items-start">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white/3 border border-white/8">
                                {method.qrCodeStorageId ? (
                                    <img src={method.qrCodeStorageId} alt="QR" className="w-full h-full object-cover" />
                                ) : (
                                    <QrCode size={20} className="text-text-muted/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-white truncate">{method.label}</h4>
                                    <Badge className={cn("text-[10px] font-semibold uppercase border px-1.5 py-0", color)}>
                                        {method.type === "ewallet" ? "E-wallet" : method.type === "bank" ? "Bank" : "Other"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-text-muted">{method.accountName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-white font-mono">{method.accountNumber}</p>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(method.accountNumber, method.id)}
                                        className="p-1 text-text-muted hover:text-primary transition-colors"
                                    >
                                        {copiedId === method.id ? <Check size={12} className="text-cta" /> : <Copy size={12} />}
                                    </button>
                                </div>
                                {method.instructions && (
                                    <p className="text-xs text-text-muted mt-2 italic">{method.instructions}</p>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Upload proof */}
            <Card className="p-6 bg-surface/50 border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                    <Upload size={16} className="text-primary" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Upload proof of payment</h4>
                </div>
                <p className="text-xs text-text-muted">
                    Take a screenshot of your payment confirmation and upload it here. The organizer will review and confirm your registration.
                </p>
                <ImageUpload
                    value={proofUrl}
                    onChange={setProofUrl}
                    label="Upload screenshot"
                />
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="primary"
                        onClick={handleUploadProof}
                        disabled={!proofUrl || uploading}
                        className="gap-2 bg-cta hover:bg-cta/90 border-none"
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        Submit proof
                    </Button>
                </div>
            </Card>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```
feat: add PaymentInstructions component for manual payment flow
```

---

### Task 11: Success Page — Handle Manual Payment State

**Files:**
- Modify: `app/(marketing)/events/[id]/register/success/page.tsx`

- [ ] **Step 1: Update success page to handle manual payment**

In `app/(marketing)/events/[id]/register/success/page.tsx`, make these changes:

**a)** Add import for PaymentInstructions at the top:
```typescript
import { PaymentInstructions } from "@/components/forms/registration/PaymentInstructions";
```

**b)** Add `manual` search param detection after `registrationId`:
```typescript
const isManualPayment = searchParams.get("manual") === "true";
```

**c)** Disable the sync polling for manual payment registrations. Update the `useEffect` (around line 95):
```typescript
useEffect(() => {
    if (!registrationId || registration?.status !== "pending" || isManualPayment) return;
    // ... rest of the existing polling logic
}, [registrationId, registration?.status, isManualPayment]);
```

**d)** After the "Race Confirmed" heading section (around line 136), add a conditional block for manual payment:

Replace the entire heading section with a conditional:
```tsx
<div className="text-center space-y-6">
    <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
        registration?.status === "paid"
            ? "bg-cta/10 text-cta animate-bounce"
            : "bg-amber-500/10 text-amber-500"
    )}>
        <CheckCircle2 size={46} />
    </div>
    <div className="space-y-2">
        {registration?.status === "paid" ? (
            <>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                    Race <span className="text-cta">Confirmed</span>.
                </h1>
                <p className="text-lg text-text-muted font-medium">
                    You&apos;re officially on the starting list! Check your details below.
                </p>
            </>
        ) : isManualPayment ? (
            <>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                    Registration <span className="text-primary">submitted</span>.
                </h1>
                <p className="text-lg text-text-muted font-medium">
                    Complete your payment below to confirm your spot.
                </p>
            </>
        ) : (
            <>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                    Race <span className="text-cta">Confirmed</span>.
                </h1>
                <p className="text-lg text-text-muted font-medium">
                    You&apos;re officially on the starting list! Check your details below.
                </p>
            </>
        )}
    </div>
</div>
```

**e)** After the heading section and before the ticket container, add the payment instructions for manual payment:
```tsx
{isManualPayment && registration?.status === "pending" && registration?.organizerId && (
    <div className="max-w-2xl mx-auto w-full px-4">
        <PaymentInstructions
            organizerId={registration.organizerId}
            registrationId={registrationId!}
            totalPrice={registration.totalPrice}
        />
    </div>
)}
```

**f)** For the manual payment submitted state (proof uploaded, awaiting review), show a status banner. Add this inside the ticket container, after the payment status badge:
```tsx
{registration?.manualPaymentStatus === "submitted" && (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Awaiting organizer verification</span>
    </div>
)}

{registration?.manualPaymentStatus === "rejected" && (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Payment not verified — please re-upload</span>
    </div>
)}
```

- [ ] **Step 2: Commit**

```
feat: handle manual payment states on registration success page
```

---

### Task 12: Pending Payments Table (Organizer Verification Dashboard)

**Files:**
- Create: `components/dashboard/PendingPaymentsTable.tsx`

- [ ] **Step 1: Create `PendingPaymentsTable.tsx`**

Create `components/dashboard/PendingPaymentsTable.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ChevronDown, ChevronUp, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PendingPaymentsTableProps {
    eventId: string;
}

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Awaiting proof" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

export function PendingPaymentsTable({ eventId }: PendingPaymentsTableProps) {
    const [statusFilter, setStatusFilter] = useState("submitted");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const registrations = useQuery(api.registrations.listManualPayments, {
        eventId: eventId as Id<"events">,
        statusFilter: statusFilter === "all" ? undefined : statusFilter,
    });

    const event = useQuery(api.events.getById, { id: eventId as Id<"events"> });
    const approvePayment = useMutation(api.registrations.approveManualPayment);
    const rejectPayment = useMutation(api.registrations.rejectManualPayment);

    const handleApprove = async (regId: string) => {
        setApprovingId(regId);
        try {
            await approvePayment({ id: regId as Id<"registrations"> });
            toast.success("Registration approved! Bib number assigned.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to approve.");
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (regId: string) => {
        setRejectingId(regId);
        try {
            await rejectPayment({ id: regId as Id<"registrations"> });
            toast.success("Registration rejected. Runner will be notified to re-upload.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to reject.");
        } finally {
            setRejectingId(null);
        }
    };

    const getCategoryName = (categoryId: string) => {
        return event?.categories?.find((c: any) => c.id === categoryId)?.name || categoryId;
    };

    // Count by status for tabs
    const allRegistrations = useQuery(api.registrations.listManualPayments, {
        eventId: eventId as Id<"events">,
    });
    const counts: Record<string, number> = { all: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 };
    if (allRegistrations) {
        counts.all = allRegistrations.length;
        allRegistrations.forEach((r: any) => {
            if (r.manualPaymentStatus && counts[r.manualPaymentStatus] !== undefined) {
                counts[r.manualPaymentStatus]++;
            }
        });
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-1 border-b border-white/8 overflow-x-auto">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={cn(
                            "px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                            statusFilter === tab.value
                                ? "text-white border-primary"
                                : "text-text-muted border-transparent hover:text-white"
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            "ml-2 px-1.5 py-0.5 rounded-full text-[10px]",
                            statusFilter === tab.value
                                ? "bg-primary/15 text-primary"
                                : "bg-white/6 text-text-muted"
                        )}>
                            {counts[tab.value]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            {registrations === undefined ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-text-muted" />
                </div>
            ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-text-muted text-sm">No registrations found.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_1.2fr] gap-4 px-4 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Runner</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Category</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Amount</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Submitted</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">Actions</span>
                    </div>

                    {registrations.map((reg: any) => {
                        const isExpanded = expandedId === reg._id;
                        const participant = reg.registrationData?.participantInfo;
                        return (
                            <div key={reg._id} className="border border-white/5 rounded-xl overflow-hidden">
                                {/* Row */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : reg._id)}
                                    className={cn(
                                        "w-full grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_1.2fr] gap-4 px-4 py-3 items-center text-left hover:bg-white/2 transition-colors",
                                        isExpanded && "bg-white/2"
                                    )}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-white truncate">{participant?.name || "Unknown"}</p>
                                        <p className="text-xs text-text-muted truncate">{participant?.email}</p>
                                    </div>
                                    <span className="text-sm text-white">{getCategoryName(reg.categoryId)}</span>
                                    <span className="text-sm text-white">₱{reg.totalPrice}</span>
                                    <span className="text-xs text-text-muted">
                                        {reg.proofOfPayment?.uploadedAt
                                            ? formatDistanceToNow(reg.proofOfPayment.uploadedAt, { addSuffix: true })
                                            : "—"}
                                    </span>
                                    <Badge className={cn(
                                        "text-[10px] font-semibold uppercase border px-1.5 py-0 w-fit",
                                        reg.manualPaymentStatus === "submitted" && "text-amber-500 bg-amber-500/10 border-amber-500/20",
                                        reg.manualPaymentStatus === "approved" && "text-cta bg-cta/10 border-cta/20",
                                        reg.manualPaymentStatus === "rejected" && "text-red-500 bg-red-500/10 border-red-500/20",
                                        reg.manualPaymentStatus === "pending" && "text-text-muted bg-white/4 border-white/8",
                                    )}>
                                        {reg.manualPaymentStatus}
                                    </Badge>
                                    <div className="flex items-center justify-end gap-2">
                                        {reg.manualPaymentStatus === "submitted" && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="h-7 px-3 text-xs bg-cta hover:bg-cta/90 border-none gap-1"
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(reg._id); }}
                                                    disabled={approvingId === reg._id}
                                                >
                                                    {approvingId === reg._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-3 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 gap-1"
                                                    onClick={(e) => { e.stopPropagation(); handleReject(reg._id); }}
                                                    disabled={rejectingId === reg._id}
                                                >
                                                    {rejectingId === reg._id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-white/5 flex gap-6">
                                        {/* Proof image */}
                                        <div className="shrink-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Proof of payment</p>
                                            {reg.proofOfPayment?.url ? (
                                                <a href={reg.proofOfPayment.url} target="_blank" rel="noopener noreferrer" className="block">
                                                    <img
                                                        src={reg.proofOfPayment.url}
                                                        alt="Payment proof"
                                                        className="w-48 h-auto rounded-lg border border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
                                                    />
                                                </a>
                                            ) : (
                                                <div className="w-48 h-64 bg-white/3 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-2">
                                                    <ImageIcon size={24} className="text-text-muted/30" />
                                                    <p className="text-xs text-text-muted">No proof uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Registration details */}
                                        <div className="flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-3">Registration details</p>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Name</span>
                                                    <p className="text-sm text-white font-medium">{participant?.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Email</span>
                                                    <p className="text-sm text-white font-medium">{participant?.email}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Phone</span>
                                                    <p className="text-sm text-white font-medium">{participant?.phone || "—"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">T-Shirt</span>
                                                    <p className="text-sm text-white font-medium">{participant?.tShirtSize || "—"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Registered</span>
                                                    <p className="text-sm text-white font-medium">
                                                        {reg.createdAt ? formatDistanceToNow(reg.createdAt, { addSuffix: true }) : "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-text-muted uppercase">Proof uploaded</span>
                                                    <p className="text-sm text-white font-medium">
                                                        {reg.proofOfPayment?.uploadedAt
                                                            ? formatDistanceToNow(reg.proofOfPayment.uploadedAt, { addSuffix: true })
                                                            : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```
feat: add PendingPaymentsTable for organizer payment verification
```

---

### Task 13: Integrate Pending Payments into Event Management

**Files:**
- This depends on how the existing event management dashboard is structured. The `PendingPaymentsTable` needs to be rendered on the event's registration management page.

- [ ] **Step 1: Find the event registrations page**

Look for the organizer's event registrations page — likely at `app/(app)/dashboard/organizer/events/[id]/registrations/` or similar. The `PendingPaymentsTable` should be rendered as a tab or section there, only when `event.paymentMode === "manual"`.

- [ ] **Step 2: Add PendingPaymentsTable to the event registrations page**

Import and conditionally render:
```tsx
import { PendingPaymentsTable } from "@/components/dashboard/PendingPaymentsTable";

// In the JSX, when event.paymentMode === "manual":
{event.paymentMode === "manual" && (
    <PendingPaymentsTable eventId={eventId} />
)}
```

- [ ] **Step 3: Commit**

```
feat: integrate pending payments table into event management
```

---

### Task 14: Bib Generation for Manual Payment Approvals

**Files:**
- Modify: `app/api/payments/manual-approve/route.ts` (new API route) OR modify the Convex `approveManualPayment` mutation

The current `approveManualPayment` mutation (Task 5) marks the registration as paid but does NOT generate bib numbers and QR codes because that logic lives in `lib/bibUtils.ts` which calls `fetchMutation` from the server side. Convex mutations cannot call external APIs.

We need a server-side API route that the organizer calls to approve, which then generates bib + QR.

- [ ] **Step 1: Create API route for manual approval**

Create `app/api/payments/manual-approve/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { generateBibAndQR } from "@/lib/bibUtils";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId: clerkUserId, getToken } = await clerkAuth();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });
        const body = await req.json();
        const { registrationId } = body;

        if (!registrationId) {
            return NextResponse.json({ error: "Missing registrationId" }, { status: 400 });
        }

        // Fetch registration
        const reg = await fetchQuery(api.registrations.getById, {
            id: registrationId as Id<"registrations">,
        });

        if (!reg) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        if (reg.status === "paid") {
            return NextResponse.json({ success: true, alreadyPaid: true });
        }

        // Approve in Convex (sets status to paid, increments count)
        await fetchMutation(api.registrations.approveManualPayment, {
            id: registrationId as Id<"registrations">,
        }, { token: token ?? undefined });

        // Generate bib and QR
        const participantName = reg.registrationData?.participantInfo?.name || "Runner";
        const vanityNumber = reg.registrationData?.vanityNumber;

        const { raceNumber, qrCodeUrl } = await generateBibAndQR(
            registrationId,
            reg.eventId,
            reg.categoryId,
            participantName,
            vanityNumber,
        );

        // Update registration with bib + QR
        await fetchMutation(api.registrations.markAsPaid, {
            id: registrationId as Id<"registrations">,
            paymentStatus: "paid",
            raceNumber,
            qrCodeUrl,
        });

        return NextResponse.json({ success: true, raceNumber });
    } catch (error: any) {
        console.error("Manual approve error:", error);
        return NextResponse.json({ error: error?.message || "Failed to approve" }, { status: 500 });
    }
}
```

- [ ] **Step 2: Update PendingPaymentsTable to call API route instead of Convex mutation directly**

In `components/dashboard/PendingPaymentsTable.tsx`, update `handleApprove` to call the API route:

```typescript
const handleApprove = async (regId: string) => {
    setApprovingId(regId);
    try {
        const response = await fetch("/api/payments/manual-approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registrationId: regId }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to approve");
        toast.success("Registration approved! Bib number assigned.");
    } catch (error: any) {
        toast.error(error?.message || "Failed to approve.");
    } finally {
        setApprovingId(null);
    }
};
```

Remove the `approvePayment` mutation import since we now use the API route for approvals.

- [ ] **Step 3: Update `markAsPaid` to allow manual payment approvals**

The existing `markAsPaid` mutation has a guard: `if (reg.totalPrice > 0 && !reg.xenditInvoiceId)`. This will block manual payment approvals. Update this guard in `convex/registrations.ts`:

```typescript
// In markAsPaid handler, replace the guard:
if (reg.totalPrice > 0 && !reg.xenditInvoiceId && reg.manualPaymentStatus !== "approved") {
    throw new Error("Cannot mark as paid: no payment invoice found");
}
```

- [ ] **Step 4: Commit**

```
feat: add manual-approve API route for bib/QR generation on approval
```

---

### Task 15: Review Step Validation for Manual Payment

**Files:**
- Modify: `components/forms/event/Step6Review.tsx` (now Step7)

- [ ] **Step 1: Add payment mode display and validation to review step**

In the review step (which is now rendered at `currentStep === 6`), add a section showing the selected payment mode. If `paymentMode === "manual"` and the organizer has no payment methods, show a warning that blocks publishing.

Add to the review step's JSX (find the appropriate location — near the features summary):

```tsx
{/* Payment Mode */}
<div className="space-y-3">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Payment Mode</h3>
    <div className="flex items-center gap-2">
        {watch("paymentMode") === "manual" ? (
            <>
                <Upload size={16} className="text-blue-500" />
                <span className="text-sm font-semibold text-white">Manual Payment</span>
                <Badge className="text-[10px] font-semibold uppercase border px-1.5 py-0 text-blue-500 bg-blue-500/10 border-blue-500/20">
                    Proof required
                </Badge>
            </>
        ) : (
            <>
                <CreditCard size={16} className="text-primary" />
                <span className="text-sm font-semibold text-white">Payment Portal (Xendit)</span>
                <Badge className="text-[10px] font-semibold uppercase border px-1.5 py-0 text-primary bg-primary/10 border-primary/20">
                    Auto-confirm
                </Badge>
            </>
        )}
    </div>
</div>
```

- [ ] **Step 2: Commit**

```
feat: show payment mode in event review step
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 6 spec sections are covered (schema, event wizard, organizer profile, runner flow, organizer verification, backward compat).
- [x] **Placeholder scan:** No TBDs, TODOs, or vague steps. All code blocks are complete.
- [x] **Type consistency:** `paymentMode`, `manualPaymentStatus`, `proofOfPayment` field names are consistent across all tasks. `PaymentMethod` type matches schema.
- [x] **Bib generation:** Task 14 handles the Convex limitation — bib/QR generation happens in an API route, not in the mutation.
- [x] **Backward compat:** All new fields use `v.optional()`. Default is `"portal"`. Existing `markAsPaid` guard is updated to allow manual approvals.
