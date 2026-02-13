"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, CreditCard, ArrowRight, Home, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function RegistrationSummaryPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const status = searchParams.get("status");

    return (
        <PageWrapper className="flex items-center justify-center min-h-[80vh] py-12">
            <Card className="max-w-2xl w-full p-10 md:p-16 text-center space-y-10 bg-surface/40 backdrop-blur-xl border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cta/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 space-y-6">
                    <div className="w-24 h-24 bg-cta/20 rounded-full flex items-center justify-center mx-auto text-cta animate-in zoom-in spin-in duration-700">
                        <CheckCircle2 size={56} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                            Registration <span className="text-cta">Ready</span>.
                        </h1>
                        <p className="text-text-muted font-medium italic">Your details have been saved. One last step to secure your slot!</p>
                    </div>
                </div>

                <div className="relative z-10 bg-black/20 rounded-3xl p-8 border border-white/5 space-y-6">
                    <div className="flex items-center justify-between text-left">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Next Step</p>
                            <h3 className="text-xl font-black italic text-white uppercase">Secure Payment</h3>
                        </div>
                        <CreditCard className="text-primary" size={32} />
                    </div>

                    <p className="text-sm text-text-muted italic leading-relaxed text-left border-l-2 border-primary pl-4">
                        We are currently integrating our payment gateway (Xendit). In the next stage, you will be able to pay via GCash, GrabPay, or Credit Card.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-4 pt-4">
                    <Button variant="primary" size="lg" className="flex-1 italic font-black uppercase bg-cta hover:bg-cta-hover shadow-xl shadow-cta/20 group" asChild>
                        <Link href={`/dashboard/events`}>
                            Proceed to Dashboard <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="flex-1 italic font-black uppercase group" asChild>
                        <Link href="/">
                            <Home className="mr-2 opacity-50" size={18} /> Home
                        </Link>
                    </Button>
                </div>
            </Card>
        </PageWrapper>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return <ArrowRight className={className} size={18} />;
}
