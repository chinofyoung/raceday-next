"use client";

import { useEffect, useState } from "react";
import { EventForm } from "@/components/forms/event/EventForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { getEventById } from "@/lib/services/eventService";
import { RaceEvent } from "@/types/event";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toInputDate } from "@/lib/utils";

export default function EditEventPage() {
    const { role, loading: authLoading, user } = useAuth();
    const { id } = useParams();
    const router = useRouter();
    const [eventData, setEventData] = useState<RaceEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            fetchEvent();
        }
    }, [user, id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const data = await getEventById(id as string);

            if (!data) {
                setEventData(null);
                return;
            }

            // Check if user is the organizer
            if (data.organizerId !== user?._id && role !== "admin") {
                setEventData(null);
                return;
            }

            // Convert timestamps to YYYY-MM-DD strings for native inputs
            const formattedData: any = {
                ...data,
                date: data.date ? toInputDate(data.date) : toInputDate(new Date()),
                registrationEndDate: data.registrationEndDate ? toInputDate(data.registrationEndDate) : toInputDate(new Date()),
                // Ensure categories have numeric distance and distanceUnit (backward compat)
                categories: (data.categories || []).map((cat: any) => ({
                    ...cat,
                    distance: typeof cat.distance === "string" ? (parseFloat(cat.distance) || 0) : cat.distance,
                    distanceUnit: cat.distanceUnit || "km",
                })),
            };

            // Convert Early Bird dates if they exist
            if (data.earlyBird) {
                formattedData.earlyBird = {
                    ...data.earlyBird,
                    startDate: data.earlyBird.startDate ? toInputDate(data.earlyBird.startDate) : undefined,
                    endDate: data.earlyBird.endDate ? toInputDate(data.earlyBird.endDate) : undefined,
                };
            }

            setEventData(formattedData);
        } catch (e) {
            console.error("Error fetching event:", e);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="space-y-10">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!eventData && !loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md p-10 text-center space-y-6 bg-surface border-red-500/20">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Event Not Found</h1>
                        <p className="text-text-muted font-medium">
                            The event you are trying to edit does not exist or you don't have permission to manage it.
                        </p>
                    </div>
                    <Button variant="primary" className="w-full" asChild>
                        <Link href="/dashboard/events">Back to Events</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-4 mx-auto">
                <Link href="/dashboard/events" className="text-text-muted text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-wider">
                    <ArrowLeft size={14} /> Back to Events
                </Link>
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                        Edit <span className="text-primary">event</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium">Make changes to your race details, categories, or timeline.</p>
                </div>
            </div>

            <EventForm initialData={eventData as any} isEditing />
        </div>
    );
}
