# UI/UX Improvement Plan

Based on a comprehensive review of the RaceDay platform across desktop and mobile viewports via the browser subagent, the following UI/UX issues were identified, along with a plan for improvement.

## 1. Global Navigation and Header

**Issues Identified:**
- **Case Inconsistency:** Navigation links mix Title Case (e.g., "Events") with ALL CAPS (e.g., "ADMIN PANEL").
- **Color Clashing:** Admin links use high-contrast orange/yellow that detracts from the primary green/blue theme.
- **Skeleton State Bug:** Authentication-dependent links show gray skeleton rectangles for too long during page transitions.
- **Mobile Menu Accessibility:** The touch target for individual mobile menu items is too tight.

**Improvement Plan:**
- Standardize all navigation items to Title Case for a cohesive and professional look.
- Harmonize the color palette by using primary theme colors for dashboard links, reserving orange strictly for primary Call-to-Actions.
- Optimize the authentication state check to prevent the navigation skeleton flicker.
- Increase the vertical padding and touch target size for mobile menu items.

## 2. Layout and Alignment

**Issues Identified:**
- **Distance Filter Wrap (Mobile):** Distance filters (e.g., 5K, 10K, 42K) on `/events` do not wrap gracefully, leaving orphaned pills and misaligned labels.
- **Search Bar Alignment:** The magnifying glass icon in the global search is slightly off-center vertically.
- **Dashboard Button Grid (Mobile):** Primary action buttons on `/dashboard` wrap awkwardly (2+1 grid) compared to the stat cards below them.
- **Dev Tools Overlap (Mobile):** The fixed "Register Now" footer button overlaps with the Next.js development indicator.

**Improvement Plan:**
- Implement a horizontally scrollable container (with hidden scrollbar or fade) for distance filters on mobile.
- Adjust flexbox alignment (`items-center`) on the search bar icon to perfectly center it.
- Ensure dashboard buttons use a consistent grid or stack layout on mobile (e.g., full width or uniform 2x2).
- Add sufficient bottom padding to the main layout for mobile, ensuring the fixed footer behaves predictably.

## 3. Typography and Aesthetics

**Issues Identified:**
- **Overuse of High-Weight Italics:** Almost every heading, button, and pill uses a "Black Italic" font weight. This crowded text reduces overall readability.
- **Underline Alignment:** The green underline in the hero section is too thick and cuts into the letter descenders.
- **Placeholder Content:** Presence of placeholder images (e.g., lion cubs) and gray circles for avatars instead of actual UI placeholders.

**Improvement Plan:**
- Introduce a more readable font weight/style (e.g., regular or semi-bold non-italic) for sub-headings, small badges, and buttons, keeping the "Black Italic" strictly for primary impact text.
- Adjust the Hero section underline by increasing the offset (`underline-offset`) or using a border-bottom approach.
- Replace placeholder images with contextually relevant defaults or generic running graphics.

## 4. Technical and Performance

**Issues Identified:**
- **Next.js Image Warnings:** Missing `sizes` prop on standard images causing potential layout shifts (CLS).
- **Loading Latency:** `/events` page stays in skeleton state for too long even with small datasets.

**Improvement Plan:**
- Add appropriate `sizes` attributes (e.g., `sizes="(max-width: 768px) 100vw, 50vw"`) to all `next/image` components to fix console warnings and optimize loading.
- Review data fetching strategy on the events page to explore server-side rendering or more optimistic UI updates.
