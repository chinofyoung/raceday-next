"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { RaceEvent } from "@/types/event";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Card } from "@/components/ui/_LegacyCard";
import { Badge } from "@/components/ui/_LegacyBadge";
import { Search, CheckCircle2, AlertCircle, Loader2, Sparkles, Hash, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step3VanityProps {
    event: RaceEvent;
}

export function Step3Vanity({ event }: Step3VanityProps) {
    const { register, watch, setValue, formState: { errors } } = useFormContext<RegistrationFormValues>();
    const vanityNumber = watch("vanityNumber");
    const categoryId = watch("categoryId");

    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [lastChecked, setLastChecked] = useState("");

    const enabled = event.vanityRaceNumber?.enabled;
    const premiumPrice = event.vanityRaceNumber?.premiumPrice || 0;

    useEffect(() => {
        if (!vanityNumber) {
            setIsAvailable(null);
            setValue("vanityPremium", 0);
            setValue("totalPrice", watch("basePrice"));
            return;
        }
    }, [vanityNumber]);

    const checkAvailability = async () => {
        if (!vanityNumber || vanityNumber.length < 1) return;

        setIsChecking(true);
        setIsAvailable(null);

        try {
            // Server-side check against formatted raceNumber (catches vanity + sequential collisions)
            const res = await fetch(
                `/api/registrations/check-vanity?eventId=${event.id}&categoryId=${categoryId}&vanityNumber=${encodeURIComponent(vanityNumber)}`
            );
            const data = await res.json();

            if (!res.ok) {
                console.error("Vanity check error:", data.error);
                setIsAvailable(false);
                return;
            }

            const available = data.available;
            setIsAvailable(available);
            setLastChecked(vanityNumber);

            if (available) {
                setValue("vanityPremium", premiumPrice);
                setValue("totalPrice", watch("basePrice") + premiumPrice);
            } else {
                setValue("vanityPremium", 0);
                setValue("totalPrice", watch("basePrice"));
            }
        } catch (error) {
            console.error("Error checking vanity number:", error);
            setIsAvailable(false);
        } finally {
            setIsChecking(false);
        }
    };

    if (!enabled) {
        return (
            <div className="py-20 text-center animate-in fade-in duration-500 space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-20">
                    <Hash size={32} />
                </div>
                <div className="space-y-1">
                    <h2 className="text-2xl font-black italic uppercase text-white">Vanity Numbers Not Available</h2>
                    <p className="text-text-muted font-medium italic">The organizer has not enabled custom race numbers for this event.</p>
                </div>
            </div>
        );
    }

    const maxDigits = event.vanityRaceNumber?.maxDigits || 4;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary">
                    <Sparkles size={20} className="animate-pulse" />
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Vanity <span className="text-primary">Race Number</span></h2>
                </div>
                <p className="text-text-muted font-medium italic">Make your race bib unique! Pick a custom <span className="text-white font-bold">{maxDigits}-digit</span> number for a <span className="text-white font-bold">₱{premiumPrice}</span> premium.</p>
            </div>

            <Card className="p-8 bg-surface/40 border-white/5 space-y-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="max-w-xl mx-auto space-y-8 text-center">
                    {/* Visual Representation */}
                    <div className="flex justify-center gap-3">
                        {Array.from({ length: maxDigits }).map((_, i) => {
                            const char = vanityNumber?.[i] || "";
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-12 h-16 md:w-16 md:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl md:text-5xl font-black italic transition-all duration-300 shadow-xl",
                                        char
                                            ? "bg-primary border-primary text-white shadow-primary/20 scale-105"
                                            : "bg-background border-white/10 text-white/10"
                                    )}
                                >
                                    {char || "0"}
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted italic">Type your number</label>
                        <div className="flex gap-2 max-w-md mx-auto">
                            <input
                                {...register("vanityNumber", {
                                    maxLength: maxDigits,
                                    onChange: (e) => {
                                        // Only allow numbers
                                        const val = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
                                        setValue("vanityNumber", val);
                                    }
                                })}
                                type="text"
                                placeholder={`Enter ${maxDigits} digits`}
                                className="flex-1 px-6 py-4 bg-background border w-full border-white/10 rounded-2xl text-2xl font-black text-center italic tracking-widest focus:outline-none focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={checkAvailability}
                                disabled={isChecking || !vanityNumber || vanityNumber.length !== maxDigits}
                                className="px-6 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                            >
                                {isChecking ? <Loader2 className="animate-spin" size={24} /> : "Check"}
                            </button>
                        </div>
                        {vanityNumber && vanityNumber.length !== maxDigits && (
                            <p className="text-[10px] text-amber-500 font-bold italic uppercase tracking-widest animate-pulse">
                                Requires exactly {maxDigits} digits
                            </p>
                        )}
                    </div>

                    <div className="h-10 flex items-center justify-center">
                        {isAvailable === true && lastChecked === vanityNumber && (
                            <div className="flex items-center gap-2 text-cta bg-cta/10 px-4 py-2 rounded-full border border-cta/20 animate-in zoom-in duration-300">
                                <CheckCircle2 size={18} />
                                <span className="text-xs font-black uppercase tracking-widest italic">Number is Available!</span>
                            </div>
                        )}
                        {isAvailable === false && lastChecked === vanityNumber && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 animate-in zoom-in duration-300">
                                <AlertCircle size={18} />
                                <span className="text-xs font-black uppercase tracking-widest italic">Already Taken</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Breakdown Preview */}
                <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-8 text-center">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Base Fee</p>
                        <p className="text-2xl font-black italic text-white tracking-widest">₱{watch("basePrice")}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Vanity Fee</p>
                        <p className={cn(
                            "text-2xl font-black italic tracking-widest",
                            isAvailable ? "text-primary" : "text-white/20"
                        )}>
                            +₱{isAvailable ? premiumPrice : 0}
                        </p>
                    </div>
                </div>
            </Card>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex gap-4">
                <ShieldAlert className="text-cta shrink-0" size={24} />
                <p className="text-[10px] text-text-muted leading-relaxed font-bold italic uppercase tracking-wider">
                    Vanity numbers are subject to availability and will only be officially reserved once payment is confirmed. If multiple users attempt to pay for the same number, the first confirmed payment will be assigned the number.
                </p>
            </div>
        </div>
    );
}
