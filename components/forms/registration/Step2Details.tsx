"use client";

import { useFormContext } from "react-hook-form";
import { RaceEvent } from "@/types/event";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
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
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Participant <span className="text-primary">Details</span></h2>
                {registrationType === "self" ? (
                    <p className="text-text-muted font-medium italic">We&apos;ve auto-filled this from your profile. Please double check before proceeding.</p>
                ) : (
                    <div className="mt-2 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                        <User className="text-primary shrink-0 mt-0.5" size={18} />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white italic">You are registering someone else.</p>
                            <p className="text-xs text-text-muted italic">Please enter the participant&apos;s details below. They will be registered under your account.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                        <User size={14} /> Basic Information
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 space-y-4">
                        <Input
                            label="Full Name"
                            {...register("participantInfo.name")}
                            error={errors.participantInfo?.name?.message}
                        />
                        <Input
                            label="Email Address"
                            {...register("participantInfo.email")}
                            error={errors.participantInfo?.email?.message}
                        />
                        <Input
                            label="Phone Number"
                            {...register("participantInfo.phone")}
                            error={errors.participantInfo?.phone?.message}
                        />
                    </Card>

                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cta italic mt-8">
                        <Shirt size={14} /> Apparel Sizes
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">T-Shirt Size</label>
                            <select
                                {...register("participantInfo.tShirtSize")}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                            >
                                <option value="" className="bg-surface">Select</option>
                                {T_SHIRT_SIZES.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)}
                            </select>
                            {errors.participantInfo?.tShirtSize && <p className="text-[10px] text-red-500 font-bold italic">{errors.participantInfo.tShirtSize.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Singlet Size</label>
                            <select
                                {...register("participantInfo.singletSize")}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                            >
                                <option value="" className="bg-surface">Select</option>
                                {T_SHIRT_SIZES.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)}
                            </select>
                            {errors.participantInfo?.singletSize && <p className="text-[10px] text-red-500 font-bold italic">{errors.participantInfo.singletSize.message}</p>}
                        </div>
                    </Card>
                </div>

                {/* Emergency & Medical */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 italic">
                        <HeartPulse size={14} /> Emergency Contact
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 space-y-4">
                        <Input
                            label="Contact Name"
                            {...register("participantInfo.emergencyContact.name")}
                            error={errors.participantInfo?.emergencyContact?.name?.message}
                        />
                        <Input
                            label="Contact Phone"
                            {...register("participantInfo.emergencyContact.phone")}
                            error={errors.participantInfo?.emergencyContact?.phone?.message}
                        />
                        <Input
                            label="Relationship"
                            {...register("participantInfo.emergencyContact.relationship")}
                            error={errors.participantInfo?.emergencyContact?.relationship?.message}
                            placeholder="e.g. Spouse, Parent"
                        />
                    </Card>

                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-500 italic mt-8">
                        <ShieldAlert size={14} /> Medical Info
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Medical Conditions (Optional)</label>
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
