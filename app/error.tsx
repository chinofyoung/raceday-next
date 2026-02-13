"use client";

import { useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <PageWrapper className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center space-y-8 max-w-lg mx-auto">
                <div className="space-y-2">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 mb-6">
                        <AlertCircle size={48} />
                    </div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tight text-white">System Cramp!</h2>
                    <p className="text-text-muted font-medium italic">
                        Something went wrong while loading this page. Don't worry, even elite athletes have bad days.
                    </p>
                    <p className="text-[10px] font-mono text-text-muted/30 pt-4">Error: {error.message || "Unknown error"}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => reset()} variant="primary" className="h-14 px-8 uppercase italic font-black">
                        <RefreshCcw size={20} className="mr-2" /> Try Again
                    </Button>
                    <Button asChild variant="outline" className="h-14 px-8 uppercase italic font-black">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
