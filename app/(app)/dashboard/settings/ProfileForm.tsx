"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import { profileSchema, ProfileFormValues, calculateCompletion } from "@/lib/validations/profile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, Loader2, User as UserIcon, MapPin, ShieldAlert, Shirt, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function ProfileForm() {
    const { user, refreshUser } = useAuth();
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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
        if (!user) return;
        setSaveStatus("saving");
        try {
            const userDocRef = doc(db, "users", user.uid);
            const completion = calculateCompletion(data);

            await setDoc(userDocRef, {
                ...data,
                profileCompletion: completion,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            await refreshUser();
            reset(data);

            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error) {
            console.error("Save error:", error);
            setSaveStatus("idle");
        }
    }, [user, reset, refreshUser]);

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
                                        await setDoc(doc(db, "users", user.uid), { photoURL: url }, { merge: true });
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Gender</label>
                                <select
                                    {...register("gender")}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                                >
                                    <option value="" className="bg-surface">Select</option>
                                    <option value="male" className="bg-surface">Male</option>
                                    <option value="female" className="bg-surface">Female</option>
                                    <option value="other" className="bg-surface">Other</option>
                                </select>
                                {errors.gender && <p className="text-[10px] text-red-500 font-bold italic">{errors.gender.message}</p>}
                            </div>
                            <Input
                                type="date"
                                label="Birth Date"
                                {...register("birthDate")}
                                error={errors.birthDate?.message}
                            />
                        </div>
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
                                        onClick={() => setValue("tShirtSize", size as any, { shouldDirty: true })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold text-xs border transition-all cursor-pointer",
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
                                        onClick={() => setValue("singletSize", size as any, { shouldDirty: true })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold text-xs border transition-all cursor-pointer",
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
