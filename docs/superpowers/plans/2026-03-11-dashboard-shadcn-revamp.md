# Dashboard shadcn Revamp — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all custom UI components with shadcn/ui and introduce a collapsible sidebar layout shell for the dashboard.

**Architecture:** Progressive migration — initialize shadcn, build the sidebar shell, then migrate each dashboard view (Runner → Organizer → Admin → Forms). Custom components are renamed during transition to avoid filesystem conflicts, then deleted once zero imports remain.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Convex, Clerk

**Spec:** `docs/superpowers/specs/2026-03-11-dashboard-shadcn-revamp-design.md`

---

## File Structure

### New Files
- `components.json` — shadcn configuration
- `components/ui/button.tsx` — shadcn Button (replaces custom Button.tsx)
- `components/ui/card.tsx` — shadcn Card (replaces custom Card.tsx)
- `components/ui/badge.tsx` — shadcn Badge (replaces custom Badge.tsx)
- `components/ui/skeleton.tsx` — shadcn Skeleton
- `components/ui/sidebar.tsx` — shadcn Sidebar
- `components/ui/dropdown-menu.tsx` — shadcn DropdownMenu
- `components/ui/sheet.tsx` — shadcn Sheet
- `components/ui/breadcrumb.tsx` — shadcn Breadcrumb
- `components/ui/separator.tsx` — shadcn Separator
- `components/ui/tooltip.tsx` — shadcn Tooltip
- `components/ui/tabs.tsx` — shadcn Tabs
- `components/ui/table.tsx` — shadcn Table
- `components/ui/input.tsx` — shadcn Input (replaces custom Input.tsx)
- `components/ui/select.tsx` — NOT installed (native select retained, see note in Task 11)
- `components/ui/textarea.tsx` — shadcn Textarea (replaces custom Textarea.tsx)
- `components/ui/dialog.tsx` — shadcn Dialog (replaces custom Modal.tsx)
- `components/ui/alert-dialog.tsx` — shadcn AlertDialog (replaces custom ConfirmModal.tsx)
- `components/dashboard/DashboardSidebar.tsx` — Sidebar with role switcher + dynamic nav
- `components/dashboard/DashboardTopBar.tsx` — Breadcrumbs + actions bar
- `lib/dashboard-nav.ts` — Sidebar nav config per role

### Modified Files
- `app/globals.css` — Add shadcn theme tokens to @theme block
- `app/(app)/dashboard/layout.tsx` — New file: sidebar shell layout
- `app/(app)/dashboard/organizer/layout.tsx` — Simplify (remove PageWrapper)
- `app/(app)/dashboard/admin/layout.tsx` — Simplify (remove PageWrapper)
- `app/(app)/layout.tsx` — Conditionally hide Navbar on dashboard routes
- All dashboard component files — Update imports from custom to shadcn

### Temporary Files (during transition)
- `components/ui/_LegacyButton.tsx` — Renamed from Button.tsx
- `components/ui/_LegacyCard.tsx` — Renamed from Card.tsx
- `components/ui/_LegacyBadge.tsx` — Renamed from Badge.tsx
- `components/ui/_LegacyInput.tsx` — Renamed from Input.tsx
- `components/ui/_LegacySelect.tsx` — Renamed from Select.tsx
- `components/ui/_LegacyTextarea.tsx` — Renamed from Textarea.tsx
- `components/ui/_LegacyModal.tsx` — Renamed from Modal.tsx
- `components/ui/_LegacyConfirmModal.tsx` — Renamed from ConfirmModal.tsx

### Deleted Files (after zero imports remain)
- All `_Legacy*.tsx` files
- `components/shared/Skeleton.tsx`
- `components/dashboard/DashboardHeader.tsx`
- `components/dashboard/runner/RunnerSidebar.tsx`

---

## Chunk 1: Foundation (Tasks 1-3)

### Task 1: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `app/globals.css`
- Modify: `package.json` (via npx)
- Modify: `.gitignore`

- [ ] **Step 1: Add .superpowers/ to .gitignore**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 2: Initialize shadcn**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**
- CSS file path: `app/globals.css`
- Tailwind config: (accept default or CSS-based for v4)
- Components path: `components/ui`
- Utils path: `lib/utils`

**Important:** If the init process overwrites `globals.css` or `lib/utils.ts`, restore them from git and manually merge. The `cn()` function in `lib/utils.ts` already exists and should not be duplicated.

- [ ] **Step 3: Verify the generated components.json**

Read `components.json` and verify:
- `aliases.components` → `@/components/ui`
- `aliases.utils` → `@/lib/utils`
- `tailwind.css` → `app/globals.css`

- [ ] **Step 4: Configure theme tokens in globals.css**

Add these tokens to the existing `@theme` block in `app/globals.css`. Merge carefully — some tokens like `--color-primary` and `--color-background` already exist. Add only the new ones:

