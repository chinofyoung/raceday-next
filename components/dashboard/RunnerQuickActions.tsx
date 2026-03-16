"use client";

import { Plus, Settings, Trophy, User } from "lucide-react";
import { BaseQuickAction } from "./shared/BaseQuickAction";

interface RunnerQuickActionsProps {
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerQuickActions({ hasApplication, userRole }: RunnerQuickActionsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <BaseQuickAction
                href="/events"
                icon={Trophy}
                label="Find Races"
                variant="primary"
                layout="tile"
            />
            <BaseQuickAction
                href="/dashboard/profile"
                icon={User}
                label="View Profile"
                variant="secondary"
                layout="tile"
            />
            <BaseQuickAction
                href="/dashboard/settings"
                icon={Settings}
                label="Settings"
                variant="secondary"
                layout="tile"
            />
            {userRole === "runner" && (
                <BaseQuickAction
                    href="/dashboard/become-organizer"
                    icon={hasApplication ? Settings : Plus}
                    label={hasApplication ? "Edit Application" : "Apply as Organizer"}
                    variant="secondary"
                    layout="tile"
                />
            )}
        </div>
    );
}
