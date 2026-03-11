"use client";

import { useState } from "react";
import { ProfileForm } from "./ProfileForm";
import { OrganizerProfileForm } from "./OrganizerProfileForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { ArrowLeft, User, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "organizer";

export default function SettingsPage() {
    const { user, role, loading } = useAuth();
    const isOrganizer = role === "organizer" || role === "admin";
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest italic animate-pulse">Loading Settings...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        {
            id: "profile" as SettingsTab,
            label: "Profile",
            icon: User,
            description: "Personal details & apparel",
            color: "primary",
        },
        ...(isOrganizer
            ? [
                {
                    id: "organizer" as SettingsTab,
                    label: "Organizer",
                    icon: Building2,
                    description: "Organization settings",
                    color: "cta",
                },
            ]
            : []),
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <Link
                    href="/dashboard"
                    className="text-text-muted hover:text-primary text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1 transition-colors mb-4"
                >
                    <ArrowLeft size={12} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                    Settings
                </h1>
                <p className="text-text-muted font-medium italic">
                    Manage your profile and account preferences.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-surface/60 backdrop-blur-sm border border-white/5 rounded-2xl p-1.5">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all flex-1 sm:flex-none cursor-pointer",
                                isActive
                                    ? tab.color === "cta"
                                        ? "bg-cta/10 border border-cta/20 shadow-lg shadow-cta/5"
                                        : "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5"
                                    : "border border-transparent hover:bg-white/5"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                    isActive
                                        ? tab.color === "cta"
                                            ? "bg-cta/20 text-cta"
                                            : "bg-primary/20 text-primary"
                                        : "bg-white/5 text-text-muted"
                                )}
                            >
                                <Icon size={18} />
                            </div>
                            <div className="text-left">
                                <p
                                    className={cn(
                                        "text-sm font-black italic uppercase tracking-tight leading-tight",
                                        isActive
                                            ? tab.color === "cta"
                                                ? "text-cta"
                                                : "text-primary"
                                            : "text-white"
                                    )}
                                >
                                    {tab.label}
                                </p>
                                <p className="text-[9px] text-text-muted font-medium italic hidden sm:block">
                                    {tab.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeTab}>
                {activeTab === "profile" && <ProfileForm />}
                {activeTab === "organizer" && isOrganizer && <OrganizerProfileForm />}
            </div>
        </div>
    );
}