```css
@theme {
  /* Existing tokens — keep as-is */
  --font-heading: "Barlow Condensed", sans-serif;
  --font-body: "Barlow", sans-serif;
  --color-primary: #f97316;
  --color-secondary: #fb923c;
  --color-cta: #22c55e;
  --color-background: #1f2937;
  --color-surface: #374151;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

  /* NEW: shadcn semantic tokens */
  --color-foreground: #f8fafc;
  --color-card: #374151;
  --color-card-foreground: #f8fafc;
  --color-primary-foreground: #ffffff;
  --color-secondary-foreground: #ffffff;
  --color-muted: #374151;
  --color-muted-foreground: #94a3b8;
  --color-accent: #374151;
  --color-accent-foreground: #f8fafc;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-border: rgba(255, 255, 255, 0.05);
  --color-input: rgba(255, 255, 255, 0.05);
  --color-ring: #f97316;
  --color-popover: #374151;
  --color-popover-foreground: #f8fafc;
  --color-chart-1: #f97316;
  --color-chart-2: #22c55e;
  --color-chart-3: #3b82f6;
  --color-chart-4: #fb923c;
  --color-chart-5: #a855f7;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  /* NEW: sidebar tokens */
  --color-sidebar: #374151;
  --color-sidebar-foreground: #f8fafc;
  --color-sidebar-primary: #f97316;
  --color-sidebar-primary-foreground: #ffffff;
  --color-sidebar-accent: rgba(255, 255, 255, 0.05);
  --color-sidebar-accent-foreground: #f8fafc;
  --color-sidebar-border: rgba(255, 255, 255, 0.05);
  --color-sidebar-ring: #f97316;
}
```

Also ensure the `:root` block or a `@layer base` sets `color-scheme: dark;` if not already present.

- [ ] **Step 5: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors. There may be existing warnings — that's fine.

- [ ] **Step 6: Commit**

```bash
git add components.json app/globals.css package.json package-lock.json .gitignore
git commit -m "feat: initialize shadcn/ui with theme tokens"
```

---

### Task 2: Rename custom components to avoid conflicts

**Files:**
- Rename: `components/ui/Button.tsx` → `components/ui/_LegacyButton.tsx`
- Rename: `components/ui/Card.tsx` → `components/ui/_LegacyCard.tsx`
- Rename: `components/ui/Badge.tsx` → `components/ui/_LegacyBadge.tsx`
- Rename: `components/ui/Input.tsx` → `components/ui/_LegacyInput.tsx`
- Rename: `components/ui/Select.tsx` → `components/ui/_LegacySelect.tsx`
- Rename: `components/ui/Textarea.tsx` → `components/ui/_LegacyTextarea.tsx`
- Rename: `components/ui/Modal.tsx` → `components/ui/_LegacyModal.tsx`
- Rename: `components/ui/ConfirmModal.tsx` → `components/ui/_LegacyConfirmModal.tsx`
- Modify: All files that import from `@/components/ui/Button`, `@/components/ui/Card`, etc.

- [ ] **Step 1: Rename all custom component files**

```bash
cd /Users/chinoyoung/Code/raceday/components/ui
mv Button.tsx _LegacyButton.tsx
mv Card.tsx _LegacyCard.tsx
mv Badge.tsx _LegacyBadge.tsx
mv Input.tsx _LegacyInput.tsx
mv Select.tsx _LegacySelect.tsx
mv Textarea.tsx _LegacyTextarea.tsx
mv Modal.tsx _LegacyModal.tsx
mv ConfirmModal.tsx _LegacyConfirmModal.tsx
```

- [ ] **Step 2: Update all imports across the codebase**

Use find-and-replace across the entire codebase. For each component:

```
@/components/ui/Button → @/components/ui/_LegacyButton
@/components/ui/Card → @/components/ui/_LegacyCard
@/components/ui/Badge → @/components/ui/_LegacyBadge
@/components/ui/Input → @/components/ui/_LegacyInput
@/components/ui/Select → @/components/ui/_LegacySelect
@/components/ui/Textarea → @/components/ui/_LegacyTextarea
@/components/ui/Modal → @/components/ui/_LegacyModal
@/components/ui/ConfirmModal → @/components/ui/_LegacyConfirmModal
```

**Search scope:** All `.tsx` and `.ts` files in `app/`, `components/`, `lib/`.

**Critical:** `ImageUpload.tsx` imports Button — update it to `@/components/ui/_LegacyButton`.

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds. All imports resolve to renamed files.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename custom UI components to _Legacy prefix for shadcn migration"
```

---

### Task 3: Install base shadcn components

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/skeleton.tsx`

- [ ] **Step 1: Install shadcn button**

```bash
npx shadcn@latest add button
```

- [ ] **Step 2: Customize button with project variants**

Edit `components/ui/button.tsx`. Add the `cta` variant and ensure the variant names map well:

In the `buttonVariants` cva call, add to the `variant` object:
```typescript
cta: "bg-cta text-white shadow-md hover:opacity-90",
```

Add to the `size` object if not present:
```typescript
lg: "h-12 rounded-lg px-8 text-lg",
```

Also add `isLoading` support by extending the Button component's props interface and render logic:

```typescript
// Add to ButtonProps:
isLoading?: boolean;

// In the component render, wrap children:
<Comp disabled={props.disabled || isLoading} ...>
  {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
  {children}
</Comp>
```

This preserves the `isLoading` behavior from the legacy Button so existing usages don't break.

- [ ] **Step 3: Install shadcn card**

```bash
npx shadcn@latest add card
```

- [ ] **Step 4: Install shadcn badge**

```bash
npx shadcn@latest add badge
```

- [ ] **Step 5: Customize badge with project variants**

Edit `components/ui/badge.tsx`. Add custom variants to the `badgeVariants` cva call:

```typescript
success: "border-green-500/20 bg-green-500/20 text-green-500",
warning: "border-yellow-500/20 bg-yellow-500/20 text-yellow-500",
error: "border-red-500/20 bg-red-500/20 text-red-500",
cta: "border-cta/20 bg-cta/20 text-cta",
```

