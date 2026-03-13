# RaceDay Next — Project Guidelines

## Tech Stack
- Next.js 16 + React 19 + TypeScript
- Convex (backend/database)
- Clerk (auth)
- Tailwind CSS v4 + shadcn/ui
- Lucide React (icons)
- Barlow / Barlow Condensed (fonts)

## Design Language — "Clean & Confident"

All pages follow this design system — marketing, dashboard, and app pages alike.

**Live reference:** See `/branding` (`app/(marketing)/branding/page.tsx`) for a living style guide with rendered examples of every pattern below. Reference this page when building new pages or components.

### Typography Rules
- **Headings:** Sentence case, `font-bold` (700 weight). Never use `font-black`, `italic`, or `uppercase` on headings.
- **Hero headlines only:** May use `text-5xl md:text-7xl font-bold tracking-tight` with color accents on key words (e.g., `<span className="text-primary">word</span>`).
- **Section headings:** `text-3xl md:text-4xl font-bold tracking-tight`. Sentence case.
- **Uppercase is reserved** for small labels only: badges, step indicators, footer column headers. Use `text-xs font-semibold uppercase tracking-wider`.
- **Body text:** `text-base` or `text-lg`, `text-text-muted`, `leading-relaxed`. No italic.
- **Never use:** `font-black italic uppercase tracking-tighter` combinations. This is the old pattern.

### Color Palette (unchanged)
- Primary: `#f97316` (orange) — brand accent, section highlights
- CTA: `#22c55e` (green) — primary action buttons (Browse Events)
- Background: `#1f2937` — page background
- Surface: `#374151` — card/section backgrounds
- Text: `#f8fafc` — primary text
- Text Muted: `#94a3b8` — secondary text
- Blue accent: `#3b82f6` — tertiary accent (used sparingly)

### Button Patterns
- **Primary CTA (green):** `bg-cta hover:bg-cta/90 text-white font-semibold px-8 py-3 rounded-lg`
- **Secondary (outline):** `border border-white/12 text-text font-medium px-8 py-3 rounded-lg hover:bg-white/3`
- **Orange CTA (organizer actions):** `bg-primary hover:bg-primary/90 text-white font-semibold`
- **Text links:** `text-primary font-semibold hover:underline` — no uppercase, no italic

### Component Patterns
- **Badges/Pills:** `inline-flex items-center gap-2 px-4 py-1.5 bg-white/4 border border-white/8 rounded-full` with colored dot
- **Stats strip:** Grid with 1px gap dividers, `bg-white/6` gap color, clean numbers + uppercase labels
- **Cards:** `bg-white/2 border border-white/6 rounded-xl` with subtle hover lift (`hover:-translate-y-1 hover:border-primary/30`)
- **Section containers:** `bg-white/1.5 border border-white/5 rounded-2xl p-12 md:p-16`
- **Icons:** Lucide React outline style. Place inside tinted rounded boxes: `w-14 h-14 bg-{color}/8 border border-{color}/12 rounded-2xl flex items-center justify-center`

### Layout Principles
- Max width: `max-w-7xl mx-auto px-4`
- Section spacing: `py-24` between sections, `section-divider` (1px `bg-white/4`) between major sections
- Background glows: Subtle radial gradients at 5-8% opacity max, not 15%+
- Hover effects: Subtle — `translateY(-2px)` and border brightening. No scale transforms on images.

### Icons
- Always use Lucide React outline icons (stroke, not fill)
- Size: `size={24}` for feature icons, `size={16}` for inline icons, `size={14}` for small indicators
- Color: Match the section's accent color (orange/green/blue)
- No drop-shadows on icons

### Writing Style (Marketing Copy)
- Professional and confident, not aggressive or hype-driven
- Short, clear sentences
- No exclamation-heavy language
- Use real data where possible (event counts, runner counts)
