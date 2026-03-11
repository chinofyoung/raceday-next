"use client";

import { Settings, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
    userName?: string;
    isOrganizerView: boolean;
}

export function DashboardHeader({
    userName,
    isOrganizerView,
}: DashboardHeaderProps) {
    const { role } = useAuth();
    const canSwitchMode = role === "organizer" || role === "admin";
    const firstName = userName?.split(' ')[0] || "there";

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                    Hello, <span className="text-primary">{firstName}</span>
                </h1>
                <p className="text-text-muted font-medium italic">
                    {isOrganizerView ? "Your race command center. Everything at a glance." : "Welcome back to your race command center."}
                </p>
            </div>
            <div className="flex gap-4 items-center flex-wrap mt-4 md:mt-0">
                {/* Mode Switcher */}
                {canSwitchMode && (
                    <div className="flex items-center bg-surface border border-white/10 rounded-xl p-1.5 gap-1">
                        <Link
                            href="/dashboard"
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black uppercase italic tracking-wider transition-all",
                                !isOrganizerView
                                    ? "bg-primary text-white shadow-md cursor-default"
                                    : "text-text-muted hover:text-white cursor-pointer"
                            )}
                        >
                            <Trophy size={16} />
                            Runner
                        </Link>
                        <Link
                            href="/dashboard/organizer"
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black uppercase italic tracking-wider transition-all",
                                isOrganizerView
                                    ? "bg-cta text-white shadow-md cursor-default"
                                    : "text-text-muted hover:text-white cursor-pointer"
                            )}
                        >
                            <BarChart3 size={16} />
                            Organizer
                        </Link>
                    </div>
                )}
                <Button variant="outline" asChild className="font-black italic uppercase border-white/10 text-white px-6">
                    <Link href="/dashboard/settings"><Settings size={18} className="mr-2" /> Settings</Link>
                </Button>
            </div>
        </div>
    );
}
