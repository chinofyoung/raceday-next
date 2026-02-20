"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PH_GOVERNMENT_ID_TYPES } from "@/lib/constants/ph-id-types";
import { ShieldCheck, Calendar, Info } from "lucide-react";

export function Step4Verification() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const tinValue = watch("organizerTIN");
    const idFrontUrl = watch("governmentId.frontImageUrl");
    const idBackUrl = watch("governmentId.backImageUrl");
    const permitUrl = watch("businessPermitUrl");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Tax & Registration */}
            <div className="space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex gap-3 text-xs italic text-text-muted">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <p>
                        Adding your BIR TIN and DTI/SEC registration number helps us verify your legitimacy faster and ensures compliance for paid events.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="BIR TIN (Optional)"
                        {...register("organizerTIN")}
                        error={errors.organizerTIN?.message as string}
                        placeholder="XXX-XXX-XXX-XXX"
                        description="Format: 000-000-000-000"
                    />
                    <Input
                        label="DTI / SEC Registration No. (Optional)"
                        {...register("dtiSecRegistration")}
                        error={errors.dtiSecRegistration?.message as string}
                        placeholder="e.g. 1234567"
                    />
                </div>
            </div>

            <hr className="border-white/5" />

            {/* Government ID */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-cta" />
                    <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">Identity Verification</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Government ID Type"
                        {...register("governmentId.type")}
                        error={(errors.governmentId as any)?.type?.message as string}
                        options={PH_GOVERNMENT_ID_TYPES}
                    />
                    <Input
                        label="ID Number"
                        {...register("governmentId.idNumber")}
                        error={(errors.governmentId as any)?.idNumber?.message as string}
                        placeholder="Enter ID number"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic opacity-70">
                            ID Front Photo
                        </label>
                        <ImageUpload
                            value={idFrontUrl}
                            onChange={(url) => setValue("governmentId.frontImageUrl", url, { shouldValidate: true })}
                            onRemove={() => setValue("governmentId.frontImageUrl", "")}
                            label="Upload ID Front"
                            description="Clear photo of the front of your ID"
                        />
                        {(errors.governmentId as any)?.frontImageUrl && (
                            <p className="text-[10px] text-red-500 font-bold uppercase italic">{(errors.governmentId as any).frontImageUrl.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic opacity-70">
                            ID Back Photo (Optional)
                        </label>
                        <ImageUpload
                            value={idBackUrl}
                            onChange={(url) => setValue("governmentId.backImageUrl", url)}
                            onRemove={() => setValue("governmentId.backImageUrl", "")}
                            label="Upload ID Back"
                            description="Clear photo of the back (if applicable)"
                        />
                    </div>
                </div>
            </div>

            <hr className="border-white/5" />

            {/* Additional Info */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">Experience & Compliance</h4>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic opacity-70">
                        Business / Mayor&apos;s Permit (Optional)
                    </label>
                    <ImageUpload
                        value={permitUrl}
                        onChange={(url) => setValue("businessPermitUrl", url)}
                        onRemove={() => setValue("businessPermitUrl", "")}
                        label="Upload Permit"
                        description="Recommended for organizations and businesses"
                    />
                </div>

                <Textarea
                    label="Past Events Organized"
                    {...register("pastEventsDescription")}
                    error={errors.pastEventsDescription?.message as string}
                    placeholder="List some of the events you have organized in the past..."
                    description="Helps us understand your track record."
                />

                <Input
                    label="Estimated Events Per Year"
                    type="number"
                    {...register("estimatedEventsPerYear")}
                    error={errors.estimatedEventsPerYear?.message as string}
                    placeholder="e.g. 5"
                    className="md:max-w-[200px]"
                />
            </div>

            <div className="p-4 bg-cta/5 border border-cta/20 rounded-2xl">
                <p className="text-[10px] text-text-muted text-center italic">
                    Your documents are encrypted and only visible to our admin team for verification purposes.
                </p>
            </div>
        </div>
    );
}
