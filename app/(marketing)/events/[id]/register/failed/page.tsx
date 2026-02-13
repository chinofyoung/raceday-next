"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCw, MessageSquare, ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";

export default function RegistrationFailedPage() {
    const { id: eventId } = useParams();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <PageWrapper className="pt-24 pb-24 max-w-2xl mx-auto space-y-12">
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse shadow-2xl shadow-red-500/20">
                    <XCircle size={56} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
                        Payment <span className="text-red-500">Failed</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium italic">
                        Something went wrong during the transaction. Don&apos;t worry, your slot isn&apos;t gone yet!
                    </p>
                </div>
            </div>

            <Card className="p-8 bg-surface/30 border-red-500/20 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="space-y-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest italic">
                        <AlertCircle size={14} /> {error || "Transaction Cancelled or Declined"}
                    </div>
                    <p className="text-text-muted text-sm leading-relaxed italic font-medium px-6">
                        Common issues include insufficient funds, credit card restrictions, or network interruptions. Please try again or use a different payment method.
                    </p>
                </div>

                <div className="flex flex-col gap-4 relative z-10 pt-4">
                    <Button className="h-14 bg-red-500 hover:bg-red-600 border-none font-black italic uppercase tracking-widest shadow-xl shadow-red-500/20 group" asChild>
                        <Link href={`/events/${eventId}/register`}>
                            Try Again <RefreshCw className="ml-2 group-hover:rotate-180 transition-transform duration-500" size={18} />
                        </Link>
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 border-white/10 font-bold italic uppercase text-xs gap-2" asChild>
                            <Link href="/support">
                                <MessageSquare size={16} /> Contact Support
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-12 border-white/10 font-bold italic uppercase text-xs gap-2" asChild>
                            <Link href={`/events/${eventId}`}>
                                <ArrowLeft size={16} /> Back to Event
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>

            <p className="text-center text-[10px] text-text-muted font-black uppercase tracking-widest italic opacity-50">
                Secure Payment Powered by Xendit
            </p>
        </PageWrapper>
    );
}
