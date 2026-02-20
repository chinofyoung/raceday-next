"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    // Show minimal loading state while Firebase Auth SDK initializes client-side
    // (Middleware already blocked unauthenticated server requests)
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

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-white">
            <Navbar />
            <main className="flex-grow pt-24">
                {children}
            </main>
            <Footer />
        </div>
    );
}
