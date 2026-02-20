"use client";

import { useState } from "react";
import { OrganizerApplication, OrganizerType } from "@/types/user";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    UserCheck, Mail, Phone, Calendar, ChevronDown, ChevronUp,
    ShieldCheck, Globe, MapPin, Building2, ExternalLink,
    CheckCircle2, XCircle, Info, Loader2, Download
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PH_REGIONS } from "@/lib/constants/ph-regions";
import { PH_GOVERNMENT_ID_TYPES } from "@/lib/constants/ph-id-types";

interface ApplicationCardProps {
    app: OrganizerApplication;
    processing: boolean;
    onApprove: (app: OrganizerApplication) => void;
    onReject: (app: OrganizerApplication) => void;
    onNeedsInfo: (app: OrganizerApplication) => void;
}

export function ApplicationCard({ app, processing, onApprove, onReject, onNeedsInfo }: ApplicationCardProps) {
    const [expanded, setExpanded] = useState(false);

    const regionName = app.address?.region ? (PH_REGIONS.find(r => r.code === app.address.region)?.name || app.address.region) : "N/A";
    const idTypeName = app.governmentId?.type ? (PH_GOVERNMENT_ID_TYPES.find(t => t.value === app.governmentId.type)?.label || app.governmentId.type) : "N/A";

    const DetailItem = ({ label, value, icon, fullWidth }: { label: string, value: string | number | undefined, icon?: React.ReactNode, fullWidth?: boolean }) => (
        <div className={cn("space-y-1", fullWidth ? "col-span-full" : "")}>
            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest italic flex items-center gap-1">
                {icon} {label}
            </p>
            <p className="text-sm font-bold text-white uppercase italic tracking-tight truncate">
                {value || "—"}
            </p>
        </div>
    );

    const checklist = [
        { label: "Gov't ID Uploaded", checked: !!app.governmentId?.frontImageUrl },
        { label: "TIN Provided", checked: !!app.organizerTIN, optional: true },
        { label: "Permit Uploaded", checked: !!app.businessPermitUrl, optional: true },
        { label: "Address Complete", checked: !!(app.address?.street && app.address?.city && app.address?.region) },
        { label: "Past Events", checked: !!app.pastEventsDescription, optional: true },
    ];

    return (
        <Card className={cn(
            "bg-surface/40 border-white/5 transition-all relative group overflow-hidden",
            expanded ? "ring-2 ring-primary/20 bg-surface/60" : "hover:bg-surface/50"
        )}>
            {/* Header / Summary Row */}
            <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500",
                        app.status === 'pending' ? 'bg-cta/10 text-cta' : app.status === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    )}>
                        <Building2 size={32} />
                    </div>
                    <div className="space-y-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black italic uppercase text-white leading-tight truncate">{app.organizerName}</h3>
                            <Badge variant={
                                app.status === "pending" ? "cta" :
                                    app.status === "approved" ? "success" :
                                        app.status === "needs_info" ? "warning" : "destructive"
                            } className="text-[9px] font-black uppercase italic tracking-widest px-2 py-0.5">
                                {app.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted text-[10px] font-bold uppercase italic">
                            <span className="flex items-center gap-1.5"><Mail size={12} className="text-primary" /> {app.contactEmail}</span>
                            <span className="flex items-center gap-1.5"><Phone size={12} className="text-cta" /> {app.phone}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {formatDate(app.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="gap-2 text-[10px] font-black uppercase italic bg-white/5"
                    >
                        {expanded ? (
                            <><ChevronUp size={16} /> Hide Details</>
                        ) : (
                            <><ChevronDown size={16} /> View Details</>
                        )}
                    </Button>

                    {app.status === "pending" || app.status === "needs_info" ? (
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onApprove(app)}
                                disabled={processing}
                                className="bg-success hover:bg-success/80 border-none h-10 px-6 font-black italic uppercase"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : "Approve"}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-[9px] font-black uppercase italic text-text-muted">
                            Reviewed {app.reviewedAt ? formatDate(app.reviewedAt) : 'N/A'}
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable Panel */}
            {expanded && (
                <div className="px-8 pb-8 pt-2 space-y-8 animate-in slide-in-from-top-4 duration-300 relative z-10">
                    <hr className="border-white/5" />

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Checkbox Summary */}
                        <div className="lg:col-span-1 space-y-4">
                            <h4 className="text-[11px] font-black uppercase italic tracking-widest text-primary">Verification Checklist</h4>
                            <div className="space-y-3">
                                {checklist.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 opacity-80">
                                        {item.checked ? (
                                            <CheckCircle2 size={16} className="text-success" />
                                        ) : (
                                            <div className={cn("w-4 h-4 rounded-full border-2", item.optional ? "border-white/10" : "border-destructive/40")} />
                                        )}
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase italic",
                                            item.checked ? "text-white" : "text-text-muted"
                                        )}>
                                            {item.label} {item.optional && "(Opt)"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {app.adminNotes && (
                                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
                                    <p className="text-[9px] font-black uppercase text-primary italic">Admin Notes</p>
                                    <p className="text-xs text-text-muted italic">{app.adminNotes}</p>
                                </div>
                            )}
                        </div>

                        {/* Full Data */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Organization */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                    <Building2 size={14} className="text-primary" /> Organization
                                </h4>
                                <div className="space-y-4 px-2">
                                    <DetailItem label="Type" value={app.organizerType} />
                                    <DetailItem label="Description" value={app.description} fullWidth />
                                </div>
                            </div>

                            {/* Contact & Address */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                    <MapPin size={14} className="text-cta" /> Address & Contact
                                </h4>
                                <div className="space-y-4 px-2">
                                    <DetailItem label="Contact Person" value={app.contactPerson} />
                                    <DetailItem label="Full Address" value={app.address ? `${app.address.street}, ${app.address.barangay}, ${app.address.city}, ${app.address.province}` : "N/A"} fullWidth />
                                    <DetailItem label="Region" value={regionName} />
                                    <DetailItem label="ZIP Code" value={app.address?.zipCode} />
                                    {app.website && <DetailItem label="Website" value={app.website} icon={<Globe size={10} />} fullWidth />}
                                </div>
                            </div>

                            {/* Official Verification */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-blue-500" /> Verification
                                </h4>
                                <div className="space-y-4 px-2">
                                    <DetailItem label="BIR TIN" value={app.organizerTIN} />
                                    <DetailItem label="DTI/SEC No." value={app.dtiSecRegistration} />
                                    <DetailItem label="ID Type" value={idTypeName} />
                                    <DetailItem label="ID Number" value={app.governmentId?.idNumber} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black uppercase italic tracking-widest text-white">Verification Documents</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {app.governmentId?.frontImageUrl && (
                                <div className="space-y-2">
                                    <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">ID Front</span>
                                    <a href={app.governmentId.frontImageUrl} target="_blank" rel="noreferrer" className="block group/img aspect-video rounded-xl overflow-hidden border border-white/10 relative">
                                        <img src={app.governmentId.frontImageUrl} alt="ID Front" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <ExternalLink size={20} className="text-white" />
                                        </div>
                                    </a>
                                </div>
                            )}
                            {app.governmentId?.backImageUrl && (
                                <div className="space-y-2">
                                    <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">ID Back</span>
                                    <a href={app.governmentId.backImageUrl} target="_blank" rel="noreferrer" className="block group/img aspect-video rounded-xl overflow-hidden border border-white/10 relative">
                                        <img src={app.governmentId.backImageUrl} alt="ID Back" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <ExternalLink size={20} className="text-white" />
                                        </div>
                                    </a>
                                </div>
                            )}
                            {app.businessPermitUrl && (
                                <div className="space-y-2">
                                    <span className="block text-[9px] font-black uppercase text-text-muted italic opacity-50">Business Permit</span>
                                    <a href={app.businessPermitUrl} target="_blank" rel="noreferrer" className="block group/img aspect-video rounded-xl overflow-hidden border border-white/10 relative">
                                        <img src={app.businessPermitUrl} alt="Permit" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <ExternalLink size={20} className="text-white" />
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-white/5 justify-end">
                        {(app.status === "pending" || app.status === "needs_info") && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => onNeedsInfo(app)}
                                    disabled={processing}
                                    className="gap-2 text-[10px] font-black uppercase italic border-cta/30 text-cta hover:bg-cta/5"
                                >
                                    <Info size={16} /> Request More Info
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => onReject(app)}
                                    disabled={processing}
                                    className="gap-2 text-[10px] font-black uppercase italic border-red-500/30 text-red-500 hover:bg-red-500/5"
                                >
                                    <XCircle size={16} /> Reject
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => onApprove(app)}
                                    disabled={processing}
                                    className="gap-2 text-[10px] font-black uppercase italic bg-success hover:bg-success/80 border-none"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Approve Organization</>}
                                </Button>
                            </>
                        )}
                        {app.status === "rejected" && (
                            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-500">
                                <Info size={20} className="shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase italic tracking-widest">Rejection Reason</p>
                                    <p className="text-sm font-bold">{app.rejectionReason}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
