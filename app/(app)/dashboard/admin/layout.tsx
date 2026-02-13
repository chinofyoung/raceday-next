"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== "admin") {
            router.push("/dashboard");
        }
    }, [role, loading, router]);

    if (loading || role !== "admin") {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <div className="space-y-1">
                        <p className="text-xl font-black italic uppercase tracking-tighter text-white">Verifying Admin Access</p>
                        <p className="text-text-muted font-medium italic">Scanning credentials...</p>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return <>{children}</>;
}
