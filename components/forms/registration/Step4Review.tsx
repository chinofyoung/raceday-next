"use client";

import { useFormContext } from "react-hook-form";
import { RaceEvent } from "@/types/event";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, User, Phone, Mail, Shirt, HeartPulse, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";

interface Step4ReviewProps {
    event: RaceEvent;
}

export function Step4Review({ event }: Step4ReviewProps) {
    const { watch, register, formState: { errors } } = useFormContext<RegistrationFormValues>();
    const data = watch();

    const selectedCategory = event.categories.find(c => (c.id || "0") === data.categoryId) || event.categories[0];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Review & <span className="text-primary">Confirm</span></h2>
                <p className="text-text-muted font-medium italic">Please ensure all details are correct before completing your registration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Summary Section */}
                <div className="space-y-6">
                    <Card className="p-8 bg-surface/50 border-white/10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 bg-cta/5 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic text-xl">
                                    {selectedCategory ? formatDistance(selectedCategory.distance, selectedCategory.distanceUnit) : ""}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase text-white leading-tight">{selectedCategory?.name}</h3>
                                    <p className="text-[10px] font-bold text-text-muted italic uppercase tracking-widest">{event.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Runner Name</span>
                                    <span className="text-sm font-bold text-white uppercase italic">{data.participantInfo.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Apparel Sizes</span>
                                    <span className="text-sm font-bold text-white uppercase italic">T: {data.participantInfo.tShirtSize} | S: {data.participantInfo.singletSize}</span>
                                </div>
                                {data.vanityNumber && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Vanity Bib #</span>
                                        <span className="text-sm font-black text-primary uppercase italic">#{data.vanityNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-3 font-black italic uppercase">
                                <div className="flex items-center justify-between text-xs text-text-muted">
                                    <span>Registration Fee</span>
                                    <span>₱{data.basePrice}</span>
                                </div>
                                {data.vanityPremium > 0 && (
                                    <div className="flex items-center justify-between text-xs text-primary">
                                        <span>Vanity Number Premium</span>
                                        <span>+₱{data.vanityPremium}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-2xl text-white pt-2">
                                    <span className="tracking-tighter">Total Price</span>
                                    <span className="tracking-tighter">₱{data.totalPrice}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-surface/30 border-white/5 flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                            <HeartPulse size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Emergency Contact</p>
                            <p className="text-sm font-bold text-white uppercase italic">{data.participantInfo.emergencyContact.name}</p>
                            <p className="text-xs text-text-muted italic">{data.participantInfo.emergencyContact.phone} ({data.participantInfo.emergencyContact.relationship})</p>
                        </div>
                    </Card>
                </div>

                {/* Waiver Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white italic">
                        <FileText size={14} className="text-primary" /> Waiver & Terms
                    </div>
                    <Card className="p-6 bg-surface/30 border-white/5 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="prose prose-invert prose-sm">
                            <h4 className="text-white uppercase italic font-black">Release of Liability</h4>
                            <p className="text-text-muted leading-relaxed italic text-xs">
                                In consideration of my participation in <span className="text-white font-bold">{event.name}</span>, I hereby for myself, my heirs, executors, and administrators, waive and release any and all rights and claims for damages I may have against the event organizers, sponsors, and their representatives for any and all injuries suffered by me at said event.
                            </p>
                            <p className="text-text-muted leading-relaxed italic text-xs">
                                I attest and verify that I am physically fit and have sufficiently trained for the completion of this event and my physical condition has been verified by a licensed medical doctor.
                            </p>
                            <p className="text-text-muted leading-relaxed italic text-xs">
                                Further, I grant full permission to any and all of the foregoing to use any photographs, motion pictures, recordings, or any other record of this event for any legitimate purpose.
                            </p>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20 cursor-pointer group hover:bg-primary/10 transition-all">
                            <input
                                type="checkbox"
                                {...register("termsAccepted")}
                                className="mt-1 w-5 h-5 rounded border-white/10 bg-surface/50 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer"
                            />
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-white italic transition-colors group-hover:text-primary">
                                    I have read and agree to the waiver and terms of service.
                                </span>
                                <p className="text-[10px] text-text-muted italic">By checking this, you provide a digital signature for your legal agreement.</p>
                            </div>
                        </label>
                        {errors.termsAccepted && (
                            <p className="text-xs text-red-500 font-bold italic uppercase tracking-widest text-center">{errors.termsAccepted.message}</p>
                        )}
                    </div>

                    <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0" size={18} />
                        <p className="text-[10px] text-text-muted leading-relaxed font-bold italic uppercase tracking-wider">
                            Double check your T-Shirt and Singlet sizes. Changes may not be accommodated after registration is completed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
