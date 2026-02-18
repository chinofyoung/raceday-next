"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { RaceEvent } from "@/types/event";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search, CheckCircle2, AlertCircle, Loader2, Sparkles, Hash, ShieldAlert } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
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
            // In a real app, we check the 'registrations' collection for the same event and bib number
            const q = query(
                collection(db, "registrations"),
                where("eventId", "==", event.id),
                where("vanityNumber", "==", vanityNumber),
                where("status", "==", "paid")
            );
            const snap = await getDocs(q);

            const available = snap.empty;
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary">
                    <Sparkles size={20} className="animate-pulse" />
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Vanity <span className="text-primary">Race Number</span></h2>
                </div>
                <p className="text-text-muted font-medium italic">Make your race bib unique! Pick a custom number for a <span className="text-white font-bold">₱{premiumPrice}</span> premium.</p>
            </div>

            <Card className="p-8 bg-surface/40 border-white/5 space-y-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="max-w-md mx-auto space-y-6 text-center">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted italic">Desired Bib Number</label>
                        <div className="flex gap-2">
                            <input
                                {...register("vanityNumber")}
                                type="text"
                                placeholder="e.g. 777"
                                className="flex-1 px-6 py-4 bg-background border border-white/10 rounded-2xl text-2xl font-black text-center italic tracking-widest focus:outline-none focus:border-primary transition-all"
                                maxLength={6}
                            />
                            <button
                                type="button"
                                onClick={checkAvailability}
                                disabled={isChecking || !vanityNumber}
                                className="px-6 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                            >
                                {isChecking ? <Loader2 className="animate-spin" size={24} /> : "Check"}
                            </button>
                        </div>
                    </div>

                    <div className="h-12 flex items-center justify-center">
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
                        {!vanityNumber && (
                            <p className="text-[10px] text-text-muted font-bold italic uppercase tracking-widest opacity-50">Enter a number to check availability</p>
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
