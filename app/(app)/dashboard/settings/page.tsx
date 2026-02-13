"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProfileForm } from "./ProfileForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <PageWrapper className="pt-8 pb-12 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link href="/dashboard/profile" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline mb-2 uppercase tracking-widest italic">
                        <ArrowLeft size={14} /> Back to Profile
                    </Link>
                    <h1 className="text-4xl font-black italic uppercase tracking-tight text-white">Profile Settings</h1>
                    <p className="text-text-muted font-medium">Keep your details up to date for seamless race experiences.</p>
                </div>
            </div>

            <ProfileForm />
        </PageWrapper>
    );
}
