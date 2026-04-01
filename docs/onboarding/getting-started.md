# Getting Started

Environment setup and first run guide for RaceDay Next.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x or later | Inferred from `@types/node: ^20` in devDependencies |
| npm | Bundled with Node | Used for all scripts |
| Git | Any recent version | |

Install Node via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage versions easily.

You also need accounts with:

- [Convex](https://convex.dev) — backend/database
- [Clerk](https://clerk.com) — authentication
- [Cloudinary](https://cloudinary.com) — image hosting
- [Xendit](https://xendit.co) — payment processing
- [Resend](https://resend.com) — transactional email
- [Anthropic](https://console.anthropic.com) — AI features

---

## 2. Installation

```bash
git clone https://github.com/chinofyoung/raceday-next.git
cd raceday-next
npm install
```

---

## 3. Environment Variables

Create a `.env.local` file at the project root. All variables below are required unless marked optional.

```bash
cp .env.local.example .env.local   # if an example file exists, otherwise create manually
```

### Convex

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Your Convex deployment URL, e.g. `https://happy-animal-123.convex.cloud`. Found in the Convex dashboard under your deployment. |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment identifier used by the CLI, e.g. `prod:happy-animal-123`. Set automatically by `npx convex dev` but must be present for CI/production. |

### Clerk (Authentication)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Publishable key from your Clerk application dashboard. Starts with `pk_test_` or `pk_live_`. |
| `CLERK_SECRET_KEY` | Yes | Secret key from your Clerk application dashboard. Starts with `sk_test_` or `sk_live_`. Never expose client-side. |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | Your Clerk Frontend API domain, e.g. `https://your-app.clerk.accounts.dev`. Used by Convex to validate JWTs. Found in Clerk dashboard under **JWT Templates**. |

### Cloudinary (Image Hosting)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name (visible in the dashboard). |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Yes | An unsigned upload preset configured in Cloudinary settings. |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Yes | Cloudinary API key. Used client-side for signed uploads. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. Server-side only — never expose client-side. |

### Xendit (Payments)

| Variable | Required | Description |
|---|---|---|
| `XENDIT_SECRET_KEY` | Yes | Xendit secret API key. Found in Xendit dashboard under **Settings > API Keys**. |
| `XENDIT_PUBLIC_KEY` | Yes | Xendit public key for client-side operations. |
| `XENDIT_CALLBACK_TOKEN` | Yes | Token used to verify incoming Xendit webhook payloads. Set in Xendit dashboard under **Settings > Callbacks**. |

### Resend (Email)

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | API key from your Resend account. Found under **API Keys** in the Resend dashboard. |

### Anthropic (AI)

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | API key for Claude. Used by the AI announcement assistant and event suggestion features. Found in the [Anthropic console](https://console.anthropic.com). |

### Application

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Yes | The canonical base URL of the app, e.g. `http://localhost:3000` for local dev or `https://raceday.ph` in production. Used for sitemap, robots.txt, SEO metadata, and payment redirect URLs. |

---

## 4. Convex Setup

### Initial setup (first time)

```bash
npx convex dev --until-success
```

This will:
1. Prompt you to log in to Convex if you haven't already
2. Ask you to select or create a Convex project
3. Write `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` to your `.env.local`
4. Push your schema and functions to Convex
5. Exit once the deployment is live

### Link Clerk JWT to Convex

Convex must trust Clerk-issued JWTs. Configure this in `convex/auth.config.ts` — it is already set up to read from `CLERK_JWT_ISSUER_DOMAIN`:

```ts
// convex/auth.config.ts
export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
            applicationID: "convex",
        },
    ],
};
```

To get the correct value for `CLERK_JWT_ISSUER_DOMAIN`:

1. Open your Clerk dashboard
2. Go to **Configure > JWT Templates**
3. Click the **Convex** template (create one if it doesn't exist)
4. Copy the **Issuer** URL — this is your `CLERK_JWT_ISSUER_DOMAIN`

After setting this variable, redeploy your Convex functions:

```bash
npx convex dev --until-success
```

---

## 5. Running Development

The `dev` script runs the Convex backend watcher and the Next.js frontend in parallel.

```bash
npm run dev
```

This runs:
- `convex dev` — watches and syncs Convex functions on every save
- `next dev --port 3000` — starts the Next.js frontend

To run each separately:

```bash
npm run dev:backend    # Convex watcher only
npm run dev:frontend   # Next.js on port 3000 only
```

> Note: `npm run dev` also runs a `predev` hook (`convex dev --until-success`) before starting. This ensures your Convex deployment is live before the frontend boots. If your Convex credentials are missing or invalid, the predev step will fail and the frontend will not start.

---

## 6. Verification Checklist

After `npm run dev` starts with no errors, verify the following:

- [ ] Homepage loads at [http://localhost:3000](http://localhost:3000)
- [ ] Google sign-in works — clicking **Sign in** launches the Clerk modal and Google OAuth completes successfully
- [ ] Dashboard renders after login — you are redirected to `/dashboard` and content loads (no blank screens or Convex errors in the console)
- [ ] Convex dashboard is accessible at [https://dashboard.convex.dev](https://dashboard.convex.dev) — your deployment shows as **Running** and function calls appear in the logs

If any step fails, check:

- Browser console for `NEXT_PUBLIC_*` variable errors (missing or undefined)
- Terminal output for Convex sync errors or auth mismatches
- Clerk dashboard to confirm your JWT template is set to the `convex` application ID
