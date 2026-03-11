"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Organization Profile</h2>
                <p className="text-text-muted font-medium">Define your organization type and basic details.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">
                        Organization / Name
                    </Label>
                    <Input
                        className="bg-white/5 border-white/10 rounded-xl"
                        placeholder="e.g. Run Ph, City Sports Office"
                        {...register("organizerName")}
                    />
                    {errors.organizerName && (
                        <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.organizerName.message as string}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground italic opacity-50">This is the name runners will see as the host of your events.</p>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">
                        Organization Type
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {ORGANIZER_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setValue("organizerType", type.value, { shouldValidate: true })}
                                className={cn(
                                    "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 text-center space-y-3 group cursor-pointer",
                                    selectedType === type.value
                                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                                        : "bg-surface border-white/5 text-text-muted hover:border-white/20"
                                )}
                            >
                                <div className={cn(
                                    "transition-all duration-300",
                                    selectedType === type.value ? "text-primary scale-110" : "text-text-muted/50 group-hover:text-white"
                                )}>
                                    {type.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <span className={cn(
                                        "block text-xs font-black uppercase italic tracking-wider leading-none",
                                        selectedType === type.value ? "text-primary" : "text-white"
                                    )}>
                                        {type.label}
                                    </span>
                                    <span className="block text-[8px] font-bold opacity-50 uppercase tracking-widest mt-1">
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

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">
                        Description
                    </Label>
                    <Textarea
                        className="bg-white/5 border-white/10 rounded-xl min-h-[120px] resize-none"
                        placeholder="Briefly describe what your organization does and the types of events you plan to organize..."
                        {...register("description")}
                    />
                    {errors.description && (
                        <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.description.message as string}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground italic opacity-50">Give us more context about your experience and focus.</p>
                </div>
            </div>
        </div>
    );
}
