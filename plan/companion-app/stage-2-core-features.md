# Stage 2 — Core Features (Events & QR Pass)

> **Goal**: The runner can view their registered events, see event details, and display their race kit QR code.

---

## 2.1 — Events Tab (Registered Events)

This reuses the existing `api.registrations.getByUserId` query — **no backend changes needed**.

### Screen: My Events List

```typescript
// app/(tabs)/events.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function EventsScreen() {
  const user = useCurrentUser(); // from Clerk → Convex user lookup
  const registrations = useQuery(
    api.registrations.getByUserId,
    user ? { userId: user._id } : "skip"
  );

  // Separate into upcoming vs past
  const upcoming = registrations?.filter(r => new Date(r.event?.date) > new Date());
  const past = registrations?.filter(r => new Date(r.event?.date) <= new Date());

  return (
    // FlatList with sections: "Upcoming" and "Past"
    // Each card shows: event image, name, date, location, status badge, category
  );
}
```

### Event Card Component

A mobile-optimized card inspired by the web `RunnerEventCard`:

| Element | Data Source |
|---|---|
| Event image | `reg.event.featuredImage` (Cloudinary URL) |
| Event name | `reg.event.name` |
| Date | `reg.event.date` (formatted with `date-fns`) |
| Location | `reg.event.location.name` |
| Category | matched by `reg.categoryId` |
| Status badge | `reg.status` ("paid" / "pending") |
| Race number | `reg.raceNumber` |
| Kit claimed | `reg.raceKitClaimed` |

Tapping a card navigates to the Event Detail screen.

---

## 2.2 — Event Detail Screen

### Screen: Event Details

```
app/(tabs)/events/[id].tsx
```

Shows key event info relevant to a runner on race day:

- **Header**: Event name with featured image
- **Quick Info**: Date, location, category, race number
- **Timeline**: Assembly time, gun start, cut-off (from `event.timeline`)
- **Race Kit Status**: Claimed/unclaimed with QR button
- **Live Track Button**: Links to the Live Track screen (Stage 3)
- **Announcements**: Real-time list from `api.announcements` (uses Convex subscription)

### Convex Queries Used:

| Query | Purpose |
|---|---|
| `api.registrations.getByUserId` | Already fetched in list, pass to detail |
| `api.announcements.getByEvent` | Event announcements (real-time) |
| `api.events.getById` | Full event data if needed |

---

## 2.3 — QR Pass Screen

This is the **most important daily-use feature** — runners show this at the race kit claim booth.

### Screen: QR Pass

```
app/(tabs)/events/[id]/qr.tsx
```

The QR code encodes the registration ID. The existing web app generates QR codes using the `qrcode` package and stores the URL in `reg.qrCodeUrl`. For the mobile app, we generate the QR **locally** from the registration ID using `react-native-qrcode-svg`:

```bash
npx expo install react-native-qrcode-svg react-native-svg
```

```typescript
import QRCode from "react-native-qrcode-svg";

function QRPassScreen({ registrationId }) {
  return (
    <View style={styles.container}>
      {/* Race number prominently displayed */}
      <Text style={styles.raceNumber}>#{registration.raceNumber}</Text>

      {/* Large QR code */}
      <QRCode
        value={registrationId}
        size={280}
        backgroundColor="#1f2937"
        color="#f8fafc"
      />

      {/* Runner name & category */}
      <Text>{registration.participantInfo.name}</Text>
      <Text>{categoryName}</Text>

      {/* Kit claimed status */}
      {registration.raceKitClaimed && <Badge>Kit Collected ✓</Badge>}
    </View>
  );
}
```

### UX Considerations:

- **Keep screen awake** while QR is displayed (`expo-keep-awake`)
- **Max brightness** when showing QR code for easy scanning
- **Full-screen mode** — minimize distractions around the QR
- **Offline-capable** — QR is generated from the registration ID string, so it works even without a network connection

---

## 2.4 — Tab Navigation

```
app/(tabs)/_layout.tsx
```

| Tab | Icon | Screen |
|---|---|---|
| My Events | `Calendar` | Events list |
| Live Track | `Navigation` | Stage 3 |
| Settings | `User` | Profile / Logout |

---

## 2.5 — Dependencies for Stage 2

```bash
npx expo install react-native-qrcode-svg react-native-svg
npx expo install expo-keep-awake
npx expo install date-fns  # already used in web app
npx expo install @expo/vector-icons
```

---

## Deliverables

- [ ] Events tab showing all registered events (upcoming + past)
- [ ] Event detail screen with timeline, announcements, and kit status
- [ ] QR pass screen with full-screen QR code display
- [ ] Screen keeps awake and brightness maxed on QR screen
- [ ] Smooth navigation between list → detail → QR
- [ ] Matches dark theme from web app
