# Map Stations Feature — Water, Aid & First Aid Stations

Allow organizers to place **Water Stations**, **Aid Stations**, and **First Aid Stations** on the race route map, visible to runners on both the public event page and the live tracking view.

---

## Overview

### Problem
Organizers have no way to mark support stations along the race route. Runners currently see only the GPX route line with start/finish markers. The public event page even has placeholder text saying _"hydration stations and first aid will be marked on race day."_

### Solution
Add a `stations` array to each event category's data model. Provide a form UI for organizers to add/edit/remove stations (with type, label, and coordinates). Render stations as distinct, color-coded markers with labels on both the public race map and the live tracking map.

---

## Data Model Changes

### [MODIFY] [event.ts](file:///Users/chinoyoung/Code/raceday-next/types/event.ts)

Add a new `RaceStation` interface and wire it into `EventCategory`:

```typescript
export type StationType = "water" | "aid" | "first_aid";

export interface RaceStation {
  id: string;
  type: StationType;
  label: string; // e.g. "KM 5 Water", "First Aid Tent"
  coordinates: {
    lat: number;
    lng: number;
  };
}
```

Add to `EventCategory`:
```diff
 export interface EventCategory {
   ...
   routeMap?: {
     gpxFileUrl: string;
   };
+  stations?: RaceStation[];
   inclusions: string[];
   ...
 }
```

---

### [MODIFY] [event.ts (validation)](file:///Users/chinoyoung/Code/raceday-next/lib/validations/event.ts)

Add Zod schema for station and nest it inside `eventCategorySchema`:

```typescript
const raceStationSchema = z.object({
  id: z.string(),
  type: z.enum(["water", "aid", "first_aid"]),
  label: z.string().min(1, "Label is required"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});
```

Add to `eventCategorySchema`:
```diff
 routeMap: z.object({ gpxFileUrl: z.string() }).optional(),
+stations: z.array(raceStationSchema).optional().default([]),
```

---

## Organizer UI — Station Management

### [NEW] [StationManager.tsx](file:///Users/chinoyoung/Code/raceday-next/components/forms/event/StationManager.tsx)

A self-contained component embedded within Step 5 (Features) of the event form. This component allows the organizer to:

1. **Add stations** — Click "Add Station" button that opens a panel with:
   - `Type` dropdown: Water Station / Aid Station / First Aid Station
   - `Label` text input
   - `Latitude` / `Longitude` number inputs (manual coordinate entry)
