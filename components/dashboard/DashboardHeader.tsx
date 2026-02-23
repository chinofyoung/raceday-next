"use client";

import { User as UserIcon, Settings, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface DashboardHeaderProps {
    userName?: string;
    isOrganizerView: boolean;
    mode: "runner" | "organizer";
    setMode: (mode: "runner" | "organizer") => void;
    canSwitchMode: boolean;
}

export function DashboardHeader({
    userName,
    isOrganizerView,
    mode,
    setMode,
    canSwitchMode
}: DashboardHeaderProps) {
    const firstName = userName?.split(' ')[0] || "there";

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                    Hello, <span className="text-primary">{firstName}</span>
                </h1>
                <p className="text-text-muted font-medium italic">
                    {isOrganizerView ? "Your race command center. Everything at a glance." : "Welcome back to your race command center."}
                </p>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
                {/* Mode Switcher */}
                {canSwitchMode && (
                    <div className="flex items-center bg-surface border border-white/10 rounded-xl p-1 gap-0.5">
                        <button
                            onClick={() => setMode("runner")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${mode === "runner"
                                ? "bg-primary text-white shadow-md"
                                : "text-text-muted hover:text-white"
                                }`}
                        >
                            <Trophy size={14} />
                            Runner
                        </button>
                        <button
                            onClick={() => setMode("organizer")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${mode === "organizer"
                                ? "bg-cta text-white shadow-md"
                                : "text-text-muted hover:text-white"
                                }`}
                        >
                            <BarChart3 size={14} />
                            Organizer
                        </button>
                    </div>
                )}
                <Button variant="outline" size="sm" asChild className="font-black italic uppercase border-white/10 text-white">
                    <Link href="/dashboard/settings"><Settings size={16} className="mr-2" /> Settings</Link>
                </Button>
            </div>
        </div>
    );
}
