"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronsUpDown, Check } from "lucide-react";
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
  const { role: userRole } = useAuth();

  const activeRole = getActiveRole(pathname);
  const allNavGroups = getNavForRole(activeRole);
  const availableRoles = getAvailableRoles(userRole || "runner");

  // Separate settings from nav groups to render it in the footer
  const settingsItem = allNavGroups
    .flatMap((g) => g.items)
    .find((item) => item.href === "/dashboard/settings");
  const navGroups = allNavGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.href !== "/dashboard/settings"),
  }));
  const currentRoleOption =
    availableRoles.find((r) => r.value === activeRole) || availableRoles[0];

  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh border-sidebar-border">
      <SidebarHeader>
        <Link href="/" className="block px-2 py-2">
          <Image
            src="/logo.png"
            alt="RaceDay"
            width={200}
            height={40}
            className="h-8 w-full object-contain object-left"
          />
        </Link>

        {availableRoles.length > 1 && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    />
                  }
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {currentRoleOption && (
                      <currentRoleOption.icon className="size-4" />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentRoleOption?.label}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Dashboard
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
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
          <SidebarGroup key={group.label} className="px-4">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    size="lg"
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href))
                    }
                    tooltip={item.title}
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {settingsItem && (
        <SidebarFooter className="px-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                isActive={pathname === settingsItem.href}
                tooltip={settingsItem.title}
                render={
                  <Link href={settingsItem.href}>
                    <settingsItem.icon />
                    <span>{settingsItem.title}</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
