"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
    Check, Loader2, Building2, Mail, Phone, Globe,
    ShieldCheck, CalendarCheck, AlertCircle, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizerType } from "@/types/user";

const ORGANIZER_TYPES: { value: OrganizerType; label: string; description: string }[] = [
    { value: "individual", label: "Individual", description: "Solo race director" },
    { value: "sports_club", label: "Sports Club", description: "Running / triathlon club" },
    { value: "business", label: "Business", description: "Registered events company" },
    { value: "lgu", label: "LGU", description: "Local Government Unit" },
    { value: "school", label: "School", description: "School or university" },
    { value: "nonprofit", label: "Nonprofit", description: "NGO, foundation, charity" },
];

const organizerProfileSchema = z.object({
    name: z.string().min(2, "Organization name is too short"),
    contactEmail: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Phone number is too short").or(z.literal("")),
    organizerType: z.enum(["individual", "sports_club", "business", "lgu", "school", "nonprofit"]),
});

type OrganizerProfileFormValues = z.infer<typeof organizerProfileSchema>;

export function OrganizerProfileForm() {
    const { user, refreshUser } = useAuth();
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

    const organizer = user?.organizer;

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<OrganizerProfileFormValues>({
        resolver: zodResolver(organizerProfileSchema),
        defaultValues: {
            name: organizer?.name || "",
            contactEmail: organizer?.contactEmail || "",
            phone: organizer?.phone || "",
            organizerType: organizer?.organizerType || "individual",
        },
    });

    // Reset form when user data loads
    useEffect(() => {
        if (organizer) {
            reset({
                name: organizer.name || "",
                contactEmail: organizer.contactEmail || "",
                phone: organizer.phone || "",
                organizerType: organizer.organizerType || "individual",
            });
        }
    }, [organizer, reset]);

    const onSubmit = useCallback(async (data: OrganizerProfileFormValues) => {
        if (!user) return;
        setSaveStatus("saving");
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: serverTimestamp(),
                });
            }

            await updateDoc(userDocRef, {
                "organizer.name": data.name,
                "organizer.contactEmail": data.contactEmail,
                "organizer.phone": data.phone,
                "organizer.organizerType": data.organizerType,
                updatedAt: serverTimestamp(),
            });

            await refreshUser();
            reset(data);
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error) {
            console.error("Organizer profile save error:", error);
            setSaveStatus("idle");
        }
    }, [user, reset, refreshUser]);

    const watchedFields = watch();

    if (!organizer) {
        return (
            <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                <AlertCircle className="mx-auto text-text-muted opacity-20" size={48} />
                <p className="text-text-muted italic font-medium">No organizer profile found.</p>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mx-auto">
            {/* Approval Status Banner */}
            <Card className={cn(
                "p-5 flex items-center gap-4 border",
                organizer.approved
                    ? "bg-cta/5 border-cta/20"
                    : "bg-amber-500/5 border-amber-500/20"
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    organizer.approved ? "bg-cta/10 text-cta" : "bg-amber-500/10 text-amber-500"
                )}>
                    {organizer.approved ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold italic text-white uppercase">
                            {organizer.approved ? "Verified Organizer" : "Pending Verification"}
                        </p>
                        <Badge
                            variant={organizer.approved ? "success" : "secondary"}
                            className={cn(
                                "text-[8px] font-black italic uppercase px-2 py-0 border-none",
                                organizer.approved ? "bg-cta/20 text-cta" : "bg-amber-500/20 text-amber-500"
                            )}
                        >
                            {organizer.approved ? "Approved" : "Pending"}
                        </Badge>
                    </div>
                    <p className="text-[10px] text-text-muted font-medium italic mt-0.5">
                        {organizer.approved
                            ? "Your organizer account is verified. You can create and manage events."
                            : "Your application is under review. You'll be notified once approved."}
                    </p>
                </div>
                {organizer.approvedAt && (
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-bold italic uppercase tracking-wider shrink-0">
                        <CalendarCheck size={12} className="text-cta" />
                        Approved
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Organization Info */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Building2 size={20} className="text-primary" />
                        <h3 className="font-black italic uppercase tracking-tight">Organization Info</h3>
                    </div>
                    <div className="space-y-4">
                        <Input
                            label="Organization Name"
                            {...register("name")}
                            error={errors.name?.message}
                            placeholder="e.g. RunPH Events"
                        />
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Organization Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ORGANIZER_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setValue("organizerType", type.value, { shouldDirty: true })}
                                        className={cn(
                                            "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                            watchedFields.organizerType === type.value
                                                ? "bg-primary/10 border-primary/40 shadow-lg"
                                                : "bg-white/5 border-white/10 hover:border-primary/30"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-xs font-bold uppercase italic",
                                            watchedFields.organizerType === type.value ? "text-primary" : "text-white"
                                        )}>
                                            {type.label}
                                        </p>
                                        <p className="text-[9px] text-text-muted font-medium italic mt-0.5">
                                            {type.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact Details */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Mail size={20} className="text-cta" />
                        <h3 className="font-black italic uppercase tracking-tight">Contact Details</h3>
                    </div>
                    <div className="space-y-4">
                        <Input
                            label="Contact Email"
                            type="email"
                            {...register("contactEmail")}
                            error={errors.contactEmail?.message}
                            placeholder="events@yourorg.com"
                        />
                        <Input
                            label="Phone Number"
                            {...register("phone")}
                            error={errors.phone?.message}
                            placeholder="e.g. 09171234567"
                        />
                    </div>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 pt-4">
                {saveStatus === "saved" && (
                    <span className="flex items-center gap-2 text-cta text-xs font-bold uppercase italic tracking-widest animate-in fade-in duration-300">
                        <Check size={16} /> Changes Saved
                    </span>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!isDirty || saveStatus === "saving"}
                    className="font-black italic uppercase tracking-wider px-8"
                >
                    {saveStatus === "saving" ? (
                        <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</>
                    ) : (
                        <><Save size={18} className="mr-2" /> Save Changes</>
                    )}
                </Button>
            </div>
        </form>
    );
}
