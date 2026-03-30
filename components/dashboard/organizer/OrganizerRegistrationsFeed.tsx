"use client";

import { memo } from "react";
import { Activity, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrganizerRegistrationsFeedProps {
    recentRegistrations: any[];
}

function OrganizerRegistrationsFeedComponent({ recentRegistrations }: OrganizerRegistrationsFeedProps) {
    const router = useRouter();

    return (
        <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-12 bg-cta/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cta/20 flex items-center justify-center text-cta border border-cta/20">
                        <Activity size={16} />
                    </div>
                    <h3 className="text-base font-bold tracking-tight text-white">Recent Sign-ups</h3>
                </div>
                <Link href="/dashboard/organizer/registrations" className="text-xs uppercase font-semibold tracking-wider text-text-muted hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                    View All &rarr;
                </Link>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
                {recentRegistrations.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-text-muted text-xs font-semibold uppercase tracking-wider">Participant</TableHead>
                                <TableHead className="text-text-muted text-xs font-semibold uppercase tracking-wider">Event</TableHead>
                                <TableHead className="text-text-muted text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                                <TableHead className="text-text-muted text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                                <TableHead className="text-text-muted text-xs font-semibold uppercase tracking-wider text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentRegistrations.map((reg) => (
                                <TableRow
                                    key={reg.id}
                                    className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/organizer/events/${reg.eventId}?tab=registrations`)}
                                >
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0 border border-primary/20 group-hover:bg-primary/30 transition-colors">
                                                {reg.participantInfo?.name?.charAt(0) || "?"}
                                            </div>
                                            <span className="text-sm font-bold text-white truncate max-w-[120px]">
                                                {reg.participantInfo?.name || "Unknown"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-xs text-text-muted font-semibold uppercase tracking-wider truncate max-w-[120px] block">
                                            {reg.eventName || "Event"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-xs text-primary font-semibold uppercase tracking-wider truncate max-w-[100px] block">
                                            {reg.categoryName || reg.categoryId}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        {reg.raceKitClaimed ? (
                                            <Badge variant="success" className="bg-cta/20 text-cta border border-cta/20 text-xs font-semibold uppercase px-2 py-0.5">Claimed</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-white/10 text-text-muted text-xs font-semibold uppercase px-2 py-0.5 bg-black/40">Pending Kit</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                        {reg.createdAt && (
                                            <span className="text-xs text-text-muted/70 font-medium whitespace-nowrap">
                                                {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true })}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-black/20 rounded-2xl border border-white/5 h-full">
                        <Users className="text-text-muted opacity-20 mb-3" size={40} />
                        <p className="text-text-muted text-sm font-medium">No registrations yet.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

export const OrganizerRegistrationsFeed = memo(OrganizerRegistrationsFeedComponent);
