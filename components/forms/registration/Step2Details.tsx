"use client";

import { useFormContext } from "react-hook-form";
import { RaceEvent } from "@/types/event";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User, Phone, Mail, Shirt, HeartPulse, ShieldAlert } from "lucide-react";

interface Step2DetailsProps {
    event: RaceEvent;
}

const T_SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function Step2Details({ event }: Step2DetailsProps) {
    const { register, watch, formState: { errors } } = useFormContext<RegistrationFormValues>();
    const registrationType = watch("registrationType");

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-white">Participant <span className="text-primary">Details</span></h2>
                {registrationType === "self" ? (
                    <p className="text-text-muted font-medium">We&apos;ve auto-filled this from your profile. Please double check before proceeding.</p>
                ) : (
                    <div className="mt-2 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                        <User className="text-primary shrink-0 mt-0.5" size={18} />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white">You are registering someone else.</p>
                            <p className="text-xs text-text-muted">Please enter the participant&apos;s details below. They will be registered under your account.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        <User size={14} /> Basic Information
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Full Name</Label>
                            <Input {...register("participantInfo.name")} />
                            {errors.participantInfo?.name?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.participantInfo.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Email Address</Label>
                            <Input {...register("participantInfo.email")} />
                            {errors.participantInfo?.email?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.participantInfo.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Phone Number</Label>
                            <Input {...register("participantInfo.phone")} />
                            {errors.participantInfo?.phone?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.participantInfo.phone.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Gender</label>
                                <select
                                    {...register("participantInfo.gender")}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                                >
                                    <option value="" className="bg-surface">Select</option>
                                    <option value="male" className="bg-surface">Male</option>
                                    <option value="female" className="bg-surface">Female</option>
                                    <option value="other" className="bg-surface">Other</option>
                                </select>
                                {errors.participantInfo?.gender && <p className="text-xs text-red-500 font-bold">{errors.participantInfo.gender.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Birth Date</Label>
                                <Input type="date" {...register("participantInfo.birthDate")} />
                                {errors.participantInfo?.birthDate?.message && <p className="text-xs text-red-500 font-bold">{errors.participantInfo.birthDate.message}</p>}
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cta mt-8">
                        <Shirt size={14} /> Apparel Sizes
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">T-Shirt Size</label>
                            <select
                                {...register("participantInfo.tShirtSize")}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                            >
                                <option value="" className="bg-surface">Select</option>
                                {T_SHIRT_SIZES.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)}
                            </select>
                            {errors.participantInfo?.tShirtSize && <p className="text-xs text-red-500 font-bold">{errors.participantInfo.tShirtSize.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Singlet Size</label>
                            <select
                                {...register("participantInfo.singletSize")}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                            >
                                <option value="" className="bg-surface">Select</option>
                                {T_SHIRT_SIZES.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)}
                            </select>
                            {errors.participantInfo?.singletSize && <p className="text-xs text-red-500 font-bold">{errors.participantInfo.singletSize.message}</p>}
                        </div>
                    </Card>
                </div>

                {/* Emergency & Medical */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500">
                        <HeartPulse size={14} /> Emergency Contact
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Contact Name</Label>
                            <Input {...register("participantInfo.emergencyContact.name")} />
                            {errors.participantInfo?.emergencyContact?.name?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.participantInfo.emergencyContact.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Contact Phone</Label>
                            <Input {...register("participantInfo.emergencyContact.phone")} />
                            {errors.participantInfo?.emergencyContact?.phone?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.participantInfo.emergencyContact.phone.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Relationship</Label>
                            <Input {...register("participantInfo.emergencyContact.relationship")} placeholder="e.g. Spouse, Parent" />
                            {errors.participantInfo?.emergencyContact?.relationship?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.participantInfo.emergencyContact.relationship.message}</p>}
                        </div>
                    </Card>

                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow-500 mt-8">
                        <ShieldAlert size={14} /> Medical Info
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Medical Conditions (Optional)</label>
                            <textarea
                                {...register("participantInfo.medicalConditions")}
                                placeholder="e.g. Allergies, Asthma..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-yellow-500 transition-all min-h-[100px]"
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
