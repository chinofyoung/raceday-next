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
      return roleOptions;
    case "organizer":
      return roleOptions.filter((r) => r.value !== "admin");
    default:
      return roleOptions.filter((r) => r.value === "runner");
  }
}
