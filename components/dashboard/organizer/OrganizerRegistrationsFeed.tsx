"use client";

import { Activity, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface OrganizerRegistrationsFeedProps {
    recentRegistrations: any[];
}

export function OrganizerRegistrationsFeed({ recentRegistrations }: OrganizerRegistrationsFeedProps) {
    return (
        <Card className="p-5 bg-surface/50 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 p-12 bg-cta/5 rounded-full blur-3xl -ml-16 -mt-16" />
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cta" />
                    <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Recent Sign-ups</h3>
                </div>
                <Link href="/dashboard/registrations" className="text-[10px] uppercase font-black italic tracking-widest text-cta hover:text-white transition-colors flex items-center">
                    View All &rarr;
                </Link>
            </div>
            <div className="space-y-2 relative z-10">
                {recentRegistrations.length > 0 ? (
                    recentRegistrations.map((reg) => (
                        <div key={reg.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black italic text-[10px] uppercase shrink-0">
                                {reg.participantInfo?.name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white uppercase italic truncate">{reg.participantInfo?.name || "Unknown"}</p>
                                <p className="text-[9px] text-text-muted font-bold italic uppercase tracking-wider">{reg.categoryId}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                {reg.raceKitClaimed ? (
                                    <Badge variant="success" className="bg-cta/20 text-cta border-none text-[7px] font-black italic uppercase px-1.5 py-0">Claimed</Badge>
                                ) : (
                                    <Badge variant="outline" className="border-white/10 text-text-muted text-[7px] font-black italic uppercase px-1.5 py-0">Pending Kit</Badge>
                                )}
                                {reg.createdAt?.seconds && (
                                    <span className="text-[8px] text-text-muted italic mt-0.5">
                                        {formatDistanceToNow(new Date(reg.createdAt.seconds * 1000), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center">
                        <Users className="mx-auto text-text-muted opacity-10 mb-2" size={32} />
                        <p className="text-text-muted text-xs italic font-medium">No registrations yet.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
