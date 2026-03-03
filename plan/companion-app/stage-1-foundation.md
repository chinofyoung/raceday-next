# Stage 1 — Foundation & Authentication

> **Goal**: Get a working Expo app that authenticates with Clerk and connects to the existing Convex backend.

---

## Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- An Apple Developer account (for iOS TestFlight)
- A Google Play Console account (for Android testing)
- The existing Clerk instance configured to allow the Expo app redirect URI

---

## 1.1 — Project Initialization

Create a new Expo project alongside the existing Next.js app:

```bash
# From the parent directory of raceday-next
npx create-expo-app@latest raceday-mobile --template tabs
cd raceday-mobile
```

### Key dependencies to install:

```bash
# Convex (same version as web app)
npx expo install convex

# Clerk for Expo
npx expo install @clerk/clerk-expo expo-secure-store expo-web-browser expo-linking

# Navigation
npx expo install expo-router expo-constants expo-status-bar

# Essentials
npx expo install react-native-safe-area-context react-native-screens react-native-gesture-handler
```

### Folder structure:

```
raceday-mobile/
├── app/                      # Expo Router (file-based routing)
│   ├── _layout.tsx           # Root layout: Clerk + Convex providers
│   ├── (auth)/               # Auth screens
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   └── (tabs)/               # Main tab navigator
│       ├── _layout.tsx
│       ├── events.tsx         # Stage 2
│       └── settings.tsx
├── components/
│   └── providers/
│       ├── ClerkProvider.tsx
│       └── ConvexProvider.tsx
├── convex/                   # Symlink → ../raceday-next/convex
├── lib/
│   ├── tokenCache.ts         # Clerk token storage with expo-secure-store
│   └── hooks/
├── constants/
│   └── theme.ts              # Reuse color tokens from globals.css
├── app.json
└── package.json
```

---

## 1.2 — Clerk Authentication

### Token Cache (using `expo-secure-store`)

```typescript
// lib/tokenCache.ts
import * as SecureStore from "expo-secure-store";

export const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};
```

### Clerk Provider

```typescript
// components/providers/ClerkProvider.tsx
import { ClerkProvider as ClerkProviderBase } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/tokenCache";

export function ClerkProvider({ children }) {
  return (
    <ClerkProviderBase
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      {children}
    </ClerkProviderBase>
  );
}
```

### Clerk Dashboard Configuration

In the Clerk Dashboard, add the Expo redirect URI:
- Go to **Paths** → **Redirect URLs**
- Add: `exp://localhost:8081` (for development)
- Add: `raceday://` (for production deep linking)

---

## 1.3 — Convex Client

### Shared Convex Directory

**Option A (Recommended):** Symlink the Convex directory:

```bash
# From raceday-mobile/
ln -s ../raceday-next/convex ./convex
```

**Option B:** If deploying from CI, copy the `_generated` folder or use a monorepo structure.

### Convex Provider with Clerk JWT

```typescript
// components/providers/ConvexProvider.tsx
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!
);

export function ConvexProvider({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

---

## 1.4 — Root Layout

```typescript
// app/_layout.tsx
import { Slot } from "expo-router";
import { ClerkProvider } from "@/components/providers/ClerkProvider";
import { ConvexProvider } from "@/components/providers/ConvexProvider";

export default function RootLayout() {
  return (
    <ClerkProvider>
      <ConvexProvider>
        <Slot />
      </ConvexProvider>
    </ClerkProvider>
  );
}
```

---

## 1.5 — Auth Screens

A simple login screen using Clerk's `useOAuth` or `useSignIn`:

```typescript
// app/(auth)/login.tsx
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleLogin = async () => {
    const { createdSessionId, setActive } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/"),
    });
    if (createdSessionId) {
      setActive!({ session: createdSessionId });
    }
  };

  // ... render login UI
}
```

---

## 1.6 — Environment Variables

Create `.env` in the mobile project:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx  # Same as web
EXPO_PUBLIC_CONVEX_URL=https://xxx.convex.cloud  # Same as web
```

---

## 1.7 — Design Tokens

Reuse the exact same color palette from the web app's `globals.css`:

```typescript
// constants/theme.ts
export const colors = {
  primary: "#f97316",
  secondary: "#fb923c",
  cta: "#22c55e",
  background: "#1f2937",
  surface: "#374151",
  text: "#f8fafc",
  textMuted: "#94a3b8",
};

export const fonts = {
  heading: "BarlowCondensed",  // Load via expo-font
  body: "Barlow",
};
```

---

## Deliverables

- [ ] Expo project created with Expo Router
- [ ] Clerk auth working (Google OAuth login)
- [ ] Convex client connecting to existing backend
- [ ] User can log in and see their Convex user data
- [ ] Dark theme matching web app aesthetic
- [ ] Runs on both iOS Simulator and Android Emulator
