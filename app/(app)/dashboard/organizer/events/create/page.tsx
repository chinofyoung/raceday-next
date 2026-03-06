"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventForm } from "@/components/forms/event/EventForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CreateEventPage() {
    const { role, loading } = useAuth();
    const router = useRouter();

    if (loading) return null;

    if (role !== "organizer" && role !== "admin") {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md p-10 text-center space-y-6 bg-surface border-red-500/20">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black italic uppercase text-white">Access Denied</h1>
                        <p className="text-text-muted font-medium">
                            Only verified organizers can create and manage events. Please apply to become an organizer first.
                        </p>
                    </div>
                    <Button variant="primary" className="w-full" asChild>
                        <Link href="/dashboard/become-organizer">Apply as Organizer</Link>
                    </Button>
                </Card>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10">
            <div className="flex flex-col gap-4 mx-auto">
                <Link href="/dashboard" className="text-text-muted text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-widest italic">
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        Launch Your <span className="text-primary">Next Race</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium italic">Create, configure, and manage your marathon or race event.</p>
                </div>
            </div>

            <EventForm />
        </PageWrapper>
    );
}