- [ ] **Step 6: Install shadcn skeleton**

```bash
npx shadcn@latest add skeleton
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Both legacy and new shadcn components coexist.

- [ ] **Step 8: Commit**

```bash
git add components/ui/button.tsx components/ui/card.tsx components/ui/badge.tsx components/ui/skeleton.tsx
git commit -m "feat: install shadcn button, card, badge, skeleton with custom variants"
```

---

## Chunk 2: Dashboard Shell (Tasks 4-6)

### Task 4: Install sidebar and shell components

**Files:**
- Create: `components/ui/sidebar.tsx`
- Create: `components/ui/sheet.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/breadcrumb.tsx`
- Create: `components/ui/separator.tsx`
- Create: `components/ui/tooltip.tsx`

- [ ] **Step 1: Install all shell components**

```bash
npx shadcn@latest add sidebar sheet dropdown-menu breadcrumb separator tooltip
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/sidebar.tsx components/ui/sheet.tsx components/ui/dropdown-menu.tsx components/ui/breadcrumb.tsx components/ui/separator.tsx components/ui/tooltip.tsx
git commit -m "feat: install shadcn sidebar, sheet, dropdown-menu, breadcrumb, separator, tooltip"
```

---

### Task 5: Build sidebar nav config and components

**Files:**
- Create: `lib/dashboard-nav.ts`
- Create: `components/dashboard/DashboardSidebar.tsx`
- Create: `components/dashboard/DashboardTopBar.tsx`

- [ ] **Step 1: Create sidebar nav config**

Create `lib/dashboard-nav.ts`:

```typescript
import {
  LayoutDashboard,
  Calendar,
  User,
  Settings,
  Users,
  FileText,
  BarChart3,
  Shield,
  ClipboardList,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const runnerNav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "My Events", href: "/dashboard/events", icon: Calendar },
      { title: "Profile", href: "/dashboard/profile", icon: User },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const organizerNav: NavGroup[] = [
  {
    label: "Organizer",
    items: [
      { title: "Overview", href: "/dashboard/organizer", icon: LayoutDashboard },
      { title: "Events", href: "/dashboard/organizer/events", icon: Calendar },
      { title: "Registrations", href: "/dashboard/organizer/registrations", icon: ClipboardList },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    label: "Admin",
    items: [
      { title: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Users", href: "/dashboard/admin/users", icon: Users },
      { title: "Events", href: "/dashboard/admin/events", icon: Calendar },
      { title: "Applications", href: "/dashboard/admin/applications", icon: FileText },
      { title: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { title: "Audit Logs", href: "/dashboard/admin/logs", icon: Shield },
    ],
  },
];

export interface RoleOption {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}

export const roleOptions: RoleOption[] = [
  { label: "Runner", value: "runner", href: "/dashboard", icon: Trophy },
  { label: "Organizer", value: "organizer", href: "/dashboard/organizer", icon: BarChart3 },
  { label: "Admin", value: "admin", href: "/dashboard/admin", icon: Shield },
];

export function getNavForRole(role: string): NavGroup[] {
  switch (role) {
    case "admin":
      return adminNav;
    case "organizer":
      return organizerNav;
    default:
      return runnerNav;
  }
}

export function getActiveRole(pathname: string): string {
  if (pathname.startsWith("/dashboard/admin")) return "admin";
  if (pathname.startsWith("/dashboard/organizer")) return "organizer";
  return "runner";
}

export function getAvailableRoles(userRole: string): RoleOption[] {
  switch (userRole) {
    case "admin":
      return roleOptions; // admin can access all
    case "organizer":
      return roleOptions.filter((r) => r.value !== "admin");
    default:
      return roleOptions.filter((r) => r.value === "runner");
  }
}
```

- [ ] **Step 2: Create DashboardSidebar component**

Create `components/dashboard/DashboardSidebar.tsx`:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronsUpDown, Check } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNavForRole,
  getActiveRole,
  getAvailableRoles,
} from "@/lib/dashboard-nav";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role: userRole } = useAuth();

  const activeRole = getActiveRole(pathname);
  const navGroups = getNavForRole(activeRole);
  const availableRoles = getAvailableRoles(userRole || "runner");
  const currentRoleOption = availableRoles.find((r) => r.value === activeRole) || availableRoles[0];

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader>
        {/* Logo */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="RaceDay"
                  width={120}
                  height={32}
                  className="h-6 w-auto object-contain"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Role Switcher */}
        {availableRoles.length > 1 && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      {currentRoleOption && <currentRoleOption.icon className="size-4" />}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {currentRoleOption?.label}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">Dashboard</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  {availableRoles.map((role) => (
                    <DropdownMenuItem
                      key={role.value}
                      onClick={() => router.push(role.href)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <role.icon className="size-4 shrink-0" />
                      </div>
                      {role.label}
                      {role.value === activeRole && (
                        <Check className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8",
                  },
                }}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.displayName || "User"}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email || ""}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 3: Create DashboardTopBar component**

Create `components/dashboard/DashboardTopBar.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string; isLast: boolean }[] = [];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const label = segments[i]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    crumbs.push({
      label,
      href: currentPath,
      isLast: i === segments.length - 1,
    });
  }

  return crumbs;
}

