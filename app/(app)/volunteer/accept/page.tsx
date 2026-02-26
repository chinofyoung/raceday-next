"use client";

import * as React from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Mail, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";


export default function VolunteerAcceptPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, clerkUser, loading: authLoading } = useAuth();

    const eventId = searchParams.get("eventId");
    const volunteerId = searchParams.get("volunteerId");

    const [invitation, setInvitation] = React.useState<any>(null);
    const [event, setEvent] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [isAccepting, setIsAccepting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!eventId || !volunteerId) {
            setError("Invalid invitation link.");
            setLoading(false);
            return;
        }

        const fetchDetails = async () => {
            try {
                const response = await fetch(`/api/volunteers/invite-details?eventId=${eventId}&volunteerId=${volunteerId}`);
                if (!response.ok) {
                    throw new Error("Invitation not found or expired.");
                }
                const data = await response.json();

                if (data.status === "accepted") {
                    toast.success("You have already accepted this invitation.");
                    router.push("/dashboard");
                    return;
                }

                if (data.status === "revoked") {
                    throw new Error("This invitation has been revoked.");
                }

                setInvitation(data);
                setEvent({
                    name: data.eventName,
                    organizerName: data.organizerName,
                    featuredImage: data.featuredImage,
                });

                setLoading(false);
            } catch (err: any) {
                setError(err.message || "Failed to load invitation details.");
                setLoading(false);
            }
        };

        fetchDetails();
    }, [eventId, volunteerId]);

    const handleAccept = async () => {
        if (!clerkUser || !eventId || !volunteerId) return;

        setIsAccepting(true);
        try {
            const response = await fetch("/api/volunteers/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, volunteerId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to accept invitation");
            }

            toast.success("Invitation accepted!");
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Failed to accept invitation");
        } finally {
            setIsAccepting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper className="max-w-xl mx-auto py-20">
                <Card className="p-12 text-center space-y-6">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h1 className="text-3xl font-black italic uppercase text-white tracking-tight">Invitation Error</h1>
                    <p className="text-text-muted italic">{error}</p>
                    <Button asChild variant="primary">
                        <a href="/">Go to Homepage</a>
                    </Button>
                </Card>
            </PageWrapper>
        );
    }

    // Check email mismatch
    const emailMismatch = clerkUser && clerkUser.emailAddresses[0].emailAddress.toLowerCase() !== invitation?.email?.toLowerCase() && invitation?.email;

    return (
        <PageWrapper className="max-w-2xl mx-auto py-20">
            <div className="space-y-8">
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                        <ShieldCheck size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        Volunteer Invitation
                    </h1>
                    <p className="text-text-muted font-medium italic">
                        You&apos;ve been invited to help with an event on RaceDay.
                    </p>
                </div>

                <Card className="p-8 border-white/[0.08] bg-surface-lighter space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.1] shrink-0 shadow-2xl">
                            <img
                                src={event?.featuredImage || "/placeholder-event.jpg"}
                                alt={event?.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">{event?.name}</h2>
                            <p className="text-sm text-text-muted font-medium italic mt-1 uppercase tracking-widest">
                                By {event?.organizerName || "Event Organizer"}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted italic mb-3">Permissions you will receive:</h3>
                            <div className="grid gap-3">
                                {invitation?.permissions?.includes("participants") && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text">Access to Participant Management</span>
                                    </div>
                                )}
                                {invitation?.permissions?.includes("kiosk") && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text">Access to Kiosk Mode (Race Kit Claiming)</span>
                                    </div>
                                )}
                                {invitation?.permissions?.includes("announcements") && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text">Access to Event Announcements</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {emailMismatch && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <div className="text-xs text-red-500 leading-relaxed font-bold italic">
                                    This invitation was sent to <span className="underline">{invitation.email}</span>,
                                    but you are logged in as <span className="underline">{clerkUser.emailAddresses[0].emailAddress}</span>.
                                    Please switch accounts to accept.
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-3">
                            <Button
                                onClick={handleAccept}
                                disabled={isAccepting || emailMismatch || !clerkUser}
                                variant="primary"
                                className="w-full h-14 text-lg font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                {isAccepting ? (
                                    <span className="flex items-center gap-3"><Loader2 className="animate-spin" /> Accepting...</span>
                                ) : (
                                    <span className="flex items-center gap-3">Accept Invitation <ArrowRight size={20} /></span>
                                )}
                            </Button>
                            <Button asChild variant="ghost" className="text-text-muted font-black italic uppercase text-xs">
                                <a href="/">Decline & Exit</a>
                            </Button>
                        </div>
                    </div>
                </Card>

                <p className="text-center text-[10px] text-text-muted italic max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                    By accepting, you agree to handle participant data responsibly according to our Privacy Policy.
                </p>
            </div>
        </PageWrapper>
    );
}
