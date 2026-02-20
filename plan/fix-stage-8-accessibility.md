# Stage 8 — Accessibility
**Priority:** 🟢 Low
**Issues Fixed:** #30 (Missing `aria-label` on icon-only buttons)
**Files Touched:** 2
**Risk:** None — purely additive HTML attributes

---

## Overview

Icon-only interactive elements (buttons, links) must have accessible names so screen readers can announce what they do. Without `aria-label`, a screen reader user hears "button" with no context — they can't tell if it's "Sign Out" or "Remove Category".

This stage also does a broader scan for other accessibility quick wins found during the review.

---

## Fix 1 — `aria-label` on Navbar Sign Out Button
**Issue:** #30
**File:** `components/layout/Navbar.tsx:99-105`

### Change

```tsx
// Before:
<button
    onClick={handleSignOut}
    className="p-2 text-text-muted hover:text-red-500 transition-colors"
    title="Sign Out"
>
    <LogOut size={18} />
</button>

// After:
<button
    onClick={handleSignOut}
    className="p-2 text-text-muted hover:text-red-500 transition-colors"
    title="Sign Out"
    aria-label="Sign Out"
>
    <LogOut size={18} />
</button>
```

---

## Fix 2 — `aria-label` on Category Remove Button
**Issue:** #30
**File:** `components/forms/event/Step3Categories.tsx:154-161`

### Change

```tsx
// Before:
<button
    type="button"
    onClick={() => remove(index)}
    className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
    title="Remove category"
>
    <Trash2 size={20} />
</button>

// After:
<button
    type="button"
    onClick={() => remove(index)}
    className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
    title="Remove category"
    aria-label={`Remove category ${index + 1}`}
>
    <Trash2 size={20} />
</button>
```

Using a dynamic label like `Remove category ${index + 1}` gives screen reader users the context of *which* category they're about to remove.

---

## Additional Accessibility Scan

While fixing #30, do a quick pass for these common patterns:

### A. Add `aria-expanded` to Navbar Mobile Toggle

```tsx
// Before:
<button
    className="md:hidden text-text p-2 hover:bg-white/5 rounded-lg"
    onClick={() => setIsOpen(!isOpen)}
>
    {isOpen ? <X /> : <Menu />}
</button>

// After:
<button
    className="md:hidden text-text p-2 hover:bg-white/5 rounded-lg"
    onClick={() => setIsOpen(!isOpen)}
    aria-expanded={isOpen}
    aria-controls="mobile-nav-menu"
    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
>
    {isOpen ? <X /> : <Menu />}
</button>

// And on the mobile menu div:
<div id="mobile-nav-menu" ...>
```

### B. Add `role="status"` to Loading Spinners

Loading spinners should be announced to screen readers:

```tsx
// In app/(app)/layout.tsx and anywhere else a full-page spinner appears:
<div role="status" aria-label="Loading" className="flex flex-col items-center gap-4">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">
        Authenticating...
    </p>
</div>
```

### C. Form Error Messages — `aria-describedby`

React Hook Form's error messages should be linked to their inputs via `aria-describedby` so screen readers announce the error when the field is focused:

Check `components/ui/Input.tsx` — if the error paragraph has no `id`, add one:

```tsx
// In Input.tsx — if not already present:
<input
    {...props}
    aria-describedby={error ? `${props.name}-error` : undefined}
    aria-invalid={!!error}
/>
{error && (
    <p id={`${props.name}-error`} className="text-xs text-red-500 ...">
        {error}
    </p>
)}
```

### D. `alt` Text on User Avatar Images

```tsx
// In Navbar.tsx:
<img src={user.photoURL} alt={`${user.displayName}'s profile photo`} className="w-full h-full object-cover" />

// In dashboard/page.tsx (event featured image):
<img src={event.featuredImage} alt={`${event.name} featured image`} className="w-full h-full object-cover" />
```

---

## Acceptance Criteria

- [ ] Run Lighthouse Accessibility audit — score improves
- [ ] Using keyboard Tab key through the Navbar, the sign-out button announces "Sign Out"
- [ ] Screen reader (VoiceOver / NVDA) announces "Remove category 1", "Remove category 2", etc.
- [ ] Mobile nav toggle announces "Open navigation menu" / "Close navigation menu"
- [ ] Loading spinners have `role="status"` and are announced without being spammy
- [ ] Form inputs with errors announce the error text when focused (via `aria-describedby`)
- [ ] Event images have descriptive `alt` text, not empty strings

---

## Tools for Verification

- **Chrome DevTools → Lighthouse → Accessibility** — run before and after
- **axe DevTools browser extension** — catches more issues than Lighthouse
- **Tab key** — verify all interactive elements are reachable and have focus rings
- **macOS VoiceOver:** `Cmd + F5` to enable, then `Tab` through the page
