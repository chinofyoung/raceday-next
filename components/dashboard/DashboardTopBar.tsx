"use client";

import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
      <SidebarTrigger className="md:hidden" />
      <div className="ml-auto">
        <UserButton
          showName
          appearance={{
            elements: {
              userButtonAvatarBox: "size-10",
              userButtonOuterIdentifier: "text-sm font-bold text-foreground",
            },
          }}
        />
      </div>
    </header>
  );
}
