"use client";

import { useFormContext } from "react-hook-form";
import { RegistrationEvent } from "@/types/event";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";
import { getEffectivePrice } from "@/lib/earlyBirdUtils";

interface Step1CategoryProps {
    event: RegistrationEvent;
}

export function Step1Category({ event }: Step1CategoryProps) {
    const { register, watch, setValue, formState: { errors } } = useFormContext<RegistrationFormValues>();
    const selectedCategoryId = watch("categoryId");

    const selectCategory = (categoryId: string, price: number) => {
        const numericPrice = Number(price) || 0;
        setValue("categoryId", categoryId);
        setValue("basePrice", numericPrice);
        setValue("totalPrice", numericPrice + (Number(watch("vanityPremium")) || 0));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-white">Choose Your <span className="text-primary">Distance</span></h2>
                <p className="text-text-muted font-medium">Select the category you want to join. Prices vary per distance.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {event.categories.map((cat, i) => {
                    const isSelected = selectedCategoryId === (cat.id || i.toString());
                    const effectivePrice = getEffectivePrice(event, cat);
                    const isEarlyBird = effectivePrice < (Number(cat.price) || 0);

                    return (
                        <button
                            key={cat.id || i}
                            type="button"
                            onClick={() => selectCategory(cat.id || i.toString(), effectivePrice)}
                            className={cn(
                                "text-left transition-all duration-300 relative group",
                                isSelected ? "scale-[1.02] z-10" : "hover:scale-[1.01]"
                            )}
                        >
                            <Card className={cn(
                                "p-6 border-2 transition-all duration-300 bg-surface/40",
                                isSelected
                                    ? "border-primary shadow-2xl shadow-primary/10 bg-surface/60"
                                    : "border-white/5 hover:border-white/20"
                            )}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold transition-all shrink-0",
                                            isSelected ? "bg-primary text-white scale-110" : "bg-white/5 text-text-muted"
                                        )}>
                                            <span className="text-lg leading-none">{cat.distance}</span>
                                            <span className="text-[10px] uppercase leading-none mt-0.5">{cat.distanceUnit || "km"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-white leading-tight">{cat.name}</h3>
                                            <div className="flex gap-4 text-xs font-bold tracking-wider text-text-muted">
                                                <span className="flex items-center gap-1"><Clock size={12} className="text-primary" /> {cat.gunStartTime}</span>
                                                <span className="flex items-center gap-1"><Timer size={12} className="text-cta" /> {cat.cutOffTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex md:flex-col items-center md:items-end justify-between gap-1">
                                        {isEarlyBird ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-text-muted line-through">₱{cat.price}</span>
                                                <span className="text-2xl font-bold text-green-400">₱{effectivePrice}</span>
                                                <Badge variant="success" className="bg-green-500/20 text-green-500 border-none px-2 py-0 text-xs">Early Bird</Badge>
                                            </div>
                                        ) : (
                                            <p className="text-2xl font-bold text-white">₱{effectivePrice}</p>
                                        )}
                                        {isSelected && (
                                            <Badge variant="success" className="animate-in zoom-in duration-300">
                                                Selected
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Inclusions Preview */}
                                {cat.inclusions?.filter(Boolean).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
                                        {cat.inclusions.filter(Boolean).slice(0, 3).map((inc, j) => (
                                            <span key={j} className="px-2 py-0.5 bg-white/5 rounded text-xs font-medium text-white/90 border border-white/5 whitespace-nowrap">
                                                {inc}
                                            </span>
                                        ))}
                                        {cat.inclusions.filter(Boolean).length > 3 && (
                                            <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-medium text-text-muted border border-white/5">+{cat.inclusions.filter(Boolean).length - 3} more</span>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </button>
                    )
                })}
            </div>

            {errors.categoryId && (
                <p className="text-sm text-red-500 font-bold tracking-wider text-center animate-bounce">
                    {errors.categoryId.message}
                </p>
            )}
        </div>
    );
}
