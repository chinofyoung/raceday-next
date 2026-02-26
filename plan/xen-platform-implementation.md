# xenPlatform Integration — Automated Organizer Payouts

## Goal

Enable automated payouts for organizers on the RaceDay platform using Xendit's xenPlatform (Managed sub-accounts). When a runner pays for an event registration, a **5% processing fee** is added on top of the registration price at checkout — this goes to the platform. The organizer receives the **exact event price** they set. The organizer can view their balance and request payouts directly from their dashboard.

---

## Revenue Model

```
Runner pays:  Event Price + 5% Processing Fee
Organizer gets: Event Price (exact)
Platform keeps: 5% Processing Fee
```

- The **5% rate is configurable** by the super admin via a `platformSettings` Firestore document
- The fee is shown as a separate line item on the Xendit invoice
- Free events (price = 0) incur no processing fee

---

## Background & Current State

### What exists today

| Layer | Current State |
|:---|:---|
| **Organizer Application** | 5-step form (`Organization → Contact → Location → Verification → Review`) in `become-organizer/page.tsx`. Uses `react-hook-form` + `zod`. |
| **Types** | `OrganizerApplication` in `types/user.ts` — has `governmentId`, `organizerTIN`, `dtiSecRegistration`, but **no bank details** or xenPlatform fields. |
| **Payment Flow** | Runner pays via Xendit Invoice (`api/payments/create-checkout`). `totalAmount = basePrice + vanityPremium`. **No platform fee yet.** Webhook at `api/payments/webhook` confirms payment. |
| **Dashboard** | `OrganizerView` shows stats, revenue breakdown, kit fulfillment, and registration feed. Revenue is **display-only** (no balance/payout functionality). |
| **Xendit Integration** | Single API key in `.env.local` (`XENDIT_SECRET_KEY`). Uses Invoice API for checkouts and callback token for webhooks. No xenPlatform sub-accounts. |
| **Admin Panel** | Super admin pages at `/dashboard/admin/` for users, events, applications, analytics, logs. **No platform settings page.** |

### What's missing

1. **KYC & Bank data collection** — No bank details or KYC selfie captured in the organizer form
2. **Processing fee** — No platform fee added at checkout
3. **Admin settings** — No global config for fee percentage
4. **xenPlatform sub-account creation** — No API route to create a Xendit Managed sub-account
5. **Balance tracking** — No mechanism to track organizer earnings or available balance
6. **Payout request flow** — No UI or API for organizers to request payouts
7. **Revenue splitting** — Webhook doesn't split payment to organizer sub-accounts

---

## Proposed Changes

### Phase 1: Types & Schemas

#### [MODIFY] [user.ts](file:///Users/chinoyoung/Code/raceday-next/types/user.ts)

Add bank details and xenPlatform fields to the `OrganizerApplication` interface:

```typescript
// New fields on OrganizerApplication
bankDetails: {
    bankCode: string;          // e.g. "BDO", "BPI", "GCASH"
    accountHolderName: string; // Must match legal name
    accountNumber: string;
};
selfieWithIdUrl?: string;      // Cloudinary URL of selfie holding ID

// xenPlatform tracking (populated by backend after approval)
xenditAccountId?: string;      // Xendit sub-account ID
xenditKycStatus?: "pending" | "verified" | "failed";
```

Add the same `bankDetails` to the `User.organizer` interface for approved organizers.

---

#### [MODIFY] [organizer.ts](file:///Users/chinoyoung/Code/raceday-next/lib/validations/organizer.ts)

Extend validation schemas:

- Add a **new Step 5 schema** (`organizerStep5Schema`) for bank details:
  - `bankDetails.bankCode` — required, enum of PH banks
  - `bankDetails.accountHolderName` — required, min 3 chars
  - `bankDetails.accountNumber` — required, min 6 chars
  - `selfieWithIdUrl` — required, valid URL (Cloudinary upload)
- Merge the new schema into `fullOrganizerSchema`

---

### Phase 2: Organizer Application Form

#### [MODIFY] [page.tsx](file:///Users/chinoyoung/Code/raceday-next/app/(app)/dashboard/become-organizer/page.tsx)

Update the `STEPS` array to add a 6th step:

```
1. Organization → 2. Contact → 3. Location → 4. Verification → 5. Payout Setup → 6. Review
```

Reindex the Review step from `5 → 6`.

---

#### [NEW] [Step5PayoutSetup.tsx](file:///Users/chinoyoung/Code/raceday-next/app/(app)/dashboard/become-organizer/components/Step5PayoutSetup.tsx)

New form step component collecting:

