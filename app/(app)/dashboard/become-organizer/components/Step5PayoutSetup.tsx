"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PH_BANKS } from "@/lib/constants/ph-banks";
import { Wallet, Camera, Info } from "lucide-react";

export function Step5PayoutSetup() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const selfieUrl = watch("selfieWithIdUrl");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Payout Setup</h2>
                <p className="text-text-muted font-medium">Configure where you want to receive your event revenue.</p>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex gap-3 text-xs italic text-text-muted">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <p>
                    Ensure the account holder name exactly matches your legal name or business name. Xendit will verify this during the KYC process.
                </p>
            </div>

            {/* Bank Details */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Wallet size={20} className="text-cta" />
                    <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">Bank Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Bank / E-Wallet"
                        {...register("bankDetails.bankCode")}
                        error={(errors.bankDetails as any)?.bankCode?.message as string}
                        options={[...PH_BANKS]}
                    />
                    <Input
                        label="Account Number"
                        {...register("bankDetails.accountNumber")}
                        error={(errors.bankDetails as any)?.accountNumber?.message as string}
                        placeholder="Enter account/mobile number"
                    />
                </div>

                <Input
                    label="Account Holder Name"
                    {...register("bankDetails.accountHolderName")}
                    error={(errors.bankDetails as any)?.accountHolderName?.message as string}
                    placeholder="Enter full legal name"
                    description="Must match the name on your provided ID"
                />
            </div>

            <hr className="border-white/5" />

            {/* KYC Selfie */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Camera size={20} className="text-primary" />
                    <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">Identity Verification (KYC)</h4>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic opacity-70">
                        Selfie with ID
                    </label>
                    <ImageUpload
                        value={selfieUrl}
                        onChange={(url) => setValue("selfieWithIdUrl", url, { shouldValidate: true })}
                        onRemove={() => setValue("selfieWithIdUrl", "")}
                        label="Upload Selfie"
                        description="Hold your ID next to your face. Ensure both your face and the ID are clearly visible."
                    />
                    {errors.selfieWithIdUrl && (
                        <p className="text-[10px] text-red-500 font-bold uppercase italic">{errors.selfieWithIdUrl.message as string}</p>
                    )}
                </div>

                <div className="p-4 bg-cta/5 border border-cta/20 rounded-2xl">
                    <ul className="text-[10px] text-text-muted list-disc list-inside space-y-1 italic">
                        <li>Hold your ID clearly next to your face</li>
                        <li>Do not cover any part of your face or the ID</li>
                        <li>Ensure the text on the ID is readable</li>
                        <li>Use a well-lit environment</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
