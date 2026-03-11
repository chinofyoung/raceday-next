"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/_LegacyInput";
import { EventFormValues } from "@/lib/validations/event";
import { Card } from "@/components/ui/_LegacyCard";
import { Sparkles, DollarSign, MapPin, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { StationManager } from "./StationManager";
import { useState } from "react";

export function Step5Features() {
    const { watch, setValue, register, formState: { errors } } = useFormContext<EventFormValues>();
    const isVanityEnabled = watch("vanityRaceNumber.enabled");
    const categories = watch("categories");
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    const hasGPX = categories?.some(cat => cat.routeMap?.gpxFileUrl);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Event Features</h2>
                <p className="text-text-muted font-medium">Enhance your event experience with premium features.</p>
            </div>

            {/* Vanity Numbers Section */}
            <div className="pt-8 border-t border-white/5 space-y-8">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                    <Sparkles size={16} /> Vanity Race Numbers
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-6">
                        <Card
                            className={cn(
                                "p-8 border-2 transition-all cursor-pointer group hover:scale-[1.02]",
                                isVanityEnabled ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" : "bg-surface border-white/5 opacity-70 hover:opacity-100"
                            )}
                            onClick={() => setValue("vanityRaceNumber.enabled", !isVanityEnabled)}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                    isVanityEnabled ? "bg-primary text-white" : "bg-white/5 text-text-muted group-hover:bg-white/10"
                                )}>
                                    <Sparkles size={24} />
                                </div>
                                <div className={cn(
                                    "w-14 h-7 rounded-full relative transition-colors p-1",
                                    isVanityEnabled ? "bg-primary" : "bg-white/10"
                                )}>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full bg-white transition-all",
                                        isVanityEnabled ? "translate-x-7" : "translate-x-0"
                                    )} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Vanity Numbers</h3>
                                <p className="text-sm text-text-muted font-medium leading-relaxed">
                                    Runners love picking meaningful numbers (birthdays, anniversaries, or lucky digits).
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className={cn(
                        "space-y-8 transition-all duration-500",
                        isVanityEnabled ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"
                    )}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cta italic">
                                <DollarSign size={16} /> Extension Fee
                            </div>
                            <Input
                                type="number"
                                {...register("vanityRaceNumber.premiumPrice", { valueAsNumber: true })}
                                error={errors.vanityRaceNumber?.premiumPrice?.message}
                                placeholder="e.g. 500"
                                className="text-2xl font-black"
                            />
                            <p className="text-xs text-text-muted font-medium italic">
                                Applied when a runner chooses a specific race number.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cta italic">
                                <Sparkles size={16} /> Max Digits Allowed
                            </div>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    {...register("vanityRaceNumber.maxDigits", {
                                        valueAsNumber: true,
                                        min: 1,
                                        max: 10
                                    })}
                                    error={errors.vanityRaceNumber?.maxDigits?.message}
                                    placeholder="e.g. 4"
                                    className="text-2xl font-black w-32"
                                />
                                <div className="flex-1 flex gap-2">
                                    {Array.from({ length: watch("vanityRaceNumber.maxDigits") || 4 }).map((_, i) => (
                                        <div key={i} className="flex-1 aspect-square md:aspect-auto md:h-12 border-2 border-dashed border-cta/30 rounded-lg flex items-center justify-center text-cta/40 font-black italic text-xl">
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-text-muted font-medium italic">
                                Defines the length of the vanity number (e.g., 4 digits = 0001 to 9999).
                            </p>
                        </div>

                        <div className="p-6 bg-cta/10 border border-cta/20 rounded-2xl space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-cta">Revenue Boost</h4>
                            <p className="text-xs text-text-muted leading-relaxed font-medium">
                                This feature is high-demand and provides a simple way to increase your event's average transaction value without adding overhead.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Race Support Stations Section */}
            <div className="pt-8 border-t border-white/5 space-y-8 pb-12">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                    <Droplets size={16} /> Race Support Stations
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xl font-bold uppercase italic tracking-tight text-white flex items-center gap-2">
                            Map Stations
                        </label>
                        <p className="text-sm text-text-muted font-medium leading-relaxed max-w-xl">
                            Mark water stations, aid tents, and first aid points along the race route. These will be visible to runners on the event map.
                        </p>
                    </div>

                    {!hasGPX ? (
                        <div className="p-8 bg-surface/30 border border-dashed border-white/10 rounded-3xl text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                                <MapPin size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">GPX Route Required</h3>
                                <p className="text-text-muted text-xs max-w-xs mx-auto mt-1">
                                    You need to upload a GPX route in Step 3 (Categories) before you can place stations on the map.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {categories.length > 1 && (
                                <div className="flex flex-wrap gap-2 bg-surface/30 p-1.5 rounded-2xl border border-white/5 w-fit">
                                    {categories.map((cat, idx) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setActiveCategoryIndex(idx)}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                                                activeCategoryIndex === idx
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-text-muted hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <StationManager categoryIndex={activeCategoryIndex} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