- **Bank dropdown** — Curated list of PH banks (BDO, BPI, Metrobank, UnionBank, GCash, Maya, etc.)
- **Account Holder Name** — text input
- **Account Number** — text input
- **Selfie with ID** — Cloudinary upload widget (reuse existing upload pattern from Step4)

> [!IMPORTANT]
> The account holder name must match the organizer's legal name. We should show a validation hint in the UI.

---

#### [MODIFY] [OrganizerFormSummary.tsx](file:///Users/chinoyoung/Code/raceday-next/app/(app)/dashboard/become-organizer/components/OrganizerFormSummary.tsx)

Add a new section to display the bank/payout details in the Review step.

---

### Phase 3: API Routes

#### [NEW] [route.ts](file:///Users/chinoyoung/Code/raceday-next/app/api/xendit/create-sub-account/route.ts)

Server-side route to create a Xendit Managed sub-account after admin approves an organizer:

- Called internally when admin approves an application
- Sends `POST` to Xendit's `POST /v2/accounts` with:
  - `email`, `type: "MANAGED"`, `business_profile`
- Stores the returned `xenditAccountId` on the organizer's user record
- Submits KYC documents via Xendit's KYC API

---

#### [NEW] [route.ts](file:///Users/chinoyoung/Code/raceday-next/app/api/xendit/balance/route.ts)

Authenticated route for organizers to check their balance:

- Verifies the session belongs to an approved organizer
- Calls Xendit's `GET /balance` with the organizer's sub-account header (`for-user-id`)
- Returns `{ available_balance, pending_balance }` to the frontend

---

#### [NEW] [route.ts](file:///Users/chinoyoung/Code/raceday-next/app/api/xendit/request-payout/route.ts)

Authenticated route for organizers to request a payout:

- Validates request body (amount, destination bank)
- Ensures requested amount <= available balance
- Calls Xendit's Disbursement/Payout API with the organizer's sub-account and bank details
- Creates a `payoutRequests` document in Firebase for audit trail
- Returns payout status to frontend

---

#### [NEW] [route.ts](file:///Users/chinoyoung/Code/raceday-next/app/api/xendit/payout-webhook/route.ts)

Webhook endpoint for payout status updates from Xendit:

- Validates callback token
- Updates the corresponding `payoutRequests` document status (`processing -> completed / failed`)

---

### Phase 4: Processing Fee & Checkout Updates

#### [NEW] `platformSettings` Firestore document (collection: `settings`, doc ID: `platform`)

```typescript
{
  processingFeePercent: 5,     // default 5%
  minimumPayoutAmount: 500,    // PHP
  updatedAt: Timestamp,
  updatedBy: string            // admin userId
}
```

#### [MODIFY] [route.ts](file:///Users/chinoyoung/Code/raceday-next/app/api/payments/create-checkout/route.ts)

Update the checkout flow to add the processing fee:

1. **Fetch `platformSettings`** from Firestore to get current `processingFeePercent` (default 5%)
2. **Calculate fee**: `processingFee = Math.round(totalAmount * processingFeePercent / 100)`
3. **New total**: `chargeAmount = totalAmount + processingFee`
4. **Add fee as a line item** on the Xendit invoice:
   ```typescript
   items: [
     { name: "Base Fee: 5K Run", price: 500, quantity: 1 },
     { name: "Processing Fee (5%)", price: 25, quantity: 1, category: "Platform Fee" },
   ]
   ```
5. **Store fee data** on the registration document: `{ processingFee, processingFeePercent, organizerAmount: totalAmount }`

#### [MODIFY] Registration UI (checkout summary)

Update the registration form's price summary to show the fee breakdown:
```
Registration Fee:    ₱500.00
Processing Fee (5%): ₱ 25.00
─────────────────────────────
Total:               ₱525.00
```

---

### Phase 5: Payment Webhook Update

#### [MODIFY] [route.ts](file:///Users/chinoyoung/Code/raceday-next/app/api/payments/webhook/route.ts)

When a runner's payment is confirmed (status `PAID`/`SETTLED`):

1. Look up the event's organizer
2. If the organizer has a `xenditAccountId`, create a Transfer of `organizerAmount` (registration price, excluding platform fee) to their sub-account
3. Record the transfer in the `organizerTransactions` collection
4. The platform fee stays in the main account automatically

---

### Phase 6: Super Admin — Platform Settings

#### [NEW] [settings/page.tsx](file:///Users/chinoyoung/Code/raceday-next/app/(app)/dashboard/admin/settings/page.tsx)

New admin page for global platform configuration:

