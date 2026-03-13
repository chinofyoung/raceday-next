"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerInviteSchema, VolunteerInviteFormValues } from "@/lib/validations/volunteer";
import { toast } from "sonner";
import { Mail, CheckCircle2, ShieldAlert } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/hooks/useAuth";

interface InviteVolunteerDialogProps {
    open: boolean;
    onClose: () => void;
    eventId: string;
    onSuccess: () => void;
}

export function InviteVolunteerDialog({
    open,
    onClose,
    eventId,
    onSuccess,
}: InviteVolunteerDialogProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const inviteMutation = useMutation(api.volunteers.invite);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<VolunteerInviteFormValues>({
        resolver: zodResolver(volunteerInviteSchema),
        defaultValues: {
            email: "",
            permissions: ["kiosk"],
        },
    });

    const onSubmit = async (data: VolunteerInviteFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await inviteMutation({
                eventId: eventId as Id<"events">,
                email: data.email,
                permissions: data.permissions as string[],
                invitedBy: user._id as string,
            });

            toast.success("Invitation sent successfully!");
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Volunteer</DialogTitle>
                </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Gmail Address
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            {...register("email")}
                            placeholder="volunteer@gmail.com"
                            className="pl-10 bg-white/5 border-white/10 rounded-xl"
                        />
                    </div>
                    {errors.email && <p className="text-xs text-destructive font-bold uppercase">{errors.email.message}</p>}
                    <p className="text-xs text-muted-foreground">
                        Volunteer must have a Google/Gmail account to accept the invitation.
                    </p>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Permissions
                    </label>

                    <div className="grid gap-3">
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                value="kiosk"
                                {...register("permissions")}
                                className="mt-1 w-4 h-4 rounded border-white/[0.1] bg-surface text-primary focus:ring-primary"
                            />
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-text">Race Kit Claiming</span>
                                <p className="text-xs text-text-muted">Access Kiosk Mode to scan QR codes and claim race kits.</p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                value="participants"
                                {...register("permissions")}
                                className="mt-1 w-4 h-4 rounded border-white/[0.1] bg-surface text-primary focus:ring-primary"
                            />
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-text">Manage Participants</span>
                                <p className="text-xs text-text-muted">View participant list, search, and check registration status.</p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-colors opacity-50">
                            <input
                                type="checkbox"
                                value="announcements"
                                disabled
                                className="mt-1 w-4 h-4 rounded border-white/[0.1] bg-surface text-primary focus:ring-primary"
                            />
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-text flex items-center gap-2">
                                    Send Announcements <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">Soon</span>
                                </span>
                                <p className="text-xs text-text-muted">Allow volunteer to send updates and notifications to participants.</p>
                            </div>
                        </label>
                    </div>
                    {errors.permissions && (
                        <p className="text-xs text-red-500 font-medium">{errors.permissions.message}</p>
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        isLoading={isSubmitting}
                    >
                        Send Invitation
                    </Button>
                </div>
            </form>
            </DialogContent>
        </Dialog>
    );
}
