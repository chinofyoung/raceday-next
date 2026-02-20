"use client";

import { Check } from "lucide-react";
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
        <div className="w-full">
            <nav aria-label="Progress">
                <ol role="list" className="flex items-center justify-between w-full">
                    {steps.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <li key={step.id} className={cn("relative", index !== steps.length - 1 ? "flex-1" : "")}>
                                {index !== steps.length - 1 && (
                                    <div
                                        className="absolute inset-0 flex items-center pr-8"
                                        aria-hidden="true"
                                        style={{ top: '1.25rem' }}
                                    >
                                        <div
                                            className={cn(
                                                "h-0.5 w-full transition-colors duration-500",
                                                isCompleted ? "bg-primary" : "bg-white/10"
                                            )}
                                        />
                                    </div>
                                )}
                                <div className="group relative flex flex-col items-center">
                                    <span className="flex h-10 items-center" aria-hidden="true">
                                        <span
                                            className={cn(
                                                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                                                isCompleted
                                                    ? "bg-primary border-primary text-black"
                                                    : isCurrent
                                                        ? "bg-surface border-primary text-primary shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                                                        : "bg-surface border-white/10 text-text-muted"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <Check size={20} strokeWidth={3} />
                                            ) : (
                                                <span className="text-sm font-black italic">{step.id}</span>
                                            )}
                                        </span>
                                    </span>
                                    <div className="mt-3 flex flex-col items-center text-center px-2">
                                        <header className={cn(
                                            "text-[10px] font-black uppercase tracking-tighter italic transition-colors",
                                            isCurrent || isCompleted ? "text-white" : "text-text-muted"
                                        )}>
                                            {step.title}
                                        </header>
                                        <p className="hidden md:block text-[9px] text-text-muted uppercase font-bold opacity-50 truncate max-w-[100px]">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}