- **Processing Fee %** — number input (default: 5, min: 0, max: 30)
- **Minimum Payout Amount** — number input (default: ₱500)
- Save button that updates the `settings/platform` Firestore doc
- Show last updated timestamp and by whom

---

### Phase 7: Organizer Dashboard — Balance & Payouts

#### [MODIFY] [OrganizerView.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/OrganizerView.tsx)

Add a new **"Wallet"** tab to the existing tab navigation (alongside Overview, Events, Participants):

```typescript
const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "events", label: "Events", icon: CalendarDays },
    { id: "participants", label: "Participants", icon: Users },
    { id: "wallet", label: "Wallet", icon: Wallet },      // NEW
] as const;
```

---

#### [NEW] [OrganizerWallet.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/organizer/OrganizerWallet.tsx)

New component rendered under the "Wallet" tab. Contains:

**Balance Card:**
- Available Balance (large prominent display)
- Pending Balance (smaller, secondary)
- "Request Payout" CTA button

**Payout Request Modal:**
- Amount input with "Max" button
- Bank destination (pre-filled from profile, editable)
- Confirmation step with fee breakdown
- Submit button with loading state

**Transaction History:**
- Filterable list of transactions (incoming registrations, outgoing payouts)
- Each row shows: date, type (Registration / Payout), event name, amount, status badge
- Pagination or infinite scroll

**Payout History:**
- List of past payout requests with status (Processing, Completed, Failed)
- Expandable details showing bank info and Xendit reference

---

#### [NEW] [OrganizerBalanceCard.tsx](file:///Users/chinoyoung/Code/raceday-next/components/dashboard/organizer/OrganizerBalanceCard.tsx)

Standalone balance summary card that can also be shown in the Overview tab's stats grid. Shows:
- Available balance as a prominent number
- Small "View Wallet" link

---

### Phase 6: Firestore Collections

#### [NEW] `payoutRequests` collection

```
{
    id: string
    organizerId: string
    xenditAccountId: string
    amount: number
    bankCode: string
    accountNumber: string
    accountHolderName: string
    status: "pending" | "processing" | "completed" | "failed"
    xenditPayoutId?: string
    createdAt: Timestamp
    completedAt?: Timestamp
    failureReason?: string
}
```

#### [NEW] `organizerTransactions` collection

```
{
    id: string
    organizerId: string
    eventId: string
    registrationId: string
    type: "registration_income" | "payout" | "platform_fee"
    amount: number
    status: "completed" | "pending"
    createdAt: Timestamp
    metadata?: { runnerName, categoryName, payoutRef }
}
```

---

## User Review Required

> [!WARNING]
> **KYC Timing**: Xendit KYC verification can take 1-3 business days. We should:
> - Allow organizers to start using the platform immediately after admin approval
> - Show a "KYC Pending" state on the Wallet tab until Xendit verifies them
> - **Block payout requests** until KYC is verified (balance can still accumulate)

---

## Verification Plan

### Manual Verification

Since the project has no existing test suite, verification will be manual:

1. **Organizer Application Form**
   - Navigate to `/dashboard/become-organizer`
   - Complete Steps 1-4 as before
   - Verify new Step 5 (Payout Setup) appears with bank dropdown, account holder, account number, and selfie upload
   - Verify Review step (now Step 6) shows the bank details section
   - Submit and confirm data is saved to Firestore

2. **Dashboard Wallet Tab**
   - Log in as an approved organizer
   - Navigate to `/dashboard`
   - Verify the "Wallet" tab appears in the tab navigation
   - Click the Wallet tab and verify the Balance Card displays (with P0.00 initially)
   - Verify the payout request button and transaction history render correctly

3. **Balance API**
   - As an approved organizer, open the Wallet tab
   - Verify the balance loads from the API without errors
   - Verify the balance card updates correctly

4. **Payout Request Flow** *(requires Xendit test mode)*
   - Create a test payout request
   - Verify the request appears in the Payout History
   - Verify the Firestore `payoutRequests` document is created

5. **End-to-End Runner Payment to Organizer Balance**
   - As a runner, register for an organizer's event and complete payment
   - Verify the webhook processes and creates a transaction in `organizerTransactions`
   - Log in as the organizer and verify the balance has increased

> [!NOTE]
> Steps 3-5 require Xendit test/sandbox API keys to be configured. The user should verify these flows in the Xendit test environment before going to production.

### Browser-Based Verification

After implementation, we will use the browser tool to:
- Navigate through the updated organizer application form
- Verify the new Wallet tab renders correctly on the dashboard
- Screenshot the balance card and payout request modal for review
