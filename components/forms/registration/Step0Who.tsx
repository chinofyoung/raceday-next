"use client";

import { useFormContext } from "react-hook-form";
import { RegistrationFormValues } from "@/lib/validations/registration";
import { Card } from "@/components/ui/Card";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function Step0Who() {
    const { register, setValue, watch, formState: { errors } } = useFormContext<RegistrationFormValues>();
    const registrationType = watch("registrationType");

    const handleSelect = (type: "self" | "proxy") => {
        setValue("registrationType", type, { shouldValidate: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Who is this <span className="text-primary">Registration For?</span></h2>
                <p className="text-text-muted font-medium italic">Select whether you are registering for yourself or someone else.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                    className={cn(
                        "p-8 cursor-pointer transition-all duration-300 border-2 hover:border-primary/50 group relative overflow-hidden",
                        registrationType === "self"
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "bg-surface/30 border-white/5"
                    )}
                    onClick={() => handleSelect("self")}
                >
                    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                            registrationType === "self" ? "bg-primary text-white" : "bg-white/10 text-text-muted group-hover:bg-primary/20 group-hover:text-primary"
                        )}>
                            <User size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className={cn(
                                "text-xl font-black italic uppercase transition-colors",
                                registrationType === "self" ? "text-white" : "text-text-muted group-hover:text-white"
                            )}>Myself</h3>
                            <p className="text-xs text-text-muted font-medium leading-relaxed">
                                I am participating in this event. Auto-fill my details from my profile.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={cn(
                        "p-8 cursor-pointer transition-all duration-300 border-2 hover:border-primary/50 group relative overflow-hidden",
                        registrationType === "proxy"
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "bg-surface/30 border-white/5"
                    )}
                    onClick={() => handleSelect("proxy")}
                >
                    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                            registrationType === "proxy" ? "bg-primary text-white" : "bg-white/10 text-text-muted group-hover:bg-primary/20 group-hover:text-primary"
                        )}>
                            <Users size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className={cn(
                                "text-xl font-black italic uppercase transition-colors",
                                registrationType === "proxy" ? "text-white" : "text-text-muted group-hover:text-white"
                            )}>Someone Else</h3>
                            <p className="text-xs text-text-muted font-medium leading-relaxed">
                                I am registering another person. I will enter their details manually.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
            {errors.registrationType && (
                <p className="text-sm text-red-500 font-bold italic text-center animate-in fade-in">
                    Please select who this registration is for
                </p>
            )}
        </div>
    );
}
