"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/_LegacyCard";
import { Button } from "@/components/ui/button";

interface ProfileCompletionCardProps {
    completion: number;
}

export function ProfileCompletionCard({ completion }: ProfileCompletionCardProps) {
    if (completion >= 100) return null;

    return (
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 opacity-50 mix-blend-screen" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0 drop-shadow-lg">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="10%" fill="transparent" className="text-white/10" />
                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="10%" fill="transparent" strokeDasharray={`${2 * Math.PI * 40}%`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - completion / 100)}%`} className="text-primary transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute font-black italic text-xl sm:text-2xl text-white">{completion}%</span>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2 md:space-y-3 relative z-10 w-full">
                <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white drop-shadow-sm">Complete your profile</h3>
                <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium italic">Fill in your details to auto-fill your race registrations and get your race kit sizes right!</p>
            </div>
            <Button variant="primary" asChild className="relative z-10 w-full md:w-auto font-black italic uppercase text-white shadow-lg shadow-primary/20 h-12 md:h-auto whitespace-nowrap">
                <Link href="/dashboard/settings">Complete Now <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
        </Card>
    );
}