export function DashboardTopBar() {
  const pathname = usePathname();
  const crumbs = generateBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="contents">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard-nav.ts components/dashboard/DashboardSidebar.tsx components/dashboard/DashboardTopBar.tsx
git commit -m "feat: add dashboard sidebar, topbar, and nav config"
```

---

### Task 6: Create dashboard layout with sidebar shell

**Files:**
- Create: `app/(app)/dashboard/layout.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `app/(app)/dashboard/organizer/layout.tsx`
- Modify: `app/(app)/dashboard/admin/layout.tsx`

- [ ] **Step 1: Create the dashboard layout**

Create `app/(app)/dashboard/layout.tsx`:

```tsx
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardTopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Update app layout to hide Navbar on dashboard routes**

Modify `app/(app)/layout.tsx`. The dashboard now has its own sidebar, so we need to hide the top Navbar and Footer when inside `/dashboard`:

```tsx
"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { clerkUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");

    useEffect(() => {
        if (!loading && !clerkUser) {
            const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
            router.replace(loginUrl);
        }
    }, [clerkUser, loading, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div role="status" aria-label="Loading" className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">Loading...</p>
                </div>
            </div>
        );
    }

    if (!clerkUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-text-muted font-medium uppercase tracking-widest text-xs">Redirecting to login...</p>
            </div>
        );
    }

    // Dashboard routes use their own sidebar layout
    if (isDashboard) {
        return (
            <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-white">
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-white overflow-x-hidden">
            <Navbar />
            <main className="flex-grow pt-24 pb-8 sm:pb-20">
                {children}
            </main>
            <Footer />
        </div>
    );
}
```

- [ ] **Step 3: Simplify organizer layout**

Update `app/(app)/dashboard/organizer/layout.tsx` — remove PageWrapper since the dashboard layout now handles the outer shell:

```tsx
"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== "organizer" && role !== "admin") {
            router.replace("/dashboard");
        }
    }, [role, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (role !== "organizer" && role !== "admin") {
        return null;
    }

    return <>{children}</>;
}
```

- [ ] **Step 4: Simplify admin layout**

Update `app/(app)/dashboard/admin/layout.tsx` — same treatment:

```tsx
"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== "admin") {
            router.push("/dashboard");
        }
    }, [role, loading, router]);

    if (loading || role !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <div className="space-y-1">
                        <p className="text-xl font-black italic uppercase tracking-tighter text-white">Verifying Admin Access</p>
                        <p className="text-text-muted font-medium italic">Scanning credentials...</p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
```

- [ ] **Step 5: Verify build and test in browser**

```bash
npm run build
```

Then run `npm run dev` and verify:
- Dashboard at `/dashboard` shows sidebar with Runner nav
- Sidebar collapses to icon-only mode
- Role switcher appears for organizer/admin users
- Breadcrumbs show correct path
- `/dashboard/organizer` shows Organizer nav
- `/dashboard/admin` shows Admin nav
- Marketing pages at `/events` still show Navbar + Footer
- Mobile: sidebar shows as slide-over Sheet

- [ ] **Step 6: Commit**

```bash
git add app/(app)/dashboard/layout.tsx app/(app)/layout.tsx app/(app)/dashboard/organizer/layout.tsx app/(app)/dashboard/admin/layout.tsx
git commit -m "feat: add dashboard sidebar shell layout with role switching"
```

---

## Chunk 3: Shared Component Migration (Tasks 7-8)

### Task 7: Migrate dashboard components to shadcn Card, Button, Badge

This is the bulk migration task. For each dashboard component file, update imports from `_Legacy*` to shadcn equivalents and adjust any variant/prop differences.

**Key prop changes to apply during migration:**

| Legacy | shadcn | Notes |
|--------|--------|-------|
| `<Button variant="primary">` | `<Button variant="cta">` | Legacy primary was green (bg-cta), shadcn default is orange. Use our custom `cta` variant for green buttons. |
| `<Button variant="secondary">` | `<Button variant="default">` | Legacy secondary was orange (bg-primary), which is shadcn default. |
| `<Button variant="danger">` | `<Button variant="destructive">` | Direct rename. |
| `<Button isLoading>` | Add spinner manually or keep via wrapper | shadcn button has no `isLoading` prop — either extend it or use `disabled` + spinner child. |
| `<Card hover={false}>` | `<Card className="hover:border-transparent hover:shadow-none hover:translate-y-0">` | shadcn Card has no `hover` prop — override via className. |
| `<Badge variant="error">` | `<Badge variant="error">` | Already added as custom variant. |

**Files to migrate (dashboard components only):**

- [ ] **Step 1: Migrate `components/dashboard/DashboardHeader.tsx`**

Update: `import { Button } from "@/components/ui/_LegacyButton"` → `import { Button } from "@/components/ui/button"`

Adjust Button variant: `variant="outline"` stays the same.

- [ ] **Step 2: Migrate `components/dashboard/RunnerAnnouncements.tsx`**

Update: `import { Card } from "@/components/ui/_LegacyCard"` → `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"`

- [ ] **Step 3: Migrate `components/dashboard/AnnouncementsTab.tsx`**

Update imports for Card, Button, Input, ImageUpload.
- Card → shadcn card
- Button → shadcn button (adjust variant mapping)
- Input remains `_LegacyInput` (migrated in Phase 7)
- ImageUpload stays as-is

- [ ] **Step 4: Migrate organizer components**

Update each file in `components/dashboard/organizer/`:

1. `OrganizerStats.tsx` — Card → shadcn card
2. `OrganizerActiveEvents.tsx` — Badge, Button, Card → shadcn equivalents
3. `OrganizerDraftsNotice.tsx` — Button, Card → shadcn equivalents
4. `OrganizerQuickActions.tsx` — uses BaseQuickAction (no direct UI imports, but verify)
5. `OrganizerRegistrationsFeed.tsx` — Card, Badge → shadcn equivalents
6. `OrganizerRevenueStats.tsx` — Card → shadcn card
7. `OrganizerKitFulfillment.tsx` — Card → shadcn card
8. `VolunteerManagement.tsx` — Button, Card, Badge → shadcn; ConfirmModal stays `_LegacyConfirmModal`
9. `InviteVolunteerDialog.tsx` — Button → shadcn; Modal and Input stay legacy
10. `DemographicsTab.tsx` — Card → shadcn card

Also update shared dashboard components:
11. `components/dashboard/shared/BaseQuickAction.tsx` — verify imports, update if it uses any custom UI components

- [ ] **Step 5: Migrate runner components**

Update each file in `components/dashboard/runner/`:

1. `ProfileCompletionCard.tsx` — Card, Button → shadcn
2. `RunnerSidebar.tsx` — Card → shadcn card (this component will be removed later when its functionality is absorbed into the dashboard sidebar, but for now just update its imports)
3. `RunnerEventCard.tsx` — Card, Button, Badge → shadcn
4. `EventRegistrationList.tsx` — Card, Button → shadcn

Also update `components/dashboard/RunnerView.tsx` — remove `RunnerSidebar` import and usage since the dashboard sidebar now handles navigation. The RunnerSidebar content (event counts, quick stats) can be moved into the main content area as stat cards or removed if redundant.

- [ ] **Step 6: Migrate volunteer component**

Update `components/dashboard/volunteer/VolunteerDashboard.tsx` — Card, Badge, Button → shadcn

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add components/dashboard/
git commit -m "feat: migrate dashboard components to shadcn button, card, badge"
```

---

### Task 8: Migrate dashboard page files to shadcn components

**Files:** All page files under `app/(app)/dashboard/`

- [ ] **Step 1: Migrate runner dashboard page**

`app/(app)/dashboard/page.tsx` — Remove `PageWrapper` wrapper (now handled by layout). Update `Skeleton` import to shadcn skeleton. Remove `text-white` class from PageWrapper (no longer needed).

```tsx
// Remove: import { PageWrapper } from "@/components/layout/PageWrapper";
// Remove: import { Skeleton } from "@/components/shared/Skeleton";
// Add: import { Skeleton } from "@/components/ui/skeleton";
```

Replace `<PageWrapper className="...">` with a simple `<div className="space-y-4 sm:space-y-8">`.

- [ ] **Step 2: Migrate organizer dashboard page**

`app/(app)/dashboard/organizer/page.tsx` — Same treatment: remove PageWrapper, update Skeleton imports.

Replace skeleton components: `<Skeleton className="h-10 w-48" />` stays the same since shadcn Skeleton accepts className.

For `StatCardSkeleton` and `EventCardSkeleton`, replace with inline shadcn Skeleton compositions:

```tsx
// Replace StatCardSkeleton with:
<div className="p-4 rounded-xl border border-border bg-card">
  <Skeleton className="h-4 w-20 mb-2" />
  <Skeleton className="h-8 w-24" />
</div>
```

- [ ] **Step 3: Migrate admin dashboard page**

`app/(app)/dashboard/admin/page.tsx` — This is the biggest page. Replace:
- `import { Card } from "@/components/ui/_LegacyCard"` → `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"`
- `import { Button } from "@/components/ui/_LegacyButton"` → `import { Button } from "@/components/ui/button"`
- `import { Badge } from "@/components/ui/_LegacyBadge"` → `import { Badge } from "@/components/ui/badge"`
- Remove PageWrapper, replace with div
- Remove `Skeleton` and `AdminKPICardSkeleton` from shared, use shadcn skeleton
- Adjust Button variant mapping: `variant="outline"` stays, `variant="ghost"` stays

- [ ] **Step 4: Migrate admin sub-pages**

Update each admin sub-page:
1. `admin/users/page.tsx`
2. `admin/events/page.tsx`
3. `admin/analytics/page.tsx`
4. `admin/applications/page.tsx` + `admin/applications/components/ApplicationCard.tsx`
5. `admin/logs/page.tsx`

For each: update Card, Button, Badge imports to shadcn. Remove PageWrapper if used.

- [ ] **Step 5: Migrate organizer sub-pages**

Update each organizer sub-page:
1. `organizer/events/page.tsx`
2. `organizer/events/[id]/page.tsx`
3. `organizer/events/[id]/edit/page.tsx`
4. `organizer/registrations/page.tsx`

For each: update imports, remove PageWrapper.

**Kiosk and scanner pages** — these are full-screen and should opt out of the sidebar layout.

**Approach:** Create dedicated layouts for kiosk and scanner that suppress the sidebar. Since Next.js nested layouts inherit from parent layouts, we create layouts at the kiosk/scanner level that wrap children without the sidebar shell. The trick: these layouts cannot "undo" the parent sidebar layout, but the pages themselves can render as `fixed inset-0 z-50 bg-background` overlays that visually cover the sidebar entirely. This is the pragmatic approach since:
- Route groups can't override parent layouts in Next.js
- Moving these routes out of `/dashboard` would break the URL structure
- The sidebar still renders underneath but is completely hidden and non-interactive

Create `app/(app)/dashboard/organizer/events/[id]/kiosk/layout.tsx`:
```tsx
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-background">{children}</div>;
}
```

Create `app/(app)/dashboard/organizer/events/[id]/scanner/layout.tsx`:
```tsx
export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-background">{children}</div>;
}
```

- [ ] **Step 6: Migrate remaining dashboard pages**

1. `dashboard/settings/page.tsx` + `ProfileForm.tsx` + `OrganizerProfileForm.tsx` — Keep form component imports as legacy for now (Phase 7)
2. `dashboard/profile/page.tsx`
3. `dashboard/become-organizer/page.tsx` + step components — Keep form imports as legacy
4. `dashboard/events/[id]/qr/page.tsx`

For each: update Card, Button, Badge to shadcn. Leave Input/Select/Textarea/Modal as legacy.

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add app/(app)/dashboard/
git commit -m "feat: migrate all dashboard pages to shadcn components"
```

---

## Chunk 4: Organizer Dashboard Revamp (Tasks 9-10)

### Task 9: Install and set up shadcn Tabs and Table

**Files:**
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/table.tsx`

- [ ] **Step 1: Install tabs and table**

```bash
npx shadcn@latest add tabs table
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/tabs.tsx components/ui/table.tsx
git commit -m "feat: install shadcn tabs and table"
```

---

### Task 10: Revamp OrganizerView with shadcn Tabs

**Files:**
- Modify: `components/dashboard/OrganizerView.tsx`
- Modify: `components/dashboard/organizer/OrganizerRegistrationsFeed.tsx`

- [ ] **Step 1: Update OrganizerView to use shadcn Tabs**

Read the current `OrganizerView.tsx` to understand the tab structure, then replace the custom tab implementation with shadcn Tabs:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

Wrap the existing tab content sections with `<TabsContent value="...">`.

- [ ] **Step 2: Update OrganizerRegistrationsFeed to use shadcn Table**

Replace the current card-based list with shadcn Table:

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
```

- [ ] **Step 3: Verify build and test organizer dashboard**

```bash
npm run build
```

Test: Navigate to `/dashboard/organizer` and verify tabs work, table renders registrations.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/OrganizerView.tsx components/dashboard/organizer/
git commit -m "feat: revamp organizer dashboard with shadcn tabs and table"
```

---

## Chunk 5: Forms & Cleanup (Tasks 11-13)

### Task 11: Install form-related shadcn components

**Files:**
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/alert-dialog.tsx`
- Create: `components/ui/label.tsx`

- [ ] **Step 1: Install form components**

```bash
npx shadcn@latest add input textarea dialog alert-dialog label
```

Note: shadcn's `input` is a bare `<input>` without label/error wrapper. The current custom `Input` has built-in label, error, icon, and description props. We have two options:
1. Create a `FormField` wrapper that combines shadcn `Label` + `Input` + error text
2. Extend shadcn input with the extra props

**Recommended:** Keep the label/error pattern using shadcn's `Label` component alongside the bare `Input`. Each form field becomes:

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" {...register("name")} />
  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
</div>
```

This is more verbose but standard shadcn pattern. For the select component, shadcn uses a Radix-based Select which is quite different from a native `<select>`. Since the current codebase uses native selects with `options` prop, keep the native approach but style it with shadcn classes.

- [ ] **Step 2: Commit**

```bash
git add components/ui/input.tsx components/ui/textarea.tsx components/ui/dialog.tsx components/ui/alert-dialog.tsx components/ui/label.tsx
git commit -m "feat: install shadcn input, textarea, dialog, alert-dialog, label"
```

---

### Task 12: Migrate forms and modals

**Files:**
- Modify: All form components under `components/forms/`
- Modify: `components/dashboard/organizer/InviteVolunteerDialog.tsx`
- Modify: `components/dashboard/organizer/VolunteerManagement.tsx`
- Modify: `components/dashboard/AnnouncementsTab.tsx`
- Modify: `app/(app)/dashboard/settings/ProfileForm.tsx`
- Modify: `app/(app)/dashboard/settings/OrganizerProfileForm.tsx`
- Modify: `app/(app)/dashboard/become-organizer/components/*.tsx`
- Modify: `components/shared/LoginPromptModal.tsx`
- Modify: `components/ui/ImageUpload.tsx`

- [ ] **Step 1: Update ImageUpload to use shadcn Button**

In `components/ui/ImageUpload.tsx`:
```
import { Button } from "@/components/ui/_LegacyButton" → import { Button } from "@/components/ui/button"
```

Adjust variant mapping if needed.

- [ ] **Step 2: Migrate Modal usages to shadcn Dialog**

For each file using `Modal` from `_LegacyModal`:

Replace pattern:
```tsx
<Modal open={open} onClose={onClose} title="Title">
  {content}
</Modal>
```

With shadcn pattern:
```tsx
<Dialog open={open} onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {content}
  </DialogContent>
</Dialog>
```

Files to update (both dashboard AND non-dashboard files that use Modal):
1. `components/dashboard/organizer/InviteVolunteerDialog.tsx`
2. `components/forms/event/Step5Features.tsx` (non-dashboard, under `components/forms/`)
3. `components/forms/registration/RegistrationForm.tsx` (non-dashboard, under `components/forms/`)
4. `components/shared/LoginPromptModal.tsx` (shared component)

- [ ] **Step 3: Migrate ConfirmModal usages to shadcn AlertDialog**

Replace pattern:
```tsx
<ConfirmModal open={open} onConfirm={onConfirm} onCancel={onCancel} title="Title" description="Desc" />
```

With shadcn pattern:
```tsx
<AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Title</AlertDialogTitle>
      <AlertDialogDescription>Desc</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Files to update:
1. `components/dashboard/organizer/VolunteerManagement.tsx`

- [ ] **Step 4: Migrate Input/Textarea in dashboard forms**

For each form file, replace:
```
import { Input } from "@/components/ui/_LegacyInput"
```
With:
```
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
```

The shadcn Input is a bare input — wrap each field with Label and error text. Since the forms use `react-hook-form`, the pattern is:

```tsx
<div className="space-y-2">
  <Label htmlFor="fieldName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
    Field Label
  </Label>
  <Input
    id="fieldName"
    className="bg-white/5 border-white/10 rounded-xl"
    {...register("fieldName")}
  />
  {errors.fieldName && (
    <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.fieldName.message}</p>
  )}
