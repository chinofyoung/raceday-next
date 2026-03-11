"use client";

import { Activity, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface OrganizerRegistrationsFeedProps {
    recentRegistrations: any[];
}

export function OrganizerRegistrationsFeed({ recentRegistrations }: OrganizerRegistrationsFeedProps) {
    return (
        <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-12 bg-cta/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cta/20 flex items-center justify-center text-cta border border-cta/20">
                        <Activity size={16} />
                    </div>
                    <h3 className="text-base font-black uppercase italic tracking-tight text-white">Recent Sign-ups</h3>
                </div>
                <Link href="/dashboard/organizer/registrations" className="text-[10px] uppercase font-bold italic tracking-widest text-text-muted hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                    View All &rarr;
                </Link>
            </div>

            <div className="space-y-4 relative z-10 flex-1 overflow-y-auto pr-2 no-scrollbar">
                {recentRegistrations.length > 0 ? (
                    recentRegistrations.map((reg) => (
                        <div key={reg.id} className="flex items-center gap-4 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black italic text-sm uppercase shrink-0 border border-primary/20 group-hover:bg-primary/30 transition-colors">
                                {reg.participantInfo?.name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white uppercase italic truncate">{reg.participantInfo?.name || "Unknown"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-wider truncate">{reg.eventName || 'Event'}</p>
                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                    <p className="text-[10px] text-primary font-bold italic uppercase tracking-wider truncate">{reg.categoryName || reg.categoryId}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-1.5">
                                {reg.raceKitClaimed ? (
                                    <Badge variant="success" className="bg-cta/20 text-cta border border-cta/20 text-[9px] font-black italic uppercase px-2 py-0.5">Claimed</Badge>
                                ) : (
                                    <Badge variant="outline" className="border-white/10 text-text-muted text-[9px] font-black italic uppercase px-2 py-0.5 bg-black/40">Pending Kit</Badge>
                                )}
                                {reg.createdAt && (
                                    <span className="text-[9px] text-text-muted/70 font-medium italic">
                                        {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-black/20 rounded-2xl border border-white/5 h-full">
                        <Users className="text-text-muted opacity-20 mb-3" size={40} />
                        <p className="text-text-muted text-sm italic font-medium">No registrations yet.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
