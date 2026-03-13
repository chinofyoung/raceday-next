"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Megaphone, X, Clock } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Announcement } from "@/types/announcement";

export function RunnerAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch("/api/participant/announcements");
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data);
                }
            } catch (error) {
                console.error("Failed to fetch runner announcements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    if (loading) return null; // Or a subtle skeleton if preferred

    if (announcements.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-tight text-white flex items-center gap-2">
                    <Megaphone size={16} className="text-cta" /> Announcements
                </h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-3">
                        <Megaphone size={20} className="text-text-muted opacity-40" />
                    </div>
                    <p className="text-sm text-text-muted font-medium">No announcements yet</p>
                    <p className="text-xs text-text-muted/60 mt-1">Updates from event organizers will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 mb-8">
            <h3 className="text-sm font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Megaphone size={16} className="text-cta" /> Important Notifications
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {announcements.map((announcement) => (
                    <Card key={announcement.id} className="relative p-5 bg-gradient-to-r from-cta/10 to-transparent border-cta/20 shadow-md">
                        <div className="pr-2">
                            <h4 className="text-lg font-bold text-white tracking-tight">{announcement.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 mb-3">
                                <p className="text-xs text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock size={10} className="text-primary" />
                                    {formatDistanceToNow(new Date(announcement.createdAt as any), { addSuffix: true })}
                                </p>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-semibold uppercase tracking-wider">
                                    {announcement.eventName}
                                </span>
                            </div>
                            {announcement.imageUrl && (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20 mb-3 grayscale-[0.5] hover:grayscale-0 transition-all">
                                    <Image
                                        src={announcement.imageUrl}
                                        alt={announcement.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                                {announcement.message}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
