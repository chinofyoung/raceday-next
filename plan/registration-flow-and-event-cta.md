# Registration Flow & Event View CTA Changes

Two feature requests: (1) gate non-logged-in users at the end of the registration flow and auto-populate their profile, and (2) replace the "Get Your Slot" CTA with a direct register link + add a mobile-only sticky CTA.

## Feature 1: Login Gate + Profile Auto-Populate

### Current Behavior
- The registration form (`RegistrationForm.tsx`) allows any visitor to complete all 5 steps (Who → Category → Details → Vanity → Review)
- On submit, `user?.uid` is passed to the API — if `null`, the registration quietly fails or creates orphaned data
- No login prompt exists in the registration flow

### Proposed Changes

---

#### Registration Components

##### [MODIFY] [RegistrationForm.tsx](file:///c:/Users/chino/Code/raceday-next/components/forms/registration/RegistrationForm.tsx)

Add a **login gate** in the `onSubmit` handler:

1. Before calling `/api/payments/create-checkout`, check if `user` is `null`
2. If not logged in, show a `LoginPromptModal` instead of proceeding to payment
3. After successful login via the modal:
   - If `registrationType === "self"`, auto-populate the user's Firestore profile with the form data (name, phone, tShirtSize, singletSize, emergencyContact, medicalConditions)
   - Recalculate `profileCompletion` using the existing `calculateCompletion` function from `lib/validations/profile.ts`
   - Update the user document in Firestore
   - Then proceed with the original payment submission (now with a valid `user.uid`)

Key implementation detail: store the pending form data in state so it survives the auth state change. The `useEffect` that resets form data on `registrationType === "self"` already handles re-populating from `user`, so we need to **write to the user profile first**, then let the auth refresh happen naturally.

##### [NEW] [LoginPromptModal.tsx](file:///c:/Users/chino/Code/raceday-next/components/shared/LoginPromptModal.tsx)

A modal component that:
- Shows when a non-logged-in user tries to complete registration
- Displays a message like "Sign in to complete your registration"
- Has a "Continue with Google" button (reuses `signInWithGoogle` from `lib/firebase/auth.ts`)
- On successful login, calls an `onLoginSuccess` callback (passed as prop)
- Handles loading/error states
- Styled consistently with the app's dark athletic theme (uppercase italic font-black, etc.)

---

#### Profile Sync Logic

##### [MODIFY] [RegistrationForm.tsx](file:///c:/Users/chino/Code/raceday-next/components/forms/registration/RegistrationForm.tsx)

Add a helper function `syncProfileFromRegistration` that:

```
async function syncProfileFromRegistration(userId: string, formData: RegistrationFormValues) {
  // Only sync for "self" registrations
  if (formData.registrationType !== "self") return;
  
  const profileData = {
    displayName: formData.participantInfo.name,
    phone: formData.participantInfo.phone,
    tShirtSize: formData.participantInfo.tShirtSize,
    singletSize: formData.participantInfo.singletSize,
    emergencyContact: formData.participantInfo.emergencyContact,
    medicalConditions: formData.participantInfo.medicalConditions || "",
  };
  
  const completion = calculateCompletion(profileData);
  
  await updateDoc(doc(db, "users", userId), {
    ...profileData,
    profileCompletion: completion,
    updatedAt: serverTimestamp(),
  });
}
```

This reuses the existing `calculateCompletion` function to keep scoring consistent.

> [!IMPORTANT]
> This will **overwrite** existing profile fields. Since "Register for myself" auto-fills from the profile, the data should be identical (or the user intentionally updated it). For new users (profileCompletion: 15), this fills their profile to potentially 100%.

---

## Feature 2: Event Detail CTA Changes

### Current Behavior
- Sidebar has a "Get Your Slot" button that **only** switches to the "categories" tab (`setActiveTab("categories")`)
- On mobile, the sidebar is below the fold — users must scroll past the entire main content to see the CTA
- No direct registration link exists from the event detail page (users must pick categories first)

### Proposed Changes

---

#### Event Detail Page

##### [MODIFY] [EventDetailClient.tsx](file:///c:/Users/chino/Code/raceday-next/components/event/EventDetailClient.tsx)

**Change 1: Replace sidebar CTA** (lines 337–349)

Replace "Get Your Slot" button with a direct link to the register page:

```diff
-<Button
-    onClick={() => setActiveTab("categories")}
-    ...
->
-    Get Your Slot <ArrowRight ... />
-</Button>
+<Button
+    asChild
+    ...
+>
+    <Link href={`/events/${event.id}/register`}>
+        Register Now <ArrowRight ... />
+    </Link>
+</Button>
```

**Change 2: Add mobile-only sticky CTA**

Add a fixed-bottom CTA bar visible only on mobile (`lg:hidden`), positioned above the fold:

```tsx
{/* Mobile Sticky Register CTA */}
{!isRegistrationClosed(event) && (
  <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-white/10 lg:hidden">
    <Button
      asChild
      variant="primary"
      className="w-full h-14 text-lg font-black italic uppercase tracking-wider bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20"
    >
      <Link href={`/events/${event.id}/register`}>
        Register Now <ArrowRight className="ml-2" size={20} />
      </Link>
    </Button>
  </div>
)}
```

- Add bottom padding to the page wrapper to account for the fixed CTA bar on mobile
- The CTA links directly to `/events/[id]/register` — this page starts at Step 0 (Who), then Step 1 (Category)

> [!NOTE]
> The user requested "directly go to registering an event and choosing a category (step 1)." The current flow starts at Step 0 (Who: self vs proxy), then Step 1 (Category). Since Step 0 is a quick selection, we link to the register page which starts at Step 0. If the user wants to skip Step 0 entirely, we can discuss this.

---

## Verification Plan

### Manual Verification

**Test 1: Non-logged-in registration flow**
1. Open an incognito window and navigate to any event page (e.g. `http://localhost:3000/events/[any-event-id]`)
2. Click "Register Now" (the new CTA)
3. Complete all 5 steps of the registration form, choosing "Myself" in Step 0
4. On the final "Complete Registration" button click, a login modal should appear
5. Sign in with Google via the modal
6. After login, the registration should proceed to payment (Xendit checkout or free success)
7. Check Firestore: the user's profile should now have the registration details (phone, tShirtSize, etc.) and an updated `profileCompletion`

**Test 2: Logged-in registration flow (no change expected)**
1. Log in normally, then navigate to an event and register
2. Everything should work exactly as before — no modal appears
3. Profile should still be updated with any new data from the registration form

**Test 3: Event detail CTA changes**
1. Navigate to any event detail page
2. On desktop: the sidebar should show "Register Now" (not "Get Your Slot"), and clicking it should navigate to `/events/[id]/register`
3. On mobile (resize to <1024px or use devtools): a sticky CTA bar should appear at the bottom of the screen with "Register Now"
4. Clicking the mobile CTA should also navigate to `/events/[id]/register`
5. If registration is closed, neither CTA should be visible/clickable

**Test 4: Proxy registration profile sync (should NOT sync)**
1. Sign in, go to an event, choose "Someone Else" in Step 0
2. Complete registration with different person's details
3. Check Firestore: your profile should NOT be updated with the other person's details
