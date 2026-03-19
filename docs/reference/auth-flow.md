# Authentication & Authorization Reference

Complete reference for the RaceDay auth stack: how identity flows from Clerk through Convex, how users are synced and stored, and how roles and permissions are enforced across the app.

---

## 1. Auth Stack

Three layers work together:

| Layer | Responsibility |
|---|---|
| **Clerk** | Identity provider. Manages OAuth sessions, JWTs, and user identity. |
| **Convex** | Data layer. Stores the canonical user record, role, and all app-specific fields. |
| **Custom hooks / providers** | Bridge the two layers and expose a unified auth surface to the UI. |

Clerk is the source of truth for *who the user is*. Convex is the source of truth for *what role and data the user has*.

---

## 2. Provider Setup

The provider hierarchy is established in `components/providers/ConvexClientProvider.tsx`:

```
ClerkProvider (dark theme)
  └── ConvexProviderWithClerk (client, useAuth)
        ├── UserSync          ← renders null, runs the sync side-effect
        └── {children}
              └── AuthProvider  ← wraps (app) subtree, exposes AuthContext
```

**ClerkProvider** (`@clerk/nextjs`) — wraps the entire app with Clerk's session context and applies the dark base theme.

**ConvexProviderWithClerk** (`convex/react-clerk`) — bridges Clerk and Convex. It passes Clerk's `useAuth` hook to Convex so that every Convex query and mutation automatically carries the current Clerk JWT. A new Convex `ConvexReactClient` is instantiated once at module level using `NEXT_PUBLIC_CONVEX_URL`.

**UserSync** — a render-null component that lives inside `ConvexProviderWithClerk`. On mount, when `isLoaded && user` are both truthy, it fires `api.users.syncUser` exactly once per session (guarded by a `useRef` flag). This is what creates or updates the Convex user record after every sign-in.

