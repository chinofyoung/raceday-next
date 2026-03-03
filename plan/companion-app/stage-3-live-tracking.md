# Stage 3 — Live Tracking (Background GPS)

> **Goal**: Background GPS tracking that works when the phone is locked, with a live map showing all runners. This is the **primary reason for the companion app**.

---

## Why This Can't Work in the Browser

The browser's `navigator.geolocation.watchPosition()` (currently used in the web app) stops firing when:
- The phone screen is locked
- The browser tab is backgrounded
- iOS Safari throttles background tabs aggressively

A native app with `expo-location` background task solves this completely.

---

## 3.1 — Background Location Setup

### Install dependencies:

```bash
npx expo install expo-location expo-task-manager
```

### Configure permissions in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "RaceDay needs your location to share your race progress with friends and family.",
          "locationAlwaysPermission": "RaceDay needs background location to track your race progress even when the app is in the background.",
          "locationWhenInUsePermission": "RaceDay needs your location to show your position on the race map.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ]
  }
}
```

### iOS Info.plist (auto-configured by expo-location):
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `UIBackgroundModes: ["location"]`

### Android (auto-configured):
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`  
- `FOREGROUND_SERVICE`

---

## 3.2 — Background Location Task

```typescript
// lib/tracking/backgroundTask.ts
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

const BACKGROUND_LOCATION_TASK = "raceday-background-location";

// Define the background task (runs even when app is closed)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location error:", error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const latest = locations[locations.length - 1];

    if (latest) {
      // Send to Convex via HTTP action (can't use React hooks in background task)
      await fetch(`${CONVEX_URL}/api/tracking/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latest.coords.latitude,
          lng: latest.coords.longitude,
          bearing: latest.coords.heading ?? undefined,
          // userId and eventId stored in AsyncStorage before starting
        }),
      });
    }
  }
});
```

> [!IMPORTANT]
> Background tasks can't use React hooks. We'll need a Convex HTTP action (or use the Convex client directly with stored credentials) to send location updates from the background task. This is the one place where a small backend addition might be needed — a simple HTTP endpoint that wraps the existing `tracking.update` mutation.

### Convex HTTP Action (small backend addition):

```typescript
// convex/http.ts (new file)
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/tracking/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    // Validate JWT from Authorization header
    // Call existing mutation
    await ctx.runMutation(api.tracking.update, {
      userId: body.userId,
      eventId: body.eventId,
      lat: body.lat,
      lng: body.lng,
      bearing: body.bearing,
    });
    return new Response("ok");
  }),
});

export default http;
```

---

## 3.3 — Start/Stop Tracking Service

```typescript
// lib/tracking/trackingService.ts
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TASK_NAME = "raceday-background-location";

export async function startBackgroundTracking(userId: string, eventId: string) {
  // Request permissions
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== "granted") throw new Error("Foreground permission denied");

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  if (background !== "granted") throw new Error("Background permission denied");

  // Store tracking context for background task
  await AsyncStorage.setItem("tracking_context", JSON.stringify({ userId, eventId }));

  // Start background location updates
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 15, // meters — matches web app threshold
    timeInterval: 15000,   // ms — matches web app's 15-second interval
    showsBackgroundLocationIndicator: true, // iOS blue bar
    foregroundService: {
      notificationTitle: "RaceDay Live Tracking",
      notificationBody: "Your race is being tracked 🏃",
      notificationColor: "#f97316",
    },
  });
}

export async function stopBackgroundTracking() {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  await AsyncStorage.removeItem("tracking_context");
}

export async function isTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(TASK_NAME);
}
```

---

## 3.4 — Live Map Screen

### Screen: Live Track

```
app/(tabs)/live.tsx → app/live/[eventId].tsx
```

Uses `react-native-maps` with the event's GPX route overlay:

```bash
npx expo install react-native-maps
npx expo install @maplibre/maplibre-react-native  # alternative for custom tiles
```

### Features:

| Feature | Implementation |
|---|---|
| GPX route overlay | Parse GPX from `category.routeMap.gpxFileUrl`, render as `Polyline` |
| Runner dots | Real-time from `api.tracking.listByEvent` (Convex subscription) |
| Current user highlight | Different marker color for `currentUserId` |
| Station markers | `category.stations` rendered as custom markers (water, aid, first aid) |
| Active runners count | Badge showing count from `liveTrackers.length` |
| Start/Stop button | Calls `startBackgroundTracking()` / `stopBackgroundTracking()` |

### Map Component:

```typescript
import MapView, { Marker, Polyline } from "react-native-maps";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function LiveTrackMap({ event, userId }) {
  const liveTrackers = useQuery(api.tracking.listByEvent, {
    eventId: event._id,
  }) || [];

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={/* center on event location */}
      mapType="standard"
      customMapStyle={darkMapStyle}
    >
      {/* GPX Route */}
      <Polyline coordinates={gpxCoordinates} strokeColor="#f97316" strokeWidth={3} />

      {/* Station Markers */}
      {stations.map(station => (
        <Marker key={station.id} coordinate={station.coordinates} />
      ))}

      {/* Live Runner Markers */}
      {liveTrackers.map(tracker => (
        <Marker
          key={tracker.userId}
          coordinate={{ latitude: tracker.lat, longitude: tracker.lng }}
          rotation={tracker.bearing}
        />
      ))}
    </MapView>
  );
}
```

---

## 3.5 — GPX Parser

Since the web app already uses GPX files for route maps, we need a lightweight GPX parser for React Native:

```typescript
// lib/tracking/gpxParser.ts
export function parseGPX(gpxString: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  const regex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
  let match;
  while ((match = regex.exec(gpxString)) !== null) {
    points.push({
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
    });
  }
  return points;
}
```

---

## 3.6 — Battery & Performance Considerations

| Concern | Mitigation |
|---|---|
| Battery drain | `distanceInterval: 15` meters prevents updates while stationary |
| Update frequency | 15-second minimum matches web app; GPS hardware handles this efficiently |
| Data usage | Each update is ~100 bytes to Convex; a 4-hour race ≈ 100KB total |
| iOS background rules | `expo-location` handles all iOS background mode requirements |
| Android foreground service | Persistent notification ensures Android doesn't kill the tracking |

---

## Deliverables

- [ ] Background location tracking works when screen is locked
- [ ] Convex HTTP action for background task location updates
- [ ] Start/stop tracking from the Live Track screen
- [ ] Live map with GPX route, runner dots, station markers
- [ ] Real-time runner positions via Convex subscription
- [ ] Persistent notification on Android during tracking
- [ ] iOS blue location indicator during tracking
- [ ] Battery-conscious update intervals