2. **Click on map** — An interactive Leaflet map (using the category's GPX route as background) with `useMapEvents` from `react-leaflet` to capture click coordinates. Clicking the map auto-fills lat/lng.
3. **View placed stations** on the interactive preview map with color-coded markers.
4. **Edit / Delete** existing stations from a list below the map.

**Design:**
- Each station type gets a distinct SVG icon + color:
  - 💧 **Water Station** → Blue (`#3b82f6`)
  - 🏥 **Aid Station** → Orange (`#f59e0b`)
  - ➕ **First Aid Station** → Red (`#ef4444`)
- Station list rendered as compact cards with type badge, label, and lat/lng.  
- The map preview uses the existing `RouteMapViewer` pattern but with an interactive variant (`MapContainer` with `useMapEvents`).
- ARIA labels on all interactive elements, 44px+ touch targets, smooth transitions (200ms).

---

### [MODIFY] [Step5Features.tsx](file:///Users/chinoyoung/Code/raceday-next/components/forms/event/Step5Features.tsx)

Add a new section below "Live Tracking" that renders `<StationManager />`. The section should:
- Only appear if the event has at least one category with a GPX route uploaded (otherwise show a hint to upload GPX first).
- Use the form context to read/write `categories[index].stations`.
- Allow switching between categories (if multiple) to manage stations per category.

---

## Map Rendering — Display Stations

### [MODIFY] [RouteMapViewer.tsx](file:///Users/chinoyoung/Code/raceday-next/components/shared/RouteMapViewer.tsx)

Add a new `stations` prop to `RouteMapViewerProps`:

```diff
 interface RouteMapViewerProps {
   gpxUrl?: string;
   points?: [number, number][];
   center?: [number, number];
   zoom?: number;
   className?: string;
   theme?: "light" | "dark";
   liveTrackers?: LiveTracker[];
   currentUserId?: string;
+  stations?: RaceStation[];
 }
```

Render station markers inside the `<MapContainer>`:
- Use `L.divIcon` with custom SVG HTML (similar to the existing live tracker markers pattern).
- Each station type gets a unique SVG icon and color.
- Show a `<Popup>` with the station label and type on click.
- Show a tooltip label always visible using `<Tooltip permanent>` from `react-leaflet` for station names alongside markers.

**Icon examples (SVG div icons):**
- Water: Droplet shape, blue fill
- Aid: Cross/tent shape, orange fill  
- First Aid: Cross in circle, red fill

---

### [MODIFY] [EventRoute.tsx](file:///Users/chinoyoung/Code/raceday-next/components/event/EventRoute.tsx)

Pass stations to `RouteMapViewer`:
```diff
 <RouteMapViewer
   gpxUrl={event.categories[activeRouteCategoryIndex].routeMap.gpxFileUrl}
   zoom={14}
   theme="dark"
+  stations={event.categories[activeRouteCategoryIndex].stations}
 />
```

Also update the info blurb to replace the placeholder text about hydration/first-aid stations:
```diff
- Locations for hydration stations and first aid will be marked on race day.
+ Station locations are marked on the map above.
```

---

### [MODIFY] [LiveTrackingClient.tsx](file:///Users/chinoyoung/Code/raceday-next/components/event/LiveTrackingClient.tsx)

Pass stations to the `RouteMapViewer` rendered in the live tracking view:
```diff
 <RouteMapViewer
   gpxUrl={...}
   theme="dark"
   liveTrackers={trackers}
   currentUserId={user?.uid}
+  stations={activeCategory?.stations}
 />
```

This ensures runners see the support stations during live tracking as well.

---

## File Change Summary

| File | Action | What Changes |
|------|--------|-------------|
| [event.ts](file:///Users/chinoyoung/Code/raceday-next/types/event.ts) | MODIFY | Add `StationType`, `RaceStation` interface; add `stations` to `EventCategory` |
| [event.ts (validation)](file:///Users/chinoyoung/Code/raceday-next/lib/validations/event.ts) | MODIFY | Add `raceStationSchema`; add `stations` to `eventCategorySchema` |
| [StationManager.tsx](file:///Users/chinoyoung/Code/raceday-next/components/forms/event/StationManager.tsx) | NEW | Interactive form + map for organizers to manage stations |
| [Step5Features.tsx](file:///Users/chinoyoung/Code/raceday-next/components/forms/event/Step5Features.tsx) | MODIFY | Embed `StationManager` section |
| [RouteMapViewer.tsx](file:///Users/chinoyoung/Code/raceday-next/components/shared/RouteMapViewer.tsx) | MODIFY | Accept `stations` prop; render color-coded station markers with labels |
| [EventRoute.tsx](file:///Users/chinoyoung/Code/raceday-next/components/event/EventRoute.tsx) | MODIFY | Pass `stations` to `RouteMapViewer`; update info text |
| [LiveTrackingClient.tsx](file:///Users/chinoyoung/Code/raceday-next/components/event/LiveTrackingClient.tsx) | MODIFY | Pass `stations` to `RouteMapViewer` in live tracking view |

---

## Verification Plan

No existing automated tests were found in the project. Manual browser-based verification is recommended.

### Manual Verification Steps

**1. Station Management Form (Organizer)**
- Navigate to **Dashboard → Events → Edit Event**
- Go to **Step 5: Features**
- Verify the "Map Stations" section appears for categories that have a GPX route uploaded
- Add a Water Station by entering coordinates manually → verify it appears on the preview map as a blue marker
- Add an Aid Station by clicking on the preview map → verify lat/lng auto-fill and the marker appears orange
- Add a First Aid Station → verify red marker
- Edit a station's label → verify it updates
- Delete a station → verify it disappears from both list and map
- Save the event → verify stations persist after reloading the edit page

**2. Public Event Page (Runner View)**
- Navigate to a published event with stations configured
- Scroll to the **Race Course** section
- Verify station markers appear on the map with correct colors and labels
- Click a station marker → verify the popup shows station name and type
- Switch between categories → verify correct stations display for each

**3. Live Tracking Page**
- Navigate to the live tracking page for an event with stations
- Verify station markers are visible alongside live tracker markers
- Verify stations do not interfere with live tracker display

> [!IMPORTANT]
> Since there are no automated tests in the project, these manual steps are the primary verification method. The user should test on both desktop and mobile viewports.
