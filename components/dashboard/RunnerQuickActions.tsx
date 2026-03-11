"use client";

import { Plus, Settings, Trophy, Globe } from "lucide-react";
import { BaseQuickAction } from "./shared/BaseQuickAction";

interface RunnerQuickActionsProps {
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerQuickActions({ hasApplication, userRole }: RunnerQuickActionsProps) {
    return (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3">
            <BaseQuickAction
                href="/events"
                icon={Trophy}
                label="Find Races"
                variant="primary"
            />
            <BaseQuickAction
                href="/"
                icon={Globe}
                label="View Site"
                variant="secondary"
            />
            {userRole === "runner" && (
                <BaseQuickAction
                    href="/dashboard/become-organizer"
                    icon={hasApplication ? Settings : Plus}
                    label={hasApplication ? "Edit Application" : "Apply as Organizer"}
                    variant="secondary"
                />
            )}
        </div>
    );
}
