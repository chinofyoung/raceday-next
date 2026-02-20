"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Mail, Phone, Globe, User } from "lucide-react";

export function Step2Contact() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 gap-6">
                <Input
                    label="Contact Person"
                    {...register("contactPerson")}
                    error={errors.contactPerson?.message as string}
                    placeholder="Full Name"
                    icon={<User size={18} />}
                />

                <Input
                    label="Business Email"
                    {...register("contactEmail")}
                    error={errors.contactEmail?.message as string}
                    placeholder="email@example.com"
                    icon={<Mail size={18} />}
                    description="Where we will send official communications."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Mobile Number"
                        {...register("phone")}
                        error={errors.phone?.message as string}
                        placeholder="0917 123 4567"
                        icon={<Phone size={18} />}
                        description="Primary PH contact number (09XXXXXXXXX)"
                    />
                    <Input
                        label="Alternate Phone (Optional)"
                        {...register("alternatePhone")}
                        error={errors.alternatePhone?.message as string}
                        placeholder="Landline or other mobile"
                        icon={<Phone size={18} />}
                    />
                </div>

                <Input
                    label="Website / Social Media (Optional)"
                    {...register("website")}
                    error={errors.website?.message as string}
                    placeholder="https://facebook.com/yourpage"
                    icon={<Globe size={18} />}
                    description="Link to your organization website or Facebook page."
                />
            </div>
        </div>
    );
}
