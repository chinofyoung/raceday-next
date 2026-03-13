"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Globe, User } from "lucide-react";

export function Step2Contact() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-bold tracking-tight text-white">Contact Information</h2>
                <p className="text-text-muted font-medium">How we and your participants can reach you.</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Contact Person</Label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><User className="size-4" /></div>
                        <Input
                            className="pl-12 bg-white/5 border-white/10 rounded-xl"
                            placeholder="Full Name"
                            {...register("contactPerson")}
                        />
                    </div>
                    {errors.contactPerson && <p className="text-xs text-destructive font-bold uppercase">{errors.contactPerson.message as string}</p>}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Business Email</Label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Mail className="size-4" /></div>
                        <Input
                            className="pl-12 bg-white/5 border-white/10 rounded-xl"
                            placeholder="email@example.com"
                            {...register("contactEmail")}
                        />
                    </div>
                    {errors.contactEmail && <p className="text-xs text-destructive font-bold uppercase">{errors.contactEmail.message as string}</p>}
                    <p className="text-xs text-muted-foreground opacity-50">Where we will send official communications.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Mobile Number</Label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Phone className="size-4" /></div>
                            <Input
                                className="pl-12 bg-white/5 border-white/10 rounded-xl"
                                placeholder="0917 123 4567"
                                {...register("phone")}
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-destructive font-bold uppercase">{errors.phone.message as string}</p>}
                        <p className="text-xs text-muted-foreground opacity-50">Primary PH contact number (09XXXXXXXXX)</p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Alternate Phone (Optional)</Label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Phone className="size-4" /></div>
                            <Input
                                className="pl-12 bg-white/5 border-white/10 rounded-xl"
                                placeholder="Landline or other mobile"
                                {...register("alternatePhone")}
                            />
                        </div>
                        {errors.alternatePhone && <p className="text-xs text-destructive font-bold uppercase">{errors.alternatePhone.message as string}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70">Website / Social Media (Optional)</Label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Globe className="size-4" /></div>
                        <Input
                            className="pl-12 bg-white/5 border-white/10 rounded-xl"
                            placeholder="https://facebook.com/yourpage"
                            {...register("website")}
                        />
                    </div>
                    {errors.website && <p className="text-xs text-destructive font-bold uppercase">{errors.website.message as string}</p>}
                    <p className="text-xs text-muted-foreground opacity-50">Link to your organization website or Facebook page.</p>
                </div>
            </div>
        </div>
    );
}