**AuthProvider** — wraps the `(app)` route group. It calls `useAuth` (the custom hook, not Clerk's) and puts `{ user, loading, role, refreshUser }` into `AuthContext`. Components throughout the app read this via `useAuthContext()`.

---

## 3. User Sync Flow

**File:** `components/providers/UserSync.tsx`

Triggered once per authenticated session, immediately after Clerk reports the user as loaded.

```
Clerk session loads
  → useUser() returns { user, isLoaded: true }
  → useEffect fires (guarded by syncedRef to prevent double-fire)
  → calls api.users.syncUser with:
      uid:         user.id          (Clerk user ID)
      email:       primaryEmailAddress
      displayName: fullName | username | "User"
      photoURL:    imageUrl
```

**What syncUser does** (`convex/users.ts`):

1. Verifies `ctx.auth.getUserIdentity()` — the request must be authenticated. The only exception is an internal migration path that accepts a `CONVEX_ADMIN_SECRET`.
2. Queries the `users` table by the `by_uid` index.
3. **If the user exists:** patches `email`, `displayName`, `photoURL`, and `updatedAt`. The `role` field is never overwritten by sync.
4. **If the user is new:** inserts a full record with role `"runner"`, `profileCompletion: 15`, and a default Philippine address skeleton.

The `role` field is intentionally immutable from the sync path — it can only be changed by the `updateRole` mutation (admin only).

---

## 4. useAuth Hook

**File:** `lib/hooks/useAuth.ts`

```ts
const { user, clerkUser, loading, role, signOut, refreshUser } = useAuth();
```

| Return value | Source | Type |
|---|---|---|
| `user` | `api.users.current` (Convex reactive query) | `User \| null` |
| `clerkUser` | Clerk `useUser()` | Clerk `UserResource \| null` |
| `loading` | Derived (see below) | `boolean` |
| `role` | `convexUser?.role` | `"runner" \| "organizer" \| "admin" \| null` |
| `signOut` | Clerk `useClerk().signOut` | function |
| `refreshUser` | No-op (Convex queries are reactive) | `async () => void` |

**Loading state logic:**

```ts
const loading = !clerkLoading || (!!clerkUser && convexUser === undefined);
```

`loading` is `true` in two cases:
- Clerk has not finished initialising (`!clerkLoading` — note: `isLoaded` is the Clerk flag, so `!clerkLoading` means Clerk is still loading).
- Clerk has loaded and there is a user, but the Convex query has not yet returned (convexUser is `undefined`).

Once Convex returns `null` (no Convex record) or a user object, loading becomes `false`.

**api.users.current** — the Convex query that backs `user`. It calls `ctx.auth.getUserIdentity()` and returns the matching row from the `users` table. Returns `null` for unauthenticated callers.

---

## 5. Login Flow

**Only Google OAuth is supported.** There is no email/password login.

**Route:** `app/auth/login/[[...index]]/page.tsx`

### Step-by-step

1. User lands on `/auth/login`. The page reads the `?redirect` query param.
2. Open redirect protection: `redirectTo` is set to the `redirect` value only if it starts with `/` and does not start with `//` or contain `://`. Otherwise it defaults to `/dashboard`.
3. User clicks "Continue with Google".
4. `signIn.authenticateWithRedirect` is called with:
   - `strategy: "oauth_google"`
   - `redirectUrl: "/auth/sso-callback"` — where Clerk sends the OAuth callback
   - `redirectUrlComplete: redirectTo` — where Clerk redirects after the callback completes
5. Clerk redirects to Google for OAuth consent.
6. Google redirects back to `/auth/sso-callback`.
7. **SSO Callback** (`app/auth/sso-callback/page.tsx`) renders `<AuthenticateWithRedirectCallback />`, which Clerk uses to complete the session handshake. A 10-second timeout shows a "Try again" link if the handshake stalls.
8. On success, Clerk redirects to `redirectUrlComplete` (the original destination or `/dashboard`).
9. `ConvexProviderWithClerk` detects the new session, and `UserSync` fires `syncUser` to create or update the Convex user record.

---

## 6. Route Protection

**File:** `app/(app)/layout.tsx`

All routes under the `(app)` group are protected by this layout. It uses the custom `useAuth` hook (not Clerk middleware directly).

```
auth state    | action
--------------|-------------------------------------------
loading       | render spinner (full-screen, centered)
no clerkUser  | render "Redirecting..." + router.replace()
clerkUser ok  | render children
```

The redirect is constructed as:
```ts
`/auth/login?redirect=${encodeURIComponent(pathname)}`
```

This preserves the current path so the login page can send the user back after sign-in.

**Layout branching:** When the user is authenticated, the layout checks `pathname.startsWith("/dashboard")`. Dashboard routes skip the `Navbar` and `Footer` wrapper (the dashboard has its own chrome). All other `(app)` routes get `<Navbar>` + `<Footer>` with `pt-24` main padding.

**Middleware:** `proxy.ts` (which is actually `middleware.ts` — named `proxy.ts` in this project) uses `clerkMiddleware()` from `@clerk/nextjs/server`. It runs on all non-static routes and all API routes, making Clerk session data available server-side. However, it does not enforce redirects itself — route protection is handled client-side in the layout.

---

## 7. Role System

### Roles

Defined in `types/user.ts`:

```ts
type UserRole = "runner" | "organizer" | "admin";
```

| Role | Description | Default |
|---|---|---|
| `runner` | Standard user. Can register for events, view their registrations. | Yes — assigned on first sync |
| `organizer` | Approved event organizer. Can create and manage events, invite volunteers. | No — requires application + admin approval |
| `admin` | Platform administrator. Full access to all data, user management, role assignment. | No — manually assigned |

### UI-side checks

Components read role from `useAuthContext()` or `useAuth()`:

```ts
const { role } = useAuthContext();

if (role === "organizer" || role === "admin") {
  // show organizer dashboard controls
}
```

Conditional rendering hides or shows UI sections. It does not prevent direct URL access — that is enforced by the backend.

### Backend enforcement

Every Convex mutation and query that requires authorization calls `ctx.auth.getUserIdentity()` and then looks up the requester's role in the `users` table:

```ts
// Pattern used throughout convex/users.ts and other modules
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");

const requester = await ctx.db
    .query("users")
    .withIndex("by_uid", (q) => q.eq("uid", identity.subject))
    .unique();

if (!requester || requester.role !== "admin") throw new Error("Forbidden");
```

`identity.subject` is the Clerk user ID (`uid`). The `by_uid` index is the primary lookup path for all auth checks.

**Role-gated mutations:**

| Mutation | Required role |
|---|---|
| `users.list` | admin |
| `users.updateRole` | admin |
| `users.updateDashboardLayout` | organizer or admin |

---

## 8. Organizer Approval

### Application flow

**Route:** `/dashboard/become-organizer` (`app/(app)/dashboard/become-organizer/page.tsx`)

The form is a 5-step wizard validated with `react-hook-form` + Zod (`lib/validations/organizer`):

| Step | Content |
|---|---|
| 1 — Organization | Org name, org type (`individual \| sports_club \| business \| lgu \| school \| nonprofit`), description |
| 2 — Contact | Contact person, contact email, phone, alternate phone, website |
| 3 — Location | Philippine address (street, barangay, city, province, region, zip) |
| 4 — Verification | Government ID type + number + front image URL, optional TIN, DTI/SEC registration, business permit |
| 5 — Review | Summary of all fields before submit |

Each step is validated independently before advancing. Step 4 involves government ID document upload (stored as Cloudinary URLs before submission).

On submit, `submitOrganizerApplication` or `updateOrganizerApplication` from `lib/services/applicationService` is called with the user's `_id`. This writes to the `organizerApplications` table (queried via `api.applications.getByUserId`).

If a pending or needs-info application already exists, the page shows its current status rather than the form. The user can click "Edit My Application" to reopen the form in modify mode.

### Application statuses

```ts
status: "pending" | "approved" | "rejected" | "needs_info"
```

### Admin review

An admin reviews applications through the admin panel and calls `users.updateRole` to set the user's role to `"organizer"`. The `organizer` sub-object on the user document (name, contactEmail, phone, organizerType, approved, appliedAt, approvedAt) is populated separately via `users.updateOrganizerProfile`.

---

## 9. Volunteer Permissions

Volunteers are event-scoped, not platform-scoped. An organizer invites volunteers by email to a specific event.

### Types

**File:** `types/volunteer.ts`

```ts
type VolunteerPermission = 'kiosk' | 'participants' | 'announcements';
type VolunteerStatus = 'pending' | 'accepted' | 'revoked';
```

| Permission | Access granted |
|---|---|
| `kiosk` | Race day check-in kiosk |
| `participants` | View and manage participant list |
| `announcements` | Post event announcements |

### Volunteer record

Each `EventVolunteer` document lives in the `volunteers` collection (managed via `convex/volunteers.ts`):

```ts
{
  eventId: Id<"events">,
  email: string,          // normalized lowercase Gmail address
  uid?: string,           // Clerk user ID, set when invitation is accepted
  permissions: VolunteerPermission[],
  status: 'pending' | 'accepted' | 'revoked',
  invitedBy: string,      // organizer UID
  invitedAt: number,
  acceptedAt?: number,
  revokedAt?: number,
}
```

### Server-side permission checks

**File:** `lib/volunteerAccess.ts`

Three exported helpers, all using `React.cache` on the underlying `fetchQuery` to deduplicate calls within a single server request:

```ts
// Check if a user is an active volunteer for an event
isEventVolunteer(userId: string, eventId: string): Promise<boolean>

// Check if a user has a specific permission
hasVolunteerPermission(userId: string, eventId: string, permission: VolunteerPermission): Promise<boolean>

// Get the full permissions array
getVolunteerPermissions(userId: string, eventId: string): Promise<VolunteerPermission[]>
```

These call `api.volunteers.getByUserIdAndEvent` via `fetchQuery` (the server-side Convex client). The result is cached per-request via `React.cache`.

**Example usage** — from `app/api/events/[id]/check-access/route.ts`:

```ts
const volunteerPermissions = await getVolunteerPermissions(user._id, eventId);

return NextResponse.json({
  isOrganizer,    // event.organizerId === user._id
  isAdmin,        // user.role === "admin"
  permissions: volunteerPermissions,
});
```

---

## 10. Server-Side Auth

API routes use Clerk's server-side `auth()` helper and then exchange the Clerk session for a Convex token to make authenticated Convex queries.

### Pattern

**File:** `app/api/events/[id]/check-access/route.ts` (canonical example)

```ts
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";

export async function GET(request: NextRequest, context: ...) {
    // 1. Get Clerk session server-side
    const { userId: clerkId, getToken } = await auth();
    if (!clerkId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Exchange for a Convex-compatible JWT
    const token = await getToken({ template: "convex" });

    // 3. Use the token with fetchQuery so Convex can verify identity
    const user = await fetchQuery(
        api.users.getByUid,
        { uid: clerkId },
        { token: token ?? undefined }
    );
}
```

### How the token exchange works

`getToken({ template: "convex" })` uses a Clerk JWT template named `"convex"` that formats claims to match what Convex expects. Convex validates this token against the configured issuer in `convex/auth.config.ts`:

```ts
// convex/auth.config.ts
export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN,  // e.g. "https://clerk.raceday.com"
            applicationID: "convex",
        },
    ],
};
```

Convex uses `applicationID: "convex"` to match the JWT template name. The `domain` must match the Clerk issuer domain in `.env.local`.

### Simple API routes (no Convex calls needed)

Some routes only need to verify the user is logged in, without calling Convex:

```ts
// app/api/cloudinary/sign/route.ts
const { userId } = await clerkAuth();
if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// proceed with server-only logic (Cloudinary signature generation)
```

These routes use `auth()` from `@clerk/nextjs/server` directly and do not need `getToken`.

---

## Quick Reference: Environment Variables

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `ConvexClientProvider` — Convex client URL |
| `CLERK_JWT_ISSUER_DOMAIN` | `convex/auth.config.ts` — validates Clerk JWTs in Convex |
| `CONVEX_ADMIN_SECRET` | `users.syncUser` — allows unauthenticated migration sync |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary upload |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary upload |
| `CLOUDINARY_API_SECRET` | Server-side Cloudinary signature |
