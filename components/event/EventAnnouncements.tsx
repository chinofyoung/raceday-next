"use client";

import { Announcement } from "@/types/announcement";
import { Card } from "@/components/ui/Card";
import { Clock, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EventAnnouncementsProps {
    announcements: Announcement[];
}

export function EventAnnouncements({ announcements }: EventAnnouncementsProps) {
    return (
        <div id="announcements" className="space-y-8 px-4 md:px-0">
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Latest <span className="text-primary">Updates</span></h2>
            {announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id} className="p-6 md:p-8 bg-surface/40 hover:bg-surface/60 border-white/5 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white">{announcement.title}</h3>
                                    <p className="text-xs text-text-muted font-bold italic uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                        <Clock size={12} className="text-primary" />
                                        {formatDistanceToNow(new Date(announcement.createdAt as any), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <Megaphone size={18} />
                                </div>
                            </div>
                            <p className="text-sm md:text-base text-text-muted leading-relaxed whitespace-pre-wrap font-medium">
                                {announcement.message}
                            </p>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center bg-surface/20 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-4">
                    <Megaphone className="text-text-muted opacity-20" size={48} />
                    <p className="text-text-muted font-bold uppercase italic tracking-widest">No updates at this time</p>
                </div>
            )}
        </div>
    );
}
