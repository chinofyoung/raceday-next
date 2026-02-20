# Stage 1 — Security: API Hardening
**Priority:** 🔴 Critical
**Issues Fixed:** #1 (Webhook Auth), #3 (AI Rate Limiting), #4 (Console.log Leak), #29 (Webhook Idempotency)
**Files Touched:** 3
**Risk:** Low — all additive guards; no business logic changes

---

## Overview

This stage closes four security holes in the API layer. None of these changes affect the happy path for legitimate users — they only block abuse and stop sensitive data from leaking into logs.

---

## Fix 1 — Xendit Webhook Authentication + Idempotency
**Issues:** #1, #29
**File:** `app/api/payments/webhook/route.ts`

### What to change

**Step A — Uncomment and enforce the callback-token check.**

Add `XENDIT_CALLBACK_TOKEN` to `.env.local` (copy the value from the Xendit Dashboard → Webhooks settings).

```ts
// At the TOP of the POST handler, before reading the body:
const token = req.headers.get("x-callback-token");
if (!token || token !== process.env.XENDIT_CALLBACK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Step B — Add idempotency guard (#29).**

Before generating the bib and updating Firestore, check if the registration is already paid. If so, return `200` immediately (Xendit re-sends webhooks on failure).

```ts
// Inside the if (regSnap.exists()) block, BEFORE generating bib:
const regData = regSnap.data();

// Idempotency: already processed — return success without re-processing
if (regData.status === "paid") {
    console.log(`Webhook already processed for registration: ${registrationId}`);
    return NextResponse.json({ success: true });
}

// ...rest of bib generation + update
```

**Step C — Add the env var to `.env.local`:**
```
XENDIT_CALLBACK_TOKEN=your_xendit_callback_token_here
```

### Why this matters
Without the token check, any external actor can POST `{ "status": "PAID", "external_id": "<any-registration-id>" }` to your webhook endpoint and mark any registration as paid for free. This is an active fraud vector.

---

## Fix 2 — AI Endpoint: Firebase ID Token Auth + Rate Limiting
**Issue:** #3
**File:** `app/api/ai/event-suggest/route.ts`

### What to change

**Step A — Verify Firebase ID token from the request header.**

The client (Step1Basic.tsx → aiService.ts) must include the Firebase ID token in all AI requests. On the server, verify it using the Firebase Admin SDK.

**Install firebase-admin** (if not already):
```bash
npm install firebase-admin
```

**Create `lib/firebase/admin.ts`** (new file):
```ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminApp = getApps().length === 0
    ? initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    })
    : getApps()[0];

export const adminAuth = getAuth(adminApp);
```

**Add to `.env.local`:**
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
(Download service account JSON from Firebase Console → Project Settings → Service Accounts.)

**Update `app/api/ai/event-suggest/route.ts`:**
```ts
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
    // 1. Authenticate
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!idToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await adminAuth.verifyIdToken(idToken);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Rest of existing handler...
}
```

**Step B — Add simple in-memory rate limiting.**

For a low-cost solution without Redis, use an in-memory Map with a sliding window per IP:

```ts
// Module-level rate limiter (persists per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;      // max 10 requests
const WINDOW_MS = 60_000;   // per 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) return false;

    entry.count++;
    return true;
}

// Inside POST handler, after auth:
const ip = req.headers.get("x-forwarded-for") ?? "unknown";
if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

**Step C — Update `aiService.ts` to send the Firebase ID token:**
```ts
import { auth } from "@/lib/firebase/config";

async function getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
}

export async function getAISuggestions(prompt: string): Promise<AISuggestion> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ prompt, type: "complete" }),
    });
    // ...
}
```

Apply the same `getAuthHeaders()` pattern to `getAITimeline` and `improveText`.

---

## Fix 3 — Remove Payment Console.log Leaks
**Issue:** #4
**File:** `app/api/payments/create-checkout/route.ts`

### What to change

Find and replace the two `console.log` statements that dump full payment data:

**Before:**
```ts
console.log("Xendit Invoice Data:", JSON.stringify(invoiceData, null, 2));
// ...
console.log("Xendit API Raw Result:", JSON.stringify(result, null, 2));
```

**After (dev-only):**
```ts
if (process.env.NODE_ENV === "development") {
    console.log("Xendit Invoice Data:", JSON.stringify(invoiceData, null, 2));
}
// ...
if (process.env.NODE_ENV === "development") {
    console.log("Xendit API Raw Result:", JSON.stringify(result, null, 2));
}
```

Also remove or gate the webhook debug log in `app/api/payments/webhook/route.ts`:
```ts
// Before:
console.log("Webhook received:", JSON.stringify(body, null, 2));

// After:
if (process.env.NODE_ENV === "development") {
    console.log("Webhook received:", JSON.stringify(body, null, 2));
}
```

---

## Acceptance Criteria

- [ ] POST to `/api/payments/webhook` with wrong/missing `x-callback-token` returns `401`
- [ ] POST to `/api/payments/webhook` for an already-paid registration returns `200` without re-processing
- [ ] POST to `/api/ai/event-suggest` without `Authorization` header returns `401`
- [ ] POST to `/api/ai/event-suggest` more than 10 times/min from same IP returns `429`
- [ ] `XENDIT_CALLBACK_TOKEN` added to `.env.local` and Vercel env vars
- [ ] Firebase Admin service account credentials added to `.env.local` (not committed to git)
- [ ] No payment or customer data appears in production server logs

---

## Environment Variables Checklist

Add to `.env.local` and to **Vercel project settings**:
```
XENDIT_CALLBACK_TOKEN=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

> ⚠️ The Firebase private key contains literal `\n` newlines. In Vercel, paste the raw multiline value — Vercel handles it correctly. In `.env.local` wrap in double quotes with `\n` escape sequences.
