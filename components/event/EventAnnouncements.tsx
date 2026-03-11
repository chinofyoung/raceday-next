"use client";

import { Announcement } from "@/types/announcement";
import { Card } from "@/components/ui/card";
import { Clock, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

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
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 overflow-hidden">
                                {announcement.imageUrl && (
                                    <div className="w-full md:w-1/3 shrink-0">
                                        <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                                            <Image
                                                src={announcement.imageUrl}
                                                alt={announcement.title}
                                                fill
                                                className="object-cover object-center"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <div className="min-w-0">
                                            <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white truncate md:whitespace-normal">{announcement.title}</h3>
                                            <p className="text-xs text-text-muted font-bold italic uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                <Clock size={12} className="text-primary" />
                                                {announcement.createdAt ? (() => {
                                                    try {
                                                        const date = new Date(announcement.createdAt as any);
                                                        return isNaN(date.getTime()) ? "Recent" : formatDistanceToNow(date, { addSuffix: true });
                                                    } catch (e) {
                                                        return "Recent";
                                                    }
                                                })() : "Recent"}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                            <Megaphone size={18} />
                                        </div>
                                    </div>
                                    <p className="text-sm md:text-base text-text-muted leading-relaxed whitespace-pre-wrap font-medium">
                                        {announcement.message}
                                    </p>
                                </div>
                            </div>
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
