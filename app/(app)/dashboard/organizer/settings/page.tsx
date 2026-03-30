"use client";

import { OrganizerProfileForm } from "../../settings/OrganizerProfileForm";
import { PaymentMethodsManager } from "@/components/dashboard/PaymentMethodsManager";
import { useAuth } from "@/lib/hooks/useAuth";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function OrganizerSettingsPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider animate-pulse">Loading Settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <Link
                    href="/dashboard/organizer"
                    className="md:hidden text-text-muted hover:text-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors mb-4"
                >
                    <ArrowLeft size={12} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                    Organizer Settings
                </h1>
                <p className="text-text-muted font-medium">
                    Manage your organization profile and details.
                </p>
            </div>

            {/* Content */}
            <OrganizerProfileForm />

            {/* Payment Methods */}
            <div className="pt-4 border-t border-white/5">
                <PaymentMethodsManager />
            </div>
        </div>
    );
}
