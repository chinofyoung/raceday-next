"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/_LegacySelect";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Identity Verification</h2>
                <p className="text-text-muted font-medium">Provide documents to verify your legitimacy.</p>
            </div>
            {/* Tax & Registration */}
            <div className="space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex gap-3 text-xs italic text-text-muted">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <p>
                        Adding your BIR TIN and DTI/SEC registration number helps us verify your legitimacy faster and ensures compliance for paid events.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">BIR TIN (Optional)</Label>
                        <Input
                            className="bg-white/5 border-white/10 rounded-xl"
                            placeholder="XXX-XXX-XXX-XXX"
                            {...register("organizerTIN")}
                        />
                        {errors.organizerTIN && <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.organizerTIN.message as string}</p>}
                        <p className="text-[10px] text-muted-foreground italic opacity-50">Format: 000-000-000-000</p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">DTI / SEC Registration No. (Optional)</Label>
                        <Input
                            className="bg-white/5 border-white/10 rounded-xl"
                            placeholder="e.g. 1234567"
                            {...register("dtiSecRegistration")}
                        />
                        {errors.dtiSecRegistration && <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.dtiSecRegistration.message as string}</p>}
                    </div>
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
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">ID Number</Label>
                        <Input
                            className="bg-white/5 border-white/10 rounded-xl"
                            placeholder="Enter ID number"
                            {...register("governmentId.idNumber")}
                        />
                        {(errors.governmentId as any)?.idNumber && <p className="text-[10px] text-destructive font-bold uppercase italic">{(errors.governmentId as any).idNumber.message}</p>}
                    </div>
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

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">Past Events Organized</Label>
                    <Textarea
                        className="bg-white/5 border-white/10 rounded-xl min-h-[120px] resize-none"
                        placeholder="List some of the events you have organized in the past..."
                        {...register("pastEventsDescription")}
                    />
                    {errors.pastEventsDescription && <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.pastEventsDescription.message as string}</p>}
                    <p className="text-[10px] text-muted-foreground italic opacity-50">Helps us understand your track record.</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-70">Estimated Events Per Year</Label>
                    <Input
                        type="number"
                        className="bg-white/5 border-white/10 rounded-xl md:max-w-[200px]"
                        placeholder="e.g. 5"
                        {...register("estimatedEventsPerYear")}
                    />
                    {errors.estimatedEventsPerYear && <p className="text-[10px] text-destructive font-bold uppercase italic">{errors.estimatedEventsPerYear.message as string}</p>}
                </div>
            </div>

            <div className="p-4 bg-cta/5 border border-cta/20 rounded-2xl">
                <p className="text-[10px] text-text-muted text-center italic">
                    Your documents are encrypted and only visible to our admin team for verification purposes.
                </p>
            </div>
        </div>
    );
}
