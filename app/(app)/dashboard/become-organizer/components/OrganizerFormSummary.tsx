"use client";

import { useFormContext } from "react-hook-form";
import { OrganizerFormValues } from "@/lib/validations/organizer";
import { PH_REGIONS, PH_PROVINCES } from "@/lib/constants/ph-regions";
import { PH_GOVERNMENT_ID_TYPES } from "@/lib/constants/ph-id-types";
import { Mail, Phone, Globe, MapPin, Building2, ShieldCheck, User, Calendar } from "lucide-react";

export function OrganizerFormSummary() {
    const { getValues } = useFormContext<OrganizerFormValues>();
    const data = getValues();

    const regionName = PH_REGIONS.find(r => r.code === data.address.region)?.name || data.address.region;
    const idTypeName = PH_GOVERNMENT_ID_TYPES.find(t => t.value === data.governmentId.type)?.label || data.governmentId.type;

    const SummarySection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
        <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="text-primary">{icon}</div>
                <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">{title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                {children}
            </div>
        </div>
    );

    const DetailItem = ({ label, value, fullWidth }: { label: string, value: string | number | undefined, fullWidth?: boolean }) => (
        <div className={fullWidth ? "md:col-span-2 space-y-1" : "space-y-1"}>
            <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">{label}</span>
            <span className="block text-sm font-bold text-white uppercase italic tracking-tight">{value || "—"}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <SummarySection title="Organization Info" icon={<Building2 size={18} />}>
                <DetailItem label="Name" value={data.organizerName} />
                <DetailItem label="Type" value={data.organizerType} />
                <DetailItem label="Description" value={data.description} fullWidth />
            </SummarySection>

            <SummarySection title="Contact Details" icon={<User size={18} />}>
                <DetailItem label="Contact Person" value={data.contactPerson} />
                <DetailItem label="Business Email" value={data.contactEmail} />
                <DetailItem label="Phone" value={data.phone} />
                <DetailItem label="Alternate Phone" value={data.alternatePhone} />
                <DetailItem label="Website" value={data.website} fullWidth />
            </SummarySection>

            <SummarySection title="Address" icon={<MapPin size={18} />}>
                <DetailItem label="Street" value={data.address?.street} />
                <DetailItem label="Barangay" value={data.address?.barangay} />
                <DetailItem label="City" value={data.address?.city} />
                <DetailItem label="Province" value={data.address?.province} />
                <DetailItem label="Region" value={regionName} />
                <DetailItem label="ZIP Code" value={data.address?.zipCode} />
            </SummarySection>

            <SummarySection title="Verification" icon={<ShieldCheck size={18} />}>
                <DetailItem label="TIN" value={data.organizerTIN} />
                <DetailItem label="DTI/SEC No." value={data.dtiSecRegistration} />
                <DetailItem label="ID Type" value={idTypeName} />
                <DetailItem label="ID Number" value={data.governmentId?.idNumber} />
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    <div className="space-y-2">
                        <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">ID Front</span>
                        <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                            <img src={data.governmentId?.frontImageUrl} alt="ID Front" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    {data.governmentId.backImageUrl && (
                        <div className="space-y-2">
                            <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">ID Back</span>
                            <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                                <img src={data.governmentId.backImageUrl} alt="ID Back" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                    {data.businessPermitUrl && (
                        <div className="space-y-2">
                            <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">Business Permit</span>
                            <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                                <img src={data.businessPermitUrl} alt="Permit" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                </div>
            </SummarySection>

            <SummarySection title="Additional Info" icon={<Calendar size={18} />}>
                <DetailItem label="Past Events" value={data.pastEventsDescription} fullWidth />
                <DetailItem label="Est. Events/Year" value={data.estimatedEventsPerYear} />
            </SummarySection>
        </div>
    );
}
