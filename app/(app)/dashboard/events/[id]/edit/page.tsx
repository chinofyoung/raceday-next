"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventForm } from "@/components/forms/event/EventForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { Card } from "@/components/ui/Card";
import { Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
            const docRef = doc(db, "events", id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as RaceEvent;
                // Check if user is the organizer
                if (data.organizerId !== user?.uid && role !== "admin") {
                    setEventData(null);
                } else {
                    // Convert Firestore timestamps to YYYY-MM-DD strings for native inputs
                    const formattedData: any = {
                        ...data,
                        id: snap.id,
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
                }
            }
        } catch (e) {
            console.error("Error fetching event:", e);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    if (!eventData && !loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md p-10 text-center space-y-6 bg-surface border-red-500/20">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black italic uppercase text-white">Event Not Found</h1>
                        <p className="text-text-muted font-medium">
                            The event you are trying to edit does not exist or you don't have permission to manage it.
                        </p>
                    </div>
                    <Button variant="primary" className="w-full" asChild>
                        <Link href="/dashboard/events">Back to Events</Link>
                    </Button>
                </Card>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10">
            <div className="flex flex-col gap-4 mx-auto">
                <Link href="/dashboard/events" className="text-text-muted text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-widest italic">
                    <ArrowLeft size={14} /> Back to Events
                </Link>
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        Edit <span className="text-primary">Event</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium italic">Make changes to your race details, categories, or timeline.</p>
                </div>
            </div>

            <EventForm initialData={eventData as any} isEditing />
        </PageWrapper>
    );
}
