"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <PageWrapper className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center space-y-8 max-w-lg mx-auto">
                <div className="space-y-2">
                    <h1 className="text-9xl font-black italic uppercase tracking-tighter text-primary opacity-20">404</h1>
                    <h2 className="text-4xl font-black italic uppercase tracking-tight text-white">Off Track!</h2>
                    <p className="text-text-muted font-medium italic">
                        The finish line you're looking for doesn't exist or has moved to another course.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="primary" className="h-14 px-8 uppercase italic font-black">
                        <Link href="/"><Home size={20} className="mr-2" /> Back to Home</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 px-8 uppercase italic font-black">
                        <Link href="/events">Browse Events</Link>
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
