"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { profileSchema, ProfileFormValues, calculateCompletion } from "@/lib/validations/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2, User as UserIcon, MapPin, ShieldAlert, Shirt, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function ProfileForm() {
    const { user } = useAuth();
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const updateProfile = useMutation(api.users.updateProfile);
    const updatePhotoURL = useMutation(api.users.updatePhotoURL);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: user?.displayName || "",
            phone: user?.phone || "",
            gender: user?.gender || "",
            birthDate: user?.birthDate || "",
            medicalConditions: user?.medicalConditions || "",
            tShirtSize: user?.tShirtSize || "",
            singletSize: user?.singletSize || "",
            address: {
                street: user?.address?.street || "",
                city: user?.address?.city || "",
                province: user?.address?.province || "",
                zipCode: user?.address?.zipCode || "",
                country: user?.address?.country || "Philippines",
            },
            emergencyContact: {
                name: user?.emergencyContact?.name || "",
                phone: user?.emergencyContact?.phone || "",
                relationship: user?.emergencyContact?.relationship || "",
            },
        },
    });

    const onSubmit = useCallback(async (data: ProfileFormValues) => {
        if (!user) {
            toast.error("User record not found. Please refresh or try again later.");
            return;
        }

        const loadingToast = toast.loading("Saving changes...");
        setSaveStatus("saving");
        try {
            const completion = calculateCompletion(data);

            await updateProfile({
                ...data,
                profileCompletion: completion,
            });

            reset(data);
            setSaveStatus("saved");
            toast.success("Profile updated successfully!", { id: loadingToast });
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error: any) {
            console.error("Save error:", error);
            setSaveStatus("idle");
            toast.error("Failed to update profile.", {
                id: loadingToast,
                description: error?.message || "Please check your connection."
            });
        }
    }, [user, reset, updateProfile]);

    const watchedFields = watch();

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section: Profile Photo */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5 md:col-span-2">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <ImageUpload
                                value={user?.photoURL || ""}
                                onChange={async (url) => {
                                    if (user) {
                                        await updatePhotoURL({ photoURL: url });
                                    }
                                }}
                                aspectRatio="square"
                                className="w-32 h-32 rounded-full"
                                label="" // No label inside
                            />
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h3 className="text-xl font-bold tracking-tight text-white leading-none">Profile Image</h3>
                            <p className="text-sm text-text-muted leading-relaxed max-w-sm font-medium">
                                Upload a clear headshot. This helps organizers identify you at race kit collection and finishers&apos; lines.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Section: Personal Info */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <UserIcon size={20} className="text-primary" />
                        <h3 className="font-bold tracking-tight">Personal Information</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Display Name</Label>
                            <Input className="bg-white/5 border-white/10 rounded-xl" {...register("displayName")} />
                            {errors.displayName && <p className="text-xs text-destructive font-bold uppercase">{errors.displayName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Phone Number</Label>
                            <Input className="bg-white/5 border-white/10 rounded-xl" placeholder="e.g. 09123456789" {...register("phone")} />
                            {errors.phone && <p className="text-xs text-destructive font-bold uppercase">{errors.phone.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Gender</label>
                                <select
                                    {...register("gender")}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors px-4 py-2.5 appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-surface">Select</option>
                                    <option value="male" className="bg-surface">Male</option>
                                    <option value="female" className="bg-surface">Female</option>
                                    <option value="other" className="bg-surface">Other</option>
                                </select>
                                {errors.gender && <p className="text-xs text-red-500 font-bold">{errors.gender.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Birth Date</Label>
                                <Input type="date" className="bg-white/5 border-white/10 rounded-xl" {...register("birthDate")} />
                                {errors.birthDate && <p className="text-xs text-destructive font-bold uppercase">{errors.birthDate.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Medical Conditions</label>
                            <textarea
                                {...register("medicalConditions")}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors min-h-[120px]"
                                placeholder="List any allergies or medical conditions..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Section: Address */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <MapPin size={20} className="text-cta" />
                        <h3 className="font-bold tracking-tight">Residential Address</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Street Address</Label>
                            <Input className="bg-white/5 border-white/10 rounded-xl" placeholder="Building, Street Name" {...register("address.street")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">City</Label>
                                <Input className="bg-white/5 border-white/10 rounded-xl" {...register("address.city")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Province</Label>
                                <Input className="bg-white/5 border-white/10 rounded-xl" {...register("address.province")} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">ZIP Code</Label>
                                <Input className="bg-white/5 border-white/10 rounded-xl" {...register("address.zipCode")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Country</Label>
                                <Input className="bg-white/5 border-white/10 rounded-xl" {...register("address.country")} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Section: Emergency Contact */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <ShieldAlert size={20} className="text-red-500" />
                        <h3 className="font-bold tracking-tight">Emergency Contact</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Contact Name</Label>
                            <Input className="bg-white/5 border-white/10 rounded-xl" {...register("emergencyContact.name")} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Relationship</Label>
                            <Input className="bg-white/5 border-white/10 rounded-xl" {...register("emergencyContact.relationship")} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Contact Phone</Label>
                            <Input className="bg-white/5 border-white/10 rounded-xl" {...register("emergencyContact.phone")} />
                            {errors.emergencyContact?.phone && <p className="text-xs text-destructive font-bold uppercase">{errors.emergencyContact.phone.message}</p>}
                        </div>
                    </div>
                </Card>

                {/* Section: Apparel Sizes */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Shirt size={20} className="text-blue-500" />
                        <h3 className="font-bold tracking-tight">Race Apparel Sizes</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">T-Shirt Size</label>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setValue("tShirtSize", size as any, { shouldDirty: true })}
                                        className={cn(
                                            "px-4 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer",
                                            watchedFields.tShirtSize === size
                                                ? "bg-primary border-primary text-white shadow-lg"
                                                : "bg-white/5 border-white/10 text-text-muted hover:border-primary/50"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Singlet Size</label>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setValue("singletSize", size as any, { shouldDirty: true })}
                                        className={cn(
                                            "px-4 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer",
                                            watchedFields.singletSize === size
                                                ? "bg-primary border-primary text-white shadow-lg"
                                                : "bg-white/5 border-white/10 text-text-muted hover:border-primary/50"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 pt-4">
                {saveStatus === "saved" && (
                    <span className="flex items-center gap-2 text-cta text-xs font-bold uppercase tracking-wider animate-in fade-in duration-300">
                        <Check size={16} /> Changes Saved
                    </span>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!isDirty || saveStatus === "saving"}
                    className="font-bold tracking-wider px-8"
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
