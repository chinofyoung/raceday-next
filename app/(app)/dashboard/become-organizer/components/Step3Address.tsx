"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/_LegacySelect";
import { PH_REGIONS, PH_PROVINCES } from "@/lib/constants/ph-regions";
import { MapPin } from "lucide-react";
import { useEffect } from "react";

export function Step3Address() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const selectedRegion = watch("address.region");

    const provinces = selectedRegion ? PH_PROVINCES[selectedRegion] || [] : [];

    // Reset province if region changes
    useEffect(() => {
        const currentProvince = watch("address.province");
        if (selectedRegion && currentProvince && !PH_PROVINCES[selectedRegion]?.includes(currentProvince)) {
            setValue("address.province", "");
        }
    }, [selectedRegion, setValue, watch]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Location & Address</h2>
                <p className="text-text-muted font-medium">Official business or operating address.</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">Street Address / Bldg / Suite</Label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><MapPin className="size-4" /></div>
                        <Input
                            className="pl-12 bg-white/5 border-white/10 rounded-xl"
                            placeholder="Unit 123, Street Name"
                            {...register("address.street")}
                        />
                    </div>
                    {(errors.address as any)?.street && <p className="text-[10px] text-destructive font-bold uppercase italic">{(errors.address as any).street.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">Barangay</Label>
                        <Input
                            className="bg-white/5 border-white/10 rounded-xl"
                            placeholder="e.g. Brgy. San Antonio"
                            {...register("address.barangay")}
                        />
                        {(errors.address as any)?.barangay && <p className="text-[10px] text-destructive font-bold uppercase italic">{(errors.address as any).barangay.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">City / Municipality</Label>
                        <Input
                            className="bg-white/5 border-white/10 rounded-xl"
                            placeholder="e.g. Makati City"
                            {...register("address.city")}
                        />
                        {(errors.address as any)?.city && <p className="text-[10px] text-destructive font-bold uppercase italic">{(errors.address as any).city.message as string}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Region"
                        {...register("address.region")}
                        error={(errors.address as any)?.region?.message as string}
                        options={PH_REGIONS.map(r => ({ value: r.code, label: r.name }))}
                    />
                    <Select
                        label="Province"
                        {...register("address.province")}
                        error={(errors.address as any)?.province?.message as string}
                        options={provinces.map(p => ({ value: p, label: p }))}
                        disabled={!selectedRegion}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">ZIP Code</Label>
                    <Input
                        className="bg-white/5 border-white/10 rounded-xl"
                        placeholder="e.g. 1200"
                        maxLength={4}
                        {...register("address.zipCode")}
                    />
                    {(errors.address as any)?.zipCode && <p className="text-[10px] text-destructive font-bold uppercase italic">{(errors.address as any).zipCode.message as string}</p>}
                </div>
            </div>
        </div>
    );
}
