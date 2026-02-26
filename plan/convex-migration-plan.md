# Firebase to Convex Migration Plan

## 1. Overview
This migration plan details the strategies for moving `raceday-next` from Firebase to Convex. Convex will replace Firestore, Storage, and Firebase Auth to provide end-to-end type safety, real-time database capabilities, and simplified developer pipelines.

This migration follows the **Vercel React Best Practices** (skill: `vercel-react-best-practices`) especially concerning eliminating waterfalls, optimizing rendering, and bundle-size optimizations.

## 2. Authentication Strategy
Currently, Firebase Auth validates users and stores the base info, which is then mapped to the `users` Firestore collection.
- **New Approach**: Integrate **Clerk** (or **Convex Auth**). 
- **User Sync**: The authentication provider will trigger a webhook / Convex mutation upon user creation or update to sync user properties directly to the `users` table defined in Convex (`convex/users.ts`).

## 3. Database Schema Mapping
Based on current Firestore schemas in `types/user.ts` and `types/event.ts`, the new `convex/schema.ts` file will strongly type all tables using `v.*` methods.

### Proposed Schema (`convex/schema.ts`)
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    uid: v.string(), // Clerk or Convex Auth UID
    email: v.string(),
    displayName: v.string(),
    photoURL: v.optional(v.string()),
    role: v.union(v.literal("runner"), v.literal("organizer"), v.literal("admin")),
    phone: v.optional(v.string()),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("")),
    birthDate: v.optional(v.string()),
    address: v.object({
      street: v.string(),
      city: v.string(),
      province: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    profileCompletion: v.number(),
    createdAt: v.number(), // Use Unix timestamp
    updatedAt: v.number(),
  }).index("by_uid", ["uid"]).index("by_email", ["email"]),

  events: defineTable({
    organizerId: v.id("users"), // Foreign key to users
    name: v.string(),
    description: v.string(),
    date: v.number(),
    location: v.object({
      name: v.string(),
      address: v.string(),
    }),
    featuredImage: v.string(), // Consider if this remains Cloudinary or moves to Convex Storage
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed")),
    isLiveTrackingEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizer", ["organizerId"]).index("by_status", ["status"]),

  // Add tables for registrations, applications, etc.
});
```

## 4. Addressing Vercel React Best Practices
During the conversion of data fetching queries:
1. **`async-suspense-boundaries`**: Replace `useEffect` and React state for loading with `<Suspense>` wrappers around components that use Convex's `useQuery()`.
2. **`server-parallel-fetching`**: On pages requiring multiple independent queries (e.g. `api.events.list`, `api.users.current`), pre-fetch them in parallel or rely on Server Components where Convex `fetchQuery` can run concurrently.
3. **`client-swr-dedup`**: Convex automatically handles query deduplication under `useQuery`, providing built-in caching. We won't need manual deductions.
4. **`server-auth-actions`**: Ensure every Convex mutation validates user identity within the function block using `ctx.auth.getUserIdentity()`.

## 5. Storage Migration
Currently, `Cloudinary` is used for event images, but Firebase Storage might be used for other assets. Convex provides a built-in file storage system API (`storage.generateUploadUrl`).
- **Plan**: Any direct file uploads should be migrated to Convex Storage. URLs linking to Cloudinary will remain unchanged as they are simple string URLs.

## 6. Execution Steps
### Phase 1: Setup
- Install Convex: `npm install convex`
- Initialize Convex: `npx convex dev` (run side-by-side with NextJS)
- Write the schema in `convex/schema.ts` covering Users, Events, Registrations, etc.

### Phase 2: Auth Replacement
- Replace `lib/firebase/auth.ts` with Clerk/Convex Auth.
- Update `/api/auth/session` concepts if needed or remove entirely if relying on Clerk's middleware.
- Create convex mutations (e.g., `convex/users.ts:syncUser`) to handle user upsert.

### Phase 3: Service Updates (The Heavy Lift)
- Rewrite `lib/services/eventService.ts` to `convex/events.ts`. Replace Firebase SDK functions (`getDocs`, `getDoc`) with Convex queries (`ctx.db.query("events").collect()`).
- Rewrite `usePaginatedQuery` to utilize Convex's `usePaginatedQuery` functionality.
- Update all UI components to import `useQuery` or `useMutation` from `convex/react`.

### Phase 4: Data Migration
- Write an admin script (using `firebase-admin` and Convex `fetchMutation` / Next.js API Routes) to loop through all Firestore documents and create corresponding rows in Convex.
- Map old string IDs from Firestore into the script explicitly, or let Convex assign new IDs and handle relation-mapping locally in the script.

### Phase 5: Testing and Polish
- **Verification Plan**:
  - **Automated / Build Tests**: Run `npm run build` and `npm run lint` to catch typescript errors resulting from the schema changes.
  - **Manual Flow Testing**: 
    1. Register a new user using the new Auth provider.
    2. Attempt to create an Event as an organizer. Verify the corresponding mutation fires and UI updates real-time via Convex caching.
    3. Test real-time synchronization by opening two browser windows on the events page and observing state change.
- Run Vercel best practices audit over newly updated pages, particularly ensuring `Activity`/`Suspense` boundaries are correct for data fetching components.

### Phase 6: Decommission Firebase
- Uninstall `firebase`, `firebase-admin`.
- Remove `lib/firebase` and config maps from environment variables.