</div>
```

**For inputs with icons** (the legacy Input supports an `icon` prop): wrap the shadcn Input in a relative div with the icon absolutely positioned:

```tsx
<div className="relative">
  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
    <SearchIcon className="size-4" />
  </div>
  <Input className="pl-12 bg-white/5 border-white/10 rounded-xl" {...register("field")} />
</div>
```

Search for usages of `icon` prop on Input across the codebase and apply this pattern.

**Note on shadcn `form` component:** The spec mentions adopting shadcn's `Form` component, but since the project already uses `react-hook-form` + `zod` directly and forms work well, we deliberately skip the shadcn Form wrapper to avoid unnecessary churn. The Label + Input + error text pattern achieves the same result.

Files to update:
1. `app/(app)/dashboard/settings/ProfileForm.tsx`
2. `app/(app)/dashboard/settings/OrganizerProfileForm.tsx`
3. `app/(app)/dashboard/become-organizer/components/Step1OrgInfo.tsx`
4. `app/(app)/dashboard/become-organizer/components/Step2Contact.tsx`
5. `app/(app)/dashboard/become-organizer/components/Step3Address.tsx`
6. `app/(app)/dashboard/become-organizer/components/Step4Verification.tsx`
7. `components/dashboard/AnnouncementsTab.tsx`

For Select: Keep using native `<select>` but style with shadcn classes. The current `Select` component is a native select wrapper — replace with a simple styled native select since shadcn's Select (Radix-based) would require significant refactoring of the `options` prop pattern.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add components/ app/(app)/dashboard/
git commit -m "feat: migrate forms and modals to shadcn dialog, alert-dialog, input, label"
```

