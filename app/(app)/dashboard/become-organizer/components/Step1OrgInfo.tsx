"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { OrganizerType } from "@/types/user";
import { cn } from "@/lib/utils";
import { User, Building2, Trophy, School, Heart, Users } from "lucide-react";

const ORGANIZER_TYPES: { value: OrganizerType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        value: "individual",
        label: "Individual",
        icon: <User size={24} />,
        description: "Solo race director or coordinator"
    },
    {
        value: "sports_club",
        label: "Sports Club",
        icon: <Trophy size={24} />,
        description: "Running, cycling, or triathlon club"
    },
    {
        value: "business",
        label: "Business",
        icon: <Building2 size={24} />,
        description: "Events company or registered entity"
    },
    {
        value: "lgu",
        label: "LGU",
        icon: <Building2 size={24} />,
        description: "Local Government (City/Brgy)"
    },
    {
        value: "school",
        label: "School",
        icon: <School size={24} />,
        description: "University or educational institution"
    },
    {
        value: "nonprofit",
        label: "Non-Profit",
        icon: <Heart size={24} />,
        description: "NGO, charity, or foundation"
    }
];

export function Step1OrgInfo() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const selectedType = watch("organizerType");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
                <Input
                    label="Organization / Name"
                    {...register("organizerName")}
                    error={errors.organizerName?.message as string}
                    placeholder="e.g. Run Ph, City Sports Office"
                    description="This is the name runners will see as the host of your events."
                />

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">
                        Organization Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {ORGANIZER_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setValue("organizerType", type.value, { shouldValidate: true })}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 text-center space-y-2 group",
                                    selectedType === type.value
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-surface border-white/5 text-text-muted hover:border-white/20"
                                )}
                            >
                                <div className={cn(
                                    "transition-transform duration-300 group-hover:scale-110",
                                    selectedType === type.value ? "text-primary" : "text-text-muted/50 group-hover:text-white"
                                )}>
                                    {type.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <span className={cn(
                                        "block text-[10px] font-black uppercase italic tracking-wider",
                                        selectedType === type.value ? "text-primary" : "text-white"
                                    )}>
                                        {type.label}
                                    </span>
                                    <span className="block text-[8px] font-medium opacity-50 uppercase leading-tight">
                                        {type.description}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {errors.organizerType && (
                        <p className="text-[10px] text-red-500 ml-1 font-bold uppercase italic tracking-wide">
                            {errors.organizerType.message as string}
                        </p>
                    )}
                </div>

                <Textarea
                    label="Description"
                    {...register("description")}
                    error={errors.description?.message as string}
                    placeholder="Briefly describe what your organization does and the types of events you plan to organize..."
                    description="Give us more context about your experience and focus."
                />
            </div>
        </div>
    );
}
