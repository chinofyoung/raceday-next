# Stage 9: Event Image Gallery

## Overview
The `RaceEvent` type already has a `galleryImages: string[]` field (up to 5 Cloudinary URLs), but these images are **not currently displayed** anywhere on the event detail page. This stage adds a **thumbnail grid** and a **lightbox gallery** to showcase the uploaded event images.

---

## 9.1 — Gallery Thumbnail Component

### New File: `components/event/EventGallery.tsx`

Create a reusable gallery component that takes an array of image URLs and renders:

1. **Thumbnail Grid:**
   - Responsive grid layout: 2 columns on mobile, 3 on tablet, 4-5 on desktop.
   - Images displayed with `object-cover` in rounded containers with subtle hover effects.
   - Each thumbnail has a hover overlay with a zoom/expand icon.
   - If 5+ images, show a "+N more" overlay on the last visible thumbnail.

2. **Lightbox Modal:**
   - Clicking any thumbnail opens a full-screen lightbox overlay.
   - Left/Right navigation arrows (keyboard arrows also work).
   - Close button (X) and click-outside-to-close.
   - Image counter: "2 / 5".
   - Smooth fade/slide transitions between images.
   - Background blur/dim overlay.

### Props Interface:
```ts
interface EventGalleryProps {
    images: string[];
    eventName: string;  // For alt text
}
```

### Design Details:
- **Thumbnail grid:** Use CSS Grid with `auto-fill` for responsive behavior.
- **Thumbnail style:** Rounded corners (`rounded-xl`), subtle border (`border-white/5`), hover scale effect (`hover:scale-[1.02]`), transition.
- **Lightbox:** Fixed overlay with `z-50`, dark background (`bg-black/90`), centered image with `max-h-[85vh]` and `max-w-[90vw]`.
- **Arrows:** Semi-transparent circular buttons positioned at left/right edges.
- **Animations:** `animate-in fade-in` on open, smooth image transitions.

---

## 9.2 — Integration into Event Detail Page

### `components/event/EventDetailClient.tsx`

**Option A — New "Gallery" Tab:**
- Add `"gallery"` to the tab list: `["info", "categories", "timeline", "route", "gallery"]`.
- When the gallery tab is active, render `<EventGallery images={event.galleryImages} eventName={event.name} />`.
- Only show the gallery tab if `event.galleryImages?.length > 0`.

**Option B — Inline in "Info" Tab (Recommended):**
- Add the gallery thumbnails below the "About the Race" section within the "info" tab.
- Section heading: **"Event Gallery"** or **"Photos"**.
- This keeps images visible without requiring users to navigate to a separate tab.
- Still opens the full lightbox on click.

> **Recommendation:** Go with **Option B** (inline in info tab) so images are immediately visible. The gallery tab can always be added later if the number of images grows.

---

## 9.3 — Handling Edge Cases

- **No images:** Don't render the gallery section at all if `galleryImages` is empty or undefined.
- **Single image:** Show it as a single larger thumbnail (no grid needed), still clickable for lightbox.
- **Broken images:** Use `onError` handler on `<Image>` to hide broken thumbnails or show a fallback.
- **Loading states:** Use Next.js `<Image>` with `placeholder="blur"` or a skeleton loader.

---

## Verification Plan

### Manual Testing
1. **Event with gallery images:** Navigate to an event that has `galleryImages` populated → verify thumbnail grid appears in the Info tab below the description.
2. **Lightbox interaction:** Click a thumbnail → verify lightbox opens full-screen → navigate left/right with arrows → close with X or click outside.
3. **Keyboard navigation:** While lightbox is open, press ArrowLeft/ArrowRight to navigate, Escape to close.
4. **Event without images:** Navigate to an event with no gallery images → verify the gallery section is not rendered.
5. **Mobile responsiveness:** Check on mobile viewport → verify grid adapts to 2 columns and lightbox is touch-friendly.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `components/event/EventGallery.tsx` | **[NEW]** Thumbnail grid + lightbox gallery component |
| `components/event/EventDetailClient.tsx` | Import and render `EventGallery` in the info tab |
