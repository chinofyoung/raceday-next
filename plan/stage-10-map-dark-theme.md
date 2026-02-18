# Stage 10: Race Course Map Dark Theme

## Overview
The `RouteMapViewer` component currently uses the default OpenStreetMap tile layer, which has a bright/light appearance that clashes with the app's dark aesthetic. This stage adds a **dark mode theme** for the map, with an optional theme toggle.

---

## 10.1 — Dark Tile Provider

### `components/shared/RouteMapViewer.tsx`

Replace or augment the current `TileLayer` with a dark-themed tile provider. Options (all free):

| Provider | URL Template | Style |
|----------|-------------|-------|
| **CartoDB Dark Matter** (Recommended) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | Clean dark with white roads |
| CartoDB Dark (no labels) | `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png` | Pure dark, no text |
| Stadia Alidade Smooth Dark | `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png` | Smooth dark with muted colors |

> **Recommendation:** Use **CartoDB Dark Matter** as the default — it's free, requires no API key, looks great with the app's dark UI, and has proper labels for orientation.

---

## 10.2 — Theme Prop and Toggle

### Props Update:
```ts
interface RouteMapViewerProps {
    gpxUrl?: string;
    points?: [number, number][];
    center?: [number, number];
    zoom?: number;
    className?: string;
    theme?: "light" | "dark";  // NEW — default: "dark"
}
```

### Tile Configuration Map:
```ts
const TILE_THEMES = {
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    light: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
};
```

### Route Polyline Color Update:
- **Dark theme:** Use a brighter route color for contrast — `#F97316` (current orange) or `#22D3EE` (cyan) or `#A78BFA` (purple).
- **Light theme:** Keep current `#F97316`.
- Start/Finish markers should also be visible against the dark tiles.

---

## 10.3 — Optional: Theme Toggle Button

Add a small floating button in the top-right corner of the map container that lets users switch between light and dark themes:

```tsx
<button
    onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
    className="absolute top-3 right-3 z-[1000] p-2 bg-surface/80 backdrop-blur rounded-lg border border-white/10 hover:bg-surface transition-all"
>
    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
</button>
```

> This is optional. Since the app is already dark-themed, defaulting to dark without a toggle may be sufficient for v1.

---

## 10.4 — Integration Points

### `components/event/EventDetailClient.tsx`
- Pass `theme="dark"` (or make it default) to `<RouteMapViewer>`.
- No other changes needed — the component already renders in the "route" tab.

### Any future uses of `RouteMapViewer`
- The theme prop will be available wherever the component is used.

---

## 10.5 — Style Polish

- **Map container border:** Update to match dark theme — `border-white/10` (already in place).
- **Loading state:** The existing loading skeleton already uses `bg-white/5 animate-pulse`, which works great.
- **Map controls (zoom buttons):** Leaflet's default controls may look odd on dark tiles. Add CSS overrides in `globals.css`:
  ```css
  .leaflet-control-zoom a {
      background-color: rgba(30, 30, 30, 0.9) !important;
      color: white !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
  }
  .leaflet-control-zoom a:hover {
      background-color: rgba(50, 50, 50, 0.9) !important;
  }
  ```

---

## Verification Plan

### Manual Testing
1. **Default dark theme:** Navigate to an event with a GPX route → open the "Route" tab → verify the map renders with dark tiles instead of the standard light map.
2. **Route visibility:** Confirm the orange route polyline is clearly visible on dark tiles.
3. **Start/Finish markers:** Confirm markers are visible and legible.
4. **Zoom controls:** Verify zoom buttons are styled to match the dark theme.
5. **Toggle (if implemented):** Click the theme toggle → verify map switches between dark and light tiles.
6. **Mobile:** Verify the map looks correct on mobile viewports.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `components/shared/RouteMapViewer.tsx` | Add theme prop, dark tile provider, optional toggle |
| `components/event/EventDetailClient.tsx` | Pass `theme="dark"` to RouteMapViewer (or rely on default) |
| `app/globals.css` | Add Leaflet control dark mode overrides |
