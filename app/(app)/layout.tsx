"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { clerkUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !clerkUser) {
            const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
            router.replace(loginUrl);
        }
    }, [clerkUser, loading, router, pathname]);

    // Only show loading spinner while auth is actually initializing
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div role="status" aria-label="Loading" className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">Loading...</p>
                </div>
            </div>
        );
    }

    // Auth finished but no user — show redirecting state briefly (useEffect will redirect)
    if (!clerkUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-text-muted font-medium uppercase tracking-widest text-xs">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-white overflow-x-hidden">
            <Navbar />
            <main className="flex-grow pt-24 pb-8 sm:pb-20">
                {children}
            </main>
            <Footer />
        </div>
    );
}