---

### Task 13: Clean up legacy components

**Files:**
- Delete: `components/ui/_LegacyButton.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacyCard.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacyBadge.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacyInput.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacySelect.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacyTextarea.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacyModal.tsx` (if zero imports remain)
- Delete: `components/ui/_LegacyConfirmModal.tsx` (if zero imports remain)
- Delete: `components/shared/Skeleton.tsx` (if zero imports remain)
- Delete: `components/dashboard/DashboardHeader.tsx` (if zero imports remain)

- [ ] **Step 1: Check for remaining legacy imports**

```bash
grep -r "_Legacy" --include="*.tsx" --include="*.ts" app/ components/ lib/
```

For each file still importing a legacy component:
- If it's a **dashboard** file: migrate it to shadcn (should have been caught earlier)
- If it's a **non-dashboard** file (marketing, forms, shared): update the import to use the shadcn equivalent

**Important:** Non-dashboard files like marketing pages (`app/(marketing)/**`), event components (`components/event/**`), registration forms (`components/forms/**`), and error pages (`app/error.tsx`, `app/not-found.tsx`) also import legacy components. These ALL need to be updated to shadcn imports before legacy files can be deleted.

Key non-dashboard files to update:
- `app/(marketing)/page.tsx` — Button, Card
- `app/(marketing)/events/page.tsx` — Card, Button, Badge
- `app/(marketing)/events/[id]/register/page.tsx` — Card, Button, Badge, Input, Textarea
- `app/(marketing)/events/[id]/register/success/page.tsx` — Card, Button
- `app/(marketing)/events/[id]/register/failed/page.tsx` — Card, Button
- `app/(marketing)/events/[id]/register/summary/page.tsx` — Card, Badge
- `app/(marketing)/about/page.tsx` — Card, Button
- `app/(marketing)/for-organizers/page.tsx` — Card, Button, Badge
- `components/event/EventHero.tsx` — Badge
- `components/event/EventInfo.tsx` — Card, Button, Badge
- `components/event/EventCategories.tsx` — Card, Badge
- `components/event/EventNavigation.tsx` — Button
- `components/event/EventAnnouncements.tsx` — Card, Button
- `components/event/MobileStickyCTA.tsx` — Button
- `components/events/EventCard.tsx` — Card, Badge, Button
- `components/forms/event/*.tsx` — Various
- `components/forms/registration/*.tsx` — Various
- `components/layout/Navbar.tsx` — Button
- `app/error.tsx` — Button
- `app/not-found.tsx` — Button
- `app/(app)/volunteer/accept/page.tsx` — Card, Button, Badge

