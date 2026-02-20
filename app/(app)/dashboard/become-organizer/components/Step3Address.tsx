"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 gap-6">
                <Input
                    label="Street Address / Bldg / Suite"
                    {...register("address.street")}
                    error={(errors.address as any)?.street?.message as string}
                    placeholder="Unit 123, Street Name"
                    icon={<MapPin size={18} />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Barangay"
                        {...register("address.barangay")}
                        error={(errors.address as any)?.barangay?.message as string}
                        placeholder="e.g. Brgy. San Antonio"
                    />
                    <Input
                        label="City / Municipality"
                        {...register("address.city")}
                        error={(errors.address as any)?.city?.message as string}
                        placeholder="e.g. Makati City"
                    />
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

                <Input
                    label="ZIP Code"
                    {...register("address.zipCode")}
                    error={(errors.address as any)?.zipCode?.message as string}
                    placeholder="e.g. 1200"
                    maxLength={4}
                />
            </div>
        </div>
    );
}
