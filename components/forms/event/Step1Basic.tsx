"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { EventFormValues } from "@/lib/validations/event";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Step1Basic() {
    const { register, formState: { errors }, watch, setValue } = useFormContext<EventFormValues>();
    const [isGenerating, setIsGenerating] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Event Basics</h2>
                <p className="text-text-muted font-medium">Define the core identity of your race.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 md:col-span-2">
                    <Input
                        label="Event Name"
                        {...register("name")}
                        error={errors.name?.message}
                        placeholder="e.g. Manila City Half Marathon 2026"
                        className="text-lg font-bold"
                    />
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Event Date</label>
                        <input
                            type="date"
                            {...register("date", { valueAsDate: true })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                        />
                        {errors.date?.message && <p className="text-xs text-red-500 font-bold uppercase italic tracking-wide">{errors.date.message}</p>}
                    </div>
                </div>

                <div className="space-y-6 md:col-span-2 relative group">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Description & Details</label>
                            <button
                                type="button"
                                onClick={async () => {
                                    const text = watch("description");
                                    if (!text || text.length < 10) {
                                        toast.error("Write a little more first", {
                                            description: "Claude needs some content to improve upon."
                                        });
                                        return;
                                    }
                                    setIsGenerating(true);
                                    const tid = toast.loading("Claude is polishing your copy...");
                                    try {
                                        const res = await (await import("@/lib/services/aiService")).improveText(text);
                                        setValue("description", res.improvedText);
                                        toast.success("Copy polished!", { id: tid });
                                    } catch (e) {
                                        toast.error("Failed to improve text", { id: tid });
                                    } finally {
                                        setIsGenerating(false);
                                    }
                                }}
                                disabled={isGenerating}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-primary border border-white/5 transition-all disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                Improve with AI
                            </button>
                        </div>
                        <textarea
                            {...register("description")}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[200px]"
                            placeholder="Provide a detailed description of the event, rules, registration details, etc."
                        />
                        {errors.description?.message && <p className="text-xs text-red-500 font-bold uppercase italic tracking-wide">{errors.description.message}</p>}
                    </div>
                </div>

                <div className="space-y-6">
                    <Input
                        label="Venue Name"
                        {...register("location.name")}
                        error={errors.location?.name?.message}
                        placeholder="e.g. Bonifacio Global City"
                    />
                </div>

                <div className="space-y-6">
                    <Input
                        label="Full Address"
                        {...register("location.address")}
                        error={errors.location?.address?.message}
                        placeholder="e.g. 26th St, Taguig, Metro Manila"
                    />
                </div>
            </div>
        </div>
    );
}