- [ ] **Step 2a: Update event components** (7 files)

Update each file in `components/event/` and `components/events/`:
1. `components/event/EventHero.tsx` — Badge → shadcn badge
2. `components/event/EventInfo.tsx` — Card, Button, Badge → shadcn
3. `components/event/EventCategories.tsx` — Card, Badge → shadcn
4. `components/event/EventNavigation.tsx` — Button → shadcn button
5. `components/event/EventAnnouncements.tsx` — Card, Button → shadcn
6. `components/event/MobileStickyCTA.tsx` — Button → shadcn button
7. `components/events/EventCard.tsx` — Card, Badge, Button → shadcn

- [ ] **Step 2b: Update marketing pages** (8 files)

For each file in `app/(marketing)/`:
1. `page.tsx` — Button, Card → shadcn
2. `events/page.tsx` — Card, Button, Badge → shadcn
3. `events/[id]/register/page.tsx` — Card, Button, Badge, Input, Textarea → shadcn
4. `events/[id]/register/success/page.tsx` — Card, Button → shadcn
5. `events/[id]/register/failed/page.tsx` — Card, Button → shadcn
6. `events/[id]/register/summary/page.tsx` — Card, Badge → shadcn
7. `about/page.tsx` — Card, Button → shadcn
8. `for-organizers/page.tsx` — Card, Button, Badge → shadcn

