"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.push(`/auth/login?redirect=${pathname}`);
        }
    }, [firebaseUser, loading, router, pathname]);

    if (loading || !firebaseUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">Authenticating...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
