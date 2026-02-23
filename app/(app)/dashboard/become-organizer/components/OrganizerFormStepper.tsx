"use client";

import { Check, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    id: number;
    title: string;
    description: string;
}

interface OrganizerFormStepperProps {
    steps: Step[];
    currentStep: number;
}

export function OrganizerFormStepper({ steps, currentStep }: OrganizerFormStepperProps) {
    return (
        <div className="flex items-center gap-2 md:justify-between overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth whitespace-nowrap">
            {steps.map((step, i) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                    <div key={step.id} className={cn("flex items-center shrink-0", i < steps.length - 1 && "md:flex-1")}>
                        <div
                            className={cn(
                                "flex items-center gap-2 transition-all p-2 rounded-xl shrink-0",
                                (isActive || isCompleted) ? "font-bold" : "opacity-50"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0",
                                isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" :
                                    isCompleted ? "bg-cta/20 text-cta" :
                                        "bg-white/5 text-text-muted border border-white/10"
                            )}>
                                {isCompleted ? <Check size={16} strokeWidth={3} /> : isActive ? step.id : step.id}
                            </div>
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-[10px] uppercase font-black italic tracking-widest transition-colors",
                                    isActive ? "text-white block" : isCompleted ? "text-cta" : "hidden md:block text-text-muted opacity-50"
                                )}>
                                    {step.title}
                                </span>
                                {isActive && (
                                    <span className="text-[8px] uppercase font-bold text-primary/70 italic leading-none md:hidden">
                                        Current Step
                                    </span>
                                )}
                            </div>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={cn(
                                "h-px bg-white/10 mx-2 md:mx-4 shrink-0",
                                "w-4 md:w-auto md:flex-1",
                                isCompleted && "bg-primary/50"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
