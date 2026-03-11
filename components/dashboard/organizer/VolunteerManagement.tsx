"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteVolunteerDialog } from "./InviteVolunteerDialog";
import { EventVolunteer, VolunteerPermission } from "@/types/volunteer";
import { format } from "date-fns";
import { toDate } from "@/lib/utils";
import {
    Users,
    Trash2,
    UserPlus,
    Mail,
    Clock,
    CheckCircle2,
    ShieldX,
    RotateCcw,
    UserMinus
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BaseQuickAction } from "@/components/dashboard/shared/BaseQuickAction";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/hooks/useAuth";

interface VolunteerManagementProps {
    eventId: string;
}

export function VolunteerManagement({ eventId }: VolunteerManagementProps) {
    const { user } = useAuth();
    const [isInviteOpen, setIsInviteOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"active" | "revoked">("active");
    const [revokeModal, setRevokeModal] = React.useState<{ open: boolean; volunteerId: Id<"volunteers"> | null }>({
        open: false,
        volunteerId: null,
    });
    const [isRevoking, setIsRevoking] = React.useState(false);

    const [restoreModal, setRestoreModal] = React.useState<{ open: boolean; volunteerId: Id<"volunteers"> | null }>({
        open: false,
        volunteerId: null,
    });
    const [isRestoring, setIsRestoring] = React.useState(false);

    const [deleteModal, setDeleteModal] = React.useState<{ open: boolean; volunteerId: Id<"volunteers"> | null }>({
        open: false,
        volunteerId: null,
    });
    const [isDeleting, setIsDeleting] = React.useState(false);

    const volunteers = useQuery(api.volunteers.listByEvent, { eventId: eventId as Id<"events"> });
    const revokeMutation = useMutation(api.volunteers.revoke);
    const restoreMutation = useMutation(api.volunteers.restore);
    const deleteMutation = useMutation(api.volunteers.remove);

    const handleRevoke = async () => {
        if (!revokeModal.volunteerId) return;
        setIsRevoking(true);
        try {
            await revokeMutation({ id: revokeModal.volunteerId });
            toast.success("Volunteer access revoked");
            setRevokeModal({ open: false, volunteerId: null });
        } catch (error: any) {
            toast.error(error.message || "Failed to revoke access");
        } finally {
            setIsRevoking(false);
        }
    };

    const handleRestore = async () => {
        if (!restoreModal.volunteerId) return;
        setIsRestoring(true);
        try {
            await restoreMutation({ id: restoreModal.volunteerId });
            toast.success("Volunteer access restored");
            setRestoreModal({ open: false, volunteerId: null });
        } catch (error: any) {
            toast.error(error.message || "Failed to restore access");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.volunteerId) return;
        setIsDeleting(true);
        try {
            await deleteMutation({ id: deleteModal.volunteerId });
            toast.success("Volunteer deleted");
            setDeleteModal({ open: false, volunteerId: null });
        } catch (error: any) {
            toast.error(error.message || "Failed to delete volunteer");
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "accepted":
                return <Badge variant="success" className="text-[10px] font-black italic uppercase px-2.5 py-0.5">Active</Badge>;
            case "pending":
                return <Badge variant="warning" className="text-[10px] font-black italic uppercase px-2.5 py-0.5">Pending</Badge>;
            case "revoked":
                return <Badge variant="destructive" className="text-[10px] font-black italic uppercase px-2.5 py-0.5">Revoked</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px] font-black italic uppercase px-2.5 py-0.5">{status}</Badge>;
        }
    };

    const getPermissionLabel = (permission: string) => {
        switch (permission) {
            case "kiosk": return "Kiosk";
            case "participants": return "Participants";
            case "announcements": return "Announcements";
            default: return permission;
        }
    };

    if (volunteers === undefined) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-text flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" />
                        Volunteer Team
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                        Manage people who help you with race kit claiming and participant management.
                    </p>
                </div>
                <BaseQuickAction
                    onClick={() => setIsInviteOpen(true)}
                    icon={UserPlus}
                    label="Invite Volunteer"
                    variant="cta"
                />
            </div>

            <div className="flex items-center gap-1 border-b border-white/5 pb-0">
                <button
                    onClick={() => setActiveTab("active")}
                    className={cn(
                        "px-4 py-2 text-xs font-black uppercase tracking-widest italic transition-colors relative",
                        activeTab === "active" ? "text-primary" : "text-text-muted hover:text-white"
                    )}
                >
                    Active Team
                    {activeTab === "active" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("revoked")}
                    className={cn(
                        "px-4 py-2 text-xs font-black uppercase tracking-widest italic transition-colors relative",
                        activeTab === "revoked" ? "text-red-500" : "text-text-muted hover:text-white"
                    )}
                >
                    Revoked Access
                    {activeTab === "revoked" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                    )}
                </button>
            </div>

            {volunteers.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 text-surface">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-bold text-text">No volunteers yet</h3>
                    <p className="text-sm text-text-muted max-w-sm mt-2 mb-6">
                        Get some help on race day! Invite volunteers by their Gmail address to handle check-ins and registrations.
                    </p>
                    <Button onClick={() => setIsInviteOpen(true)} variant="outline">
                        Invite your first volunteer
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {volunteers
                        .filter(v => activeTab === "active" ? v.status !== "revoked" : v.status === "revoked")
                        .length === 0 ? (
                        <div className="p-12 text-center text-text-muted italic text-sm">
                            No {activeTab} volunteers found.
                        </div>
                    ) : (
                        volunteers
                            .filter(v => activeTab === "active" ? v.status !== "revoked" : v.status === "revoked")
                            .map((volunteer) => (
                                <div
                                    key={volunteer._id}
                                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center overflow-hidden border border-white/[0.1]">
                                            {volunteer.photoURL ? (
                                                <img src={volunteer.photoURL} alt={volunteer.displayName || "Volunteer"} className="w-full h-full object-cover" />
                                            ) : (
                                                <Mail className="w-5 h-5 text-text-muted" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-text">
                                                    {volunteer.displayName || volunteer.email.split('@')[0]}
                                                </span>
                                                {getStatusBadge(volunteer.status)}
                                            </div>
                                            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {volunteer.email}
                                                </span>
                                                {volunteer.invitedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Invited {format(toDate(volunteer.invitedAt), 'MMM d, yyyy')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6">
                                        <div className="flex flex-wrap gap-1.5">
                                            {volunteer.permissions.map((p: string) => (
                                                <Badge key={p} variant="secondary" className="bg-white/[0.05] border-white/[0.05] text-[10px] font-black italic uppercase px-2.5 py-0.5">
                                                    {getPermissionLabel(p)}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 transition-opacity">
                                            {volunteer.status !== 'revoked' ? (
                                                <button
                                                    onClick={() => setRevokeModal({ open: true, volunteerId: volunteer._id })}
                                                    className="p-2 rounded-xl bg-red-500/0 hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors"
                                                    title="Revoke access"
                                                >
                                                    <UserMinus className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setRestoreModal({ open: true, volunteerId: volunteer._id })}
                                                    className="p-2 rounded-xl bg-emerald-500/0 hover:bg-emerald-500/10 text-text-muted hover:text-emerald-500 transition-colors"
                                                    title="Restore access"
                                                >
                                                    <RotateCcw className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteModal({ open: true, volunteerId: volunteer._id })}
                                                className="p-2 rounded-xl bg-red-500/0 hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors"
                                                title="Delete volunteer"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}

            <InviteVolunteerDialog
                open={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                eventId={eventId}
                onSuccess={() => { }}
            />

            <AlertDialog open={revokeModal.open} onOpenChange={(open) => !open && setRevokeModal({ open: false, volunteerId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Volunteer Access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This volunteer will immediately lose access to kiosk mode and participant data for this event. They will need to be re-invited to regain access.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRevokeModal({ open: false, volunteerId: null })}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevoke} disabled={isRevoking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isRevoking ? "Revoking..." : "Revoke"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, volunteerId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Volunteer Access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will restore the volunteer&apos;s access with their previous permission settings. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRestoreModal({ open: false, volunteerId: null })}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
                            {isRestoring ? "Restoring..." : "Restore"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, volunteerId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Volunteer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the volunteer invitation and their access. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteModal({ open: false, volunteerId: null })}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
