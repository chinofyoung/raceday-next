# Homepage Revamp — Clean & Confident Design

**Date:** 2026-03-13
**Status:** Approved
**Scope:** Homepage, For Organizers page, About page

## Summary

Restyle all three marketing pages from aggressive sports-marketing aesthetic (font-black italic uppercase everywhere) to a professional event-platform look ("Clean & Confident"). Same sections, same colors, same Lucide icons — new typography treatment and layout refinements.

## Design Decisions

- **Direction:** Event Platform Professional (Eventbrite/Luma meets athletics)
- **Primary CTA:** Browse Events (green)
- **Colors:** Keep existing palette (orange primary, green CTA, dark bg)
- **Typography:** Sentence case, bold weight, no italic/uppercase/black on headings
- **Icons:** Lucide outline icons (already imported)

## Pages

### 1. Homepage (`app/(marketing)/page.tsx`)

**5 sections, all restyled:**

1. **Hero** — Badge pill with green dot, sentence-case headline ("Find your next race. Register in seconds."), green primary CTA, outline secondary CTA, stats strip with divided grid (no icons, just numbers + labels)
2. **Upcoming Races** — Section heading in sentence case with subtitle, "View All Events →" link, 3-card grid with date+price row, event name, MapPin location, distance badge tags, status badges (Open/Filling Up)
3. **How It Works** — Rounded container, 3-column grid with step labels (Step 1/2/3) in accent colors, Lucide icons in tinted boxes, sentence-case titles
4. **Live Tracking** — 2-column split, "New Feature" badge, sentence-case headline with green accent, feature list with icon boxes, simplified map mockup with circle markers
5. **Organizer CTA** — Centered block, "For Organizers" badge, sentence-case headline, orange primary CTA, text link secondary

### 2. For Organizers (`app/(marketing)/for-organizers/page.tsx`)

Apply same design language:
- Hero: Sentence case headline, badge pill, orange CTA button (not italic/uppercase/black)
- Stats: Clean inline display, no italic/black
- Feature cards: Lucide icons in tinted boxes, sentence case headings, no italic/uppercase
- Feature showcase: Sentence case heading, CheckCircle2 list items with clean styling
- Dashboard mockup: Keep as-is (already clean)
- Final CTA: Sentence case, clean button styling

### 3. About (`app/(marketing)/about/page.tsx`)

Apply same design language:
- Hero: Sentence case headline with color accent (no underline decoration hack), clean subtitle
- Mission/Vision: Sentence case headings, clean card for vision block
- Team cards: Keep gradient avatars, clean typography (no italic/black on names/roles)
- Contact section: Sentence case heading, clean card hover states, no italic/uppercase on card titles

## Typography Migration Reference

| Old Pattern | New Pattern |
|---|---|
| `font-black italic uppercase tracking-tighter` | `font-bold tracking-tight` |
| `font-black italic uppercase tracking-widest` | `font-semibold` |
| `font-bold italic uppercase` | `font-bold` (sentence case) |
| `font-black uppercase italic text-[10px] tracking-widest` | `text-xs font-semibold uppercase tracking-wider` (labels only) |
| `text-[11px] font-black uppercase tracking-widest italic` | `text-xs font-semibold` |

## What NOT to Change

- Color values and CSS custom properties
- Convex data fetching logic
- Component imports and structure (PageWrapper, Card, Badge, Button)
- Navbar and Footer (separate scope)
- Dashboard pages
- globals.css heading rules (these affect dashboard too — leave for now)
