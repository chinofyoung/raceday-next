"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import { profileSchema, ProfileFormValues, calculateCompletion } from "@/lib/validations/profile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, Loader2, User as UserIcon, MapPin, ShieldAlert, Shirt, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function ProfileForm() {
    const { user, refreshUser } = useAuth();
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const isFirstRender = useRef(true);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: user?.displayName || "",
            phone: user?.phone || "",
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

    const saveProfile = useCallback(async (data: ProfileFormValues) => {
        if (!user) return;
        setSaveStatus("saving");
        try {
            const userDocRef = doc(db, "users", user.uid);
            const completion = calculateCompletion(data);

            await updateDoc(userDocRef, {
                ...data,
                profileCompletion: completion,
                updatedAt: serverTimestamp(),
            });

            await refreshUser();

            // Reset form with current values to clear dirty state
            reset(data);

            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error) {
            console.error("Autosave error:", error);
            setSaveStatus("idle");
        }
    }, [user, reset]);

    const watchedFields = watch();

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Only save if there are changes (isDirty is true)
        if (!isDirty) return;

        const timer = setTimeout(() => {
            if (!errors.displayName) {
                saveProfile(watchedFields);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [watchedFields, saveProfile, errors.displayName, isDirty]);

    return (
        <div className="space-y-8 mx-auto">
            {/* Autosave Status Indicator */}
            <div className="fixed bottom-8 right-8 z-[100]">
                <div className={cn(
                    "px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-500 border",
                    saveStatus === "saving" ? "bg-surface border-primary text-primary opacity-100 translate-y-0" :
                        saveStatus === "saved" ? "bg-cta/20 border-cta text-cta opacity-100 translate-y-0" :
                            "opacity-0 translate-y-10"
                )}>
                    {saveStatus === "saving" && <Loader2 size={18} className="animate-spin" />}
                    {saveStatus === "saved" && <Check size={18} />}
                    <span className="font-bold uppercase italic tracking-widest text-xs">
                        {saveStatus === "saving" ? "Saving Changes..." : "Changes Saved"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section: Profile Photo */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5 md:col-span-2">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <ImageUpload
                                value={user?.photoURL || ""}
                                onChange={async (url) => {
                                    if (user) {
                                        await updateDoc(doc(db, "users", user.uid), { photoURL: url });
                                        await refreshUser();
                                    }
                                }}
                                aspectRatio="square"
                                className="w-32 h-32 rounded-full"
                                label="" // No label inside
                            />
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h3 className="text-xl font-bold uppercase italic tracking-tight text-white leading-none">Profile Image</h3>
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
                        <h3 className="font-black italic uppercase tracking-tight">Personal Information</h3>
                    </div>
                    <div className="space-y-4">
                        <Input
                            label="Display Name"
                            {...register("displayName")}
                            error={errors.displayName?.message}
                        />
                        <Input
                            label="Phone Number"
                            {...register("phone")}
                            error={errors.phone?.message}
                            placeholder="e.g. 09123456789"
                        />
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Medical Conditions</label>
                            <textarea
                                {...register("medicalConditions")}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                                placeholder="List any allergies or medical conditions..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Section: Address */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <MapPin size={20} className="text-cta" />
                        <h3 className="font-black italic uppercase tracking-tight">Residential Address</h3>
                    </div>
                    <div className="space-y-4">
                        <Input label="Street Address" {...register("address.street")} placeholder="Building, Street Name" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="City" {...register("address.city")} />
                            <Input label="Province" {...register("address.province")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="ZIP Code" {...register("address.zipCode")} />
                            <Input label="Country" {...register("address.country")} />
                        </div>
                    </div>
                </Card>

                {/* Section: Emergency Contact */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <ShieldAlert size={20} className="text-red-500" />
                        <h3 className="font-black italic uppercase tracking-tight">Emergency Contact</h3>
                    </div>
                    <div className="space-y-4">
                        <Input label="Contact Name" {...register("emergencyContact.name")} />
                        <Input label="Relationship" {...register("emergencyContact.relationship")} />
                        <Input label="Contact Phone" {...register("emergencyContact.phone")} error={errors.emergencyContact?.phone?.message} />
                    </div>
                </Card>

                {/* Section: Apparel Sizes */}
                <Card className="p-8 space-y-6 bg-surface/50 border-white/5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Shirt size={20} className="text-blue-500" />
                        <h3 className="font-black italic uppercase tracking-tight">Race Apparel Sizes</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">T-Shirt Size</label>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => saveProfile({ ...watchedFields, tShirtSize: size as any })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold text-xs border transition-all",
                                            watchedFields.tShirtSize === size
                                                ? "bg-primary border-primary text-white shadow-lg scale-105"
                                                : "bg-white/5 border-white/10 text-text-muted hover:border-primary/50"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Singlet Size</label>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => saveProfile({ ...watchedFields, singletSize: size as any })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold text-xs border transition-all",
                                            watchedFields.singletSize === size
                                                ? "bg-cta border-cta text-white shadow-lg scale-105"
                                                : "bg-white/5 border-white/10 text-text-muted hover:border-cta/50"
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
        </div>
    );
}
