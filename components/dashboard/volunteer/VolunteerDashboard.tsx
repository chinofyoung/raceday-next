"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar, MapPin, ShieldCheck, ArrowRight, Monitor, Users, MailCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toDate } from "@/lib/utils";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";

import { Id } from "@/convex/_generated/dataModel";

export function VolunteerDashboard() {
    const { user, clerkUser } = useAuth();

    const events = useQuery(api.volunteers.getMyVolunteerEvents,
        (user || clerkUser) ? {
            email: user?.email || clerkUser?.primaryEmailAddress?.emailAddress || "",
            userId: user?._id as Id<"users">
        } : "skip"
    );

    const isLoading = events === undefined;

    if (isLoading || !events || events.length === 0) {
        return null;
    }

    const pendingEvents = events.filter(e => e?.status === "pending");
    const activeEvents = events.filter(e => e?.status === "accepted");

    return (
        <div className="space-y-12">
            {pendingEvents.length > 0 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                            <MailCheck className="w-8 h-8 text-primary" />
                            Pending Invitations
                        </h2>
                        <p className="text-sm text-text-muted mt-1 font-medium italic">
                            You have been invited to help manage these events.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {pendingEvents.map((event) => (
                            <Card key={`pending-${event.id}`} className="group overflow-hidden border-primary/20 bg-primary/5 hover:border-primary/50 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-6">
                                {/* Event Info */}
                                <div className="space-y-3 flex-1">
                                    <div>
                                        <Badge variant="outline" className="text-primary border-primary/30 uppercase text-[10px] font-black italic mb-2">
                                            Pending Volunteer Invite
                                        </Badge>
                                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white truncate">
                                            {event.name}
                                        </h3>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-xs text-text-muted font-medium italic">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-primary" />
                                                {event.date ? format(toDate(event.date), "MMMM d, yyyy") : "TBA"}
                                            </div>
                                            <div className="flex items-center gap-1.5 line-clamp-1">
                                                <MapPin size={12} className="text-cta" />
                                                {event.location?.name || "Location TBD"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {event.permissions.map((p: string) => (
                                            <Badge key={p} variant="secondary" className="bg-white/[0.05] border-white/[0.05] text-[10px] lowercase text-text-muted">
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/[0.05]">
                                    <Button asChild variant="primary" className="w-full md:w-auto font-black italic uppercase">
                                        <Link href={`/volunteer/accept?eventId=${event.id}&volunteerId=${event.volunteerId}`}>
                                            Review Invitation <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeEvents.length > 0 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            Volunteer Access
                        </h2>
                        <p className="text-sm text-text-muted mt-1 font-medium italic">
                            You have been granted access to help manage these events.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeEvents.map((event) => (
                            <Card key={event.id} className="group overflow-hidden border-white/[0.08] bg-surface-lighter hover:border-primary/50 transition-all duration-300">
                                {/* Event Image */}
                                <div className="relative h-40 overflow-hidden">
                                    <img
                                        src={event.featuredImage || "/placeholder-running.jpg"}
                                        alt={event.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <Badge variant="primary" className="bg-primary text-white border-none uppercase text-[10px] font-black italic">
                                            Volunteer
                                        </Badge>
                                    </div>
                                </div>

                                {/* Event Info */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white truncate">
                                            {event.name}
                                        </h3>
                                        <div className="flex flex-col gap-1 mt-2 text-xs text-text-muted font-medium italic">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-primary" />
                                                {event.date ? format(toDate(event.date), "MMMM d, yyyy") : "TBA"}
                                            </div>
                                            <div className="flex items-center gap-1.5 line-clamp-1">
                                                <MapPin size={12} className="text-cta" />
                                                {event.location?.name || "Location TBD"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {event.permissions.map((p: string) => (
                                            <Badge key={p} variant="secondary" className="bg-white/[0.05] border-white/[0.05] text-[10px] lowercase text-white">
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.05]">
                                        {event.permissions.includes("kiosk") && (
                                            <Button asChild variant="primary" size="sm" className="font-black italic uppercase text-[10px]">
                                                <Link href={`/dashboard/events/${event.id}/kiosk`}>
                                                    <Monitor className="w-3 h-3 mr-1.5" /> Kiosk
                                                </Link>
                                            </Button>
                                        )}
                                        {event.permissions.includes("participants") && (
                                            <Button asChild variant="secondary" size="sm" className="font-black italic uppercase text-[10px]">
                                                <Link href={`/dashboard/events/${event.id}`}>
                                                    <Users className="w-3 h-3 mr-1.5" /> Users
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
