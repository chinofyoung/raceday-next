"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Megaphone, Mail, Loader2, Plus, Clock, Wand2, Sparkles, AlertCircle, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Image from "next/image";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface AnnouncementsTabProps {
    eventId: string;
}

export function AnnouncementsTab({ eventId }: AnnouncementsTabProps) {
    const { user } = useAuth();
    const announcementsData = useQuery(api.announcements.listByEvent, { eventId: eventId as Id<"events"> });
    const createMutation = useMutation(api.announcements.create);
    const updateMutation = useMutation(api.announcements.update);
    const removeMutation = useMutation(api.announcements.remove);
    const sendEmailAction = useAction(api.emails.sendAnnouncementEmail);

    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [sendEmail, setSendEmail] = useState(false);

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [showAiMenu, setShowAiMenu] = useState(false);

    // Edit/Delete State
    const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
    const [isDeletingId, setIsDeletingId] = useState<Id<"announcements"> | null>(null);

    const handleAiAction = async (action: "draft" | "improve" | "make-formal" | "make-exciting") => {
        if (action === "draft" && !title.trim()) {
            setAiError("Please provide an Announcement Title to draft from.");
            return;
        }

        if (action !== "draft" && !message.trim()) {
            setAiError("Please provide some message text for the AI to improve/rewrite.");
            return;
        }

        setIsAiLoading(true);
        setAiError(null);
        setShowAiMenu(false);

        try {
            const res = await fetch("/api/ai/announcement-assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, message, action }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to generate AI content");
            }

            const data = await res.json();

            if (data.message) {
                setMessage(data.message);
            } else if (data.text) {
                setMessage(data.text);
            }
        } catch (error: any) {
            console.error(error);
            setAiError(error.message || "An error occurred with the AI assistant.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingAnnouncement) {
            if (!editingAnnouncement.title.trim() || !editingAnnouncement.message.trim()) return;
            setSubmitting(true);
            try {
                await updateMutation({
                    id: editingAnnouncement._id,
                    data: {
                        title: editingAnnouncement.title,
                        message: editingAnnouncement.message,
                        imageUrl: editingAnnouncement.imageUrl
                    }
                });
                toast.success("Announcement updated!");
                setEditingAnnouncement(null);
            } catch (error) {
                console.error(error);
                toast.error("Error updating announcement.");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!title.trim() || !message.trim()) return;

        setSubmitting(true);
        try {
            if (!user) throw new Error("User not authenticated");

            // 1. Create the announcement
            await createMutation({
                eventId: eventId as Id<"events">,
                organizerId: user._id as Id<"users">,
                title,
                message,
                sendEmail,
                imageUrl,
                createdBy: user.uid,
            });

            // 2. If sendEmail is checked, trigger the email blast action
            if (sendEmail) {
                toast.info("Sending email blast in background...");
                sendEmailAction({
                    eventId: eventId as Id<"events">,
                    title,
                    message,
                }).catch(err => {
                    console.error("Email blast failed:", err);
                    toast.error("Failed to send email blast.");
                });
            }

            toast.success("Announcement published!");
            setTitle("");
            setMessage("");
            setImageUrl("");
            setSendEmail(false);
            setIsCreating(false);
        } catch (error) {
            console.error(error);
            toast.error("Error creating announcement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"announcements">) => {
        if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) return;

        setIsDeletingId(id);
        try {
            await removeMutation({ id });
            toast.success("Announcement deleted.");
        } catch (error) {
            console.error(error);
            toast.error("Error deleting announcement.");
        } finally {
            setIsDeletingId(null);
        }
    };

    if (announcementsData === undefined) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Announcements</h3>
                {!isCreating && (
                    <Button
                        variant="primary"
                        onClick={() => setIsCreating(true)}
                        className="gap-2 font-black italic uppercase bg-cta hover:bg-cta-hover border-none"
                    >
                        <Plus size={16} /> New Announcement
                    </Button>
                )}
            </div>

            {isCreating && (
                <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border border-white/5 shadow-2xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Draft Announcement</h2>
                        <p className="text-text-muted font-medium text-sm">Notify your runners about important updates, changes, or news.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <Input
                                label="Announcement Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Change in Assembly Time"
                                required
                                className="text-lg font-bold"
                            />
                        </div>

                        <ImageUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            label="Post Header Image"
                            className="w-full border-white/10"
                            aspectRatio="banner"
                        />

                        <div className="space-y-6 relative group">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">Message & Details</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowAiMenu(!showAiMenu)}
                                        disabled={isAiLoading || submitting}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-primary border border-white/5 transition-all disabled:opacity-50"
                                    >
                                        {isAiLoading ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                        AI Assist
                                    </button>

                                    {showAiMenu && (
                                        <div className="absolute right-0 top-10 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                                            <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                                                <span className="text-[9px] uppercase font-black text-text-muted italic tracking-widest flex items-center gap-1.5"><Sparkles size={10} className="text-primary" /> AI tools</span>
                                            </div>
                                            <button type="button" onClick={() => handleAiAction("draft")} className="w-full text-left px-3 py-2.5 text-xs text-text hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 italic font-medium">Draft from Title</button>
                                            <button type="button" onClick={() => handleAiAction("improve")} className="w-full text-left px-3 py-2.5 text-xs text-text hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 italic font-medium">✨ Improve Quality</button>
                                            <button type="button" onClick={() => handleAiAction("make-exciting")} className="w-full text-left px-3 py-2.5 text-xs text-text hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 italic font-medium">🔥 Make it Exciting</button>
                                            <button type="button" onClick={() => handleAiAction("make-formal")} className="w-full text-left px-3 py-2.5 text-xs text-text hover:bg-white/5 hover:text-white transition-colors italic font-medium">👔 Make it Formal</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {aiError && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium italic animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={14} className="shrink-0" />
                                    {aiError}
                                </div>
                            )}

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your announcement details here..."
                                rows={6}
                                required
                                disabled={isAiLoading}
                                className={cn(
                                    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[150px]",
                                    isAiLoading && "opacity-50"
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-3 p-5 bg-surface/50 rounded-2xl border border-white/5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group" onClick={() => setSendEmail(!sendEmail)}>
                            <div className={cn("w-5 h-5 rounded flex items-center justify-center transition-colors border", sendEmail ? 'bg-primary border-primary' : 'border-white/20 bg-black/20 group-hover:border-primary/50')}>
                                {sendEmail && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
                            </div>
                            <div className="space-y-0.5">
                                <span className={cn("text-sm font-bold italic transition-colors", sendEmail ? "text-primary" : "text-white")}>Email Blast</span>
                                <p className="text-xs text-text-muted">Simultaneously send this announcement as an email to all registered participants.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreating(false)}
                                disabled={submitting}
                                className="px-6 border-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting || !title.trim() || !message.trim()}
                                className="px-8 bg-cta hover:bg-cta-hover border-none font-black italic uppercase tracking-widest shadow-lg shadow-cta/20"
                            >
                                {submitting ? (
                                    <><Loader2 className="animate-spin mr-2" size={16} /> Publishing...</>
                                ) : (
                                    <>Publish Announcement</>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {editingAnnouncement && (
                <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border border-primary/20 shadow-2xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Edit Announcement</h2>
                            <p className="text-text-muted font-medium text-sm">Update the details of your announcement.</p>
                        </div>
                        <button
                            onClick={() => setEditingAnnouncement(null)}
                            className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <Input
                                label="Announcement Title"
                                value={editingAnnouncement.title}
                                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                                placeholder="e.g., Change in Assembly Time"
                                required
                                className="text-lg font-bold"
                            />
                        </div>

                        <ImageUpload
                            value={editingAnnouncement.imageUrl || ""}
                            onChange={(url) => setEditingAnnouncement({ ...editingAnnouncement, imageUrl: url })}
                            label="Post Header Image"
                            className="w-full border-white/10"
                            aspectRatio="banner"
                        />

                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">Message & Details</label>
                            <textarea
                                value={editingAnnouncement.message}
                                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                                placeholder="Write your announcement details here..."
                                rows={6}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[150px]"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingAnnouncement(null)}
                                disabled={submitting}
                                className="px-6 border-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting || !editingAnnouncement.title.trim() || !editingAnnouncement.message.trim()}
                                className="px-8 bg-primary hover:bg-primary-hover border-none font-black italic uppercase tracking-widest shadow-lg shadow-primary/20"
                            >
                                {submitting ? (
                                    <><Loader2 className="animate-spin mr-2" size={16} /> Updating...</>
                                ) : (
                                    <>Update Announcement</>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="space-y-4">
                {(announcementsData || []).length === 0 ? (
                    <Card className="p-12 border border-white/5 border-dashed bg-transparent text-center space-y-3">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <p className="text-white font-bold italic uppercase">No Announcements Yet</p>
                            <p className="text-text-muted text-sm max-w-sm mx-auto">
                                Keep your participants informed. Create an announcement to notify them about important updates.
                            </p>
                        </div>
                    </Card>
                ) : (
                    announcementsData?.map((announcement) => (
                        <Card key={announcement._id} className="p-6 bg-surface border-white/5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-white uppercase italic">{announcement.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-medium mt-1">
                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {format(new Date(announcement.createdAt), "MMM d, yyyy h:mm a")}</span>
                                        {announcement.sendEmail && (
                                            <span className="flex items-center gap-1.5 text-primary">
                                                <Mail size={12} /> Sent as Email Blast {announcement.sentCount ? `(${announcement.sentCount})` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setEditingAnnouncement(announcement)}
                                        className="p-2 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg text-text-muted transition-all"
                                        title="Edit Announcement"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement._id)}
                                        disabled={isDeletingId === announcement._id}
                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-muted transition-all disabled:opacity-50"
                                        title="Delete Announcement"
                                    >
                                        {isDeletingId === announcement._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                    <div className="p-2 bg-white/5 rounded-full text-text-muted">
                                        <Megaphone size={16} />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/5 space-y-4">
                                {announcement.imageUrl && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                        <Image
                                            src={announcement.imageUrl}
                                            alt={announcement.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
                                    {announcement.message}
                                </p>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
