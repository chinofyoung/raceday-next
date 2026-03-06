"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== "organizer" && role !== "admin") {
            router.replace("/dashboard");
        }
    }, [role, loading, router]);

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    if (role !== "organizer" && role !== "admin") {
        return null;
    }

    return <>{children}</>;
}
