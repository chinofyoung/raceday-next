"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { EventFormValues } from "@/lib/validations/event";
import { Card } from "@/components/ui/Card";
import { Sparkles, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function Step5Vanity() {
    const { register, watch, setValue, formState: { errors } } = useFormContext<EventFormValues>();
    const isEnabled = watch("vanityRaceNumber.enabled");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Vanity Race Numbers</h2>
                <p className="text-text-muted font-medium">Allow runners to pick their own race number for a premium fee.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <Card
                        className={cn(
                            "p-8 border-2 transition-all cursor-pointer group hover:scale-[1.02]",
                            isEnabled ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" : "bg-surface border-white/5 opacity-70 hover:opacity-100"
                        )}
                        onClick={() => setValue("vanityRaceNumber.enabled", !isEnabled)}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                isEnabled ? "bg-primary text-white" : "bg-white/5 text-text-muted group-hover:bg-white/10"
                            )}>
                                <Sparkles size={24} />
                            </div>
                            <div className={cn(
                                "w-14 h-7 rounded-full relative transition-colors p-1",
                                isEnabled ? "bg-primary" : "bg-white/10"
                            )}>
                                <div className={cn(
                                    "w-5 h-5 rounded-full bg-white transition-all",
                                    isEnabled ? "translate-x-7" : "translate-x-0"
                                )} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Enable Vanity Numbers</h3>
                            <p className="text-sm text-text-muted font-medium leading-relaxed">
                                Runners love picking meaningful numbers (birthdays, anniversaries, or lucky digits). Enable this to boost revenue and engagement.
                            </p>
                        </div>
                    </Card>
                </div>

                <div className={cn(
                    "space-y-8 transition-all duration-500",
                    isEnabled ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"
                )}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                            <DollarSign size={16} /> Premium Upgrade Price
                        </div>
                        <Input
                            type="number"
                            {...register("vanityRaceNumber.premiumPrice", { valueAsNumber: true })}
                            error={errors.vanityRaceNumber?.premiumPrice?.message}
                            placeholder="e.g. 500"
                            className="text-2xl font-black"
                        />
                        <p className="text-xs text-text-muted font-medium italic">
                            This amount will be added to the base registration fee if the runner chooses a vanity number.
                        </p>
                    </div>

                    <div className="p-6 bg-cta/10 border border-cta/20 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-cta">How it works</h4>
                        <p className="text-xs text-text-muted leading-relaxed font-medium">
                            During registration, runners will see a searchable list of available numbers within their category range. If they select a specific number, the premium fee is applied at checkout.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