- [ ] **Step 2c: Update form components** (12 files)

For each file in `components/forms/`:
1. `event/EventForm.tsx` — Button → shadcn
2. `event/Step1Basic.tsx` — Input, Select, Textarea → shadcn input/textarea + native select
3. `event/Step2Images.tsx` — ImageUpload (already updated), Button → shadcn
4. `event/Step3Categories.tsx` — Input, Select, Button, Badge → shadcn
5. `event/Step4Timeline.tsx` — Input, Button → shadcn
6. `event/Step5Features.tsx` — Input, Select, Button, Badge, Modal → shadcn (Dialog already done in Task 12)
7. `event/Step6Review.tsx` — Card, Button, Badge → shadcn
8. `event/StationManager.tsx` — Input, Button, Card, Badge → shadcn
9. `registration/RegistrationForm.tsx` — All → shadcn (Dialog already done in Task 12)
10. `registration/Step0Who.tsx` — Button, Card → shadcn
11. `registration/Step1Category.tsx` — Card, Button → shadcn
12. `registration/Step2Details.tsx` — Input, Select → shadcn
13. `registration/Step3Vanity.tsx` — Input, Button → shadcn
14. `registration/Step4Review.tsx` — Card, Badge, Button → shadcn

- [ ] **Step 2d: Update remaining shared/utility files**

1. `components/layout/Navbar.tsx` — Button → shadcn button
2. `app/error.tsx` — Button → shadcn button
3. `app/not-found.tsx` — Button → shadcn button
4. `app/(app)/volunteer/accept/page.tsx` — Card, Button, Badge → shadcn

- [ ] **Step 2e: Update non-dashboard Skeleton imports**

Files importing from `@/components/shared/Skeleton` outside dashboard:
- Any marketing loading states or skeleton usages → replace with `import { Skeleton } from "@/components/ui/skeleton"`
- Specialized skeletons (`EventCardSkeleton`, `StatCardSkeleton`, `AdminKPICardSkeleton`): inline them as compositions of shadcn Skeleton at each usage site, or create small wrapper components in `components/shared/skeleton-compositions.tsx`

- [ ] **Step 3: Verify zero legacy imports remain**

```bash
grep -r "_Legacy" --include="*.tsx" --include="*.ts" app/ components/ lib/
grep -r "components/shared/Skeleton" --include="*.tsx" --include="*.ts" app/ components/
```

Expected: No results.

- [ ] **Step 4: Delete legacy files**

```bash
rm components/ui/_LegacyButton.tsx
rm components/ui/_LegacyCard.tsx
rm components/ui/_LegacyBadge.tsx
rm components/ui/_LegacyInput.tsx
rm components/ui/_LegacySelect.tsx
rm components/ui/_LegacyTextarea.tsx
rm components/ui/_LegacyModal.tsx
rm components/ui/_LegacyConfirmModal.tsx
rm components/shared/Skeleton.tsx
rm components/dashboard/DashboardHeader.tsx
```

- [ ] **Step 5: Delete DashboardHeader if unused**

Check if `DashboardHeader` is still imported:
```bash
grep -r "DashboardHeader" --include="*.tsx" app/ components/
```

If still imported in page files, either remove the import (the sidebar now handles the greeting/role switching) or keep it temporarily.

- [ ] **Step 6: Remove global CSS utility classes**

In `app/globals.css`, remove the now-unnecessary utility classes that conflict with or duplicate shadcn:
```css
/* Remove these */
.btn-primary { ... }
.btn-secondary { ... }
.card { ... }
.input { ... }
```

Check if any file uses these classes directly before removing:
```bash
grep -r "btn-primary\|btn-secondary\|\"card\"\|\"input\"" --include="*.tsx" app/ components/
```

Only remove if unused. The `.card` class may conflict with Tailwind's card color utility — remove it to avoid confusion.

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: complete shadcn migration, remove all legacy UI components"
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Foundation: init shadcn, rename legacy components, install base components |
| 2 | 4-6 | Dashboard Shell: install sidebar components, build sidebar + topbar, create layout |
| 3 | 7-8 | Shared Migration: migrate all dashboard components and pages to shadcn |
| 4 | 9-10 | Organizer Revamp: add Tabs and Table, revamp organizer view |
| 5 | 11-13 | Forms & Cleanup: migrate forms/modals, clean up all legacy files |

**Total tasks:** 13
**Total commits:** ~13
