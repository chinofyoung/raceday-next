"use client";

import { User, Trophy, Plus, Settings, Globe } from "lucide-react";
import { BaseQuickAction } from "./shared/BaseQuickAction";

interface RunnerQuickActionsProps {
    hasApplication: boolean;
    userRole?: string;
}

export function RunnerQuickActions({ hasApplication, userRole }: RunnerQuickActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <BaseQuickAction
                href="/events"
                icon={Trophy}
                label="Find Races"
                variant="cta"
            />

            <BaseQuickAction
                href="/dashboard/settings"
                icon={Settings}
                label="Edit Profile"
                variant="primary"
            />

            {userRole === "runner" && (
                <BaseQuickAction
                    href="/dashboard/become-organizer"
                    icon={hasApplication ? Settings : Plus}
                    label={hasApplication ? "Edit Application" : "Apply as Organizer"}
                    variant="secondary"
                />
            )}

            <BaseQuickAction
                href="/"
                icon={Globe}
                label="View Site"
                variant="secondary"
            />
        </div>
    );
}
