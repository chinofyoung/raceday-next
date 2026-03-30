"use client";

import { useFormContext } from "react-hook-form";
import { EventFormValues } from "@/lib/validations/event";
import { Calendar, MapPin, AlignLeft, Ruler, Clock, Sparkles, Image as ImageIcon, CreditCard, Upload } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";

export function Step6Review() {
    const { watch } = useFormContext<EventFormValues>();
    const data = watch();

    const formatDateLabel = (date: any) => {
        try {
            const d = date instanceof Date ? date : new Date(date);
            if (isNaN(d.getTime())) return "TBD";
            return format(d, "MMMM d, yyyy");
        } catch {
            return "TBD";
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-bold tracking-tight text-white">Review & Publish</h2>
                <p className="text-text-muted font-medium">Double-check all details before making your event live.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-6">
                        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-white/5">
                            {data.featuredImage ? (
                                <Image src={data.featuredImage} alt="Event featured image" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-text-muted">
                                    <ImageIcon size={48} className="opacity-20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                    {data.name || "Untitled Event"}
                                </h1>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 bg-surface/50 border-white/5 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Calendar size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Event Date</p>
                                    <p className="text-lg font-bold text-white">
                                        {data.date ? formatDateLabel(data.date) : "TBD"}
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-6 bg-surface/50 border-white/5 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-cta/10 flex items-center justify-center text-cta shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Location</p>
                                    <p className="text-lg font-bold text-white">
                                        {data.location?.name || "TBD"}
                                    </p>
                                </div>
                            </Card>


                            <Card className="p-6 bg-surface/50 border-white/5 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                    <Clock size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Reg. Deadline</p>
                                    <p className="text-lg font-bold text-white">
                                        {data.registrationEndDate ? formatDateLabel(data.registrationEndDate) : "TBD"}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted opacity-50">
                            <AlignLeft size={14} /> Description
                        </div>
                        <p className="text-text-muted leading-relaxed font-medium whitespace-pre-wrap">
                            {data.description || "No description provided."}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted opacity-50">
                            <Ruler size={14} /> Categories
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.categories?.map((cat, i) => (
                                <Card key={cat.id || i} className="p-4 bg-white/5 border-white/5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white">{cat.name}</p>
                                        <p className="text-xs text-primary font-bold">{formatDistance(cat.distance, cat.distanceUnit)}</p>
                                    </div>
                                    <div className="text-right">
                                        {data.earlyBird?.enabled && cat.earlyBirdPrice && (
                                            <p className="text-xs font-bold text-green-400 mb-1">
                                                EB: ₱{cat.earlyBirdPrice}
                                            </p>
                                        )}
                                        <p className="text-lg font-bold text-cta">₱{cat.price}</p>
                                    </div>
                                </Card>
                            ))}
                            {(!data.categories || data.categories.length === 0) && (
                                <p className="text-sm text-red-500 font-bold uppercase">No categories added!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Timeline & Stats */}
                <div className="space-y-8">
                    <Card className="p-6 bg-surface border-white/5 space-y-6">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                            <Clock size={16} className="text-primary" /> Timeline
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                            {data.timeline?.map((item, i) => (
                                <div key={`${item.time}-${item.activity}-${i}`} className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-surface border-2 border-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{item.time}</p>
                                    <p className="text-sm font-bold text-white">{item.activity}</p>
                                    {item.description && <p className="text-xs text-text-muted font-medium mt-1">{item.description}</p>}
                                </div>
                            ))}
                            {(!data.timeline || data.timeline.length === 0) && (
                                <p className="text-xs text-text-muted">No timeline entries.</p>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 bg-primary/5 border-primary/20 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                            <Sparkles size={16} /> Features
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-xs font-bold uppercase text-text-muted">Vanity Numbers</span>
                            <span className={cn(
                                "text-xs font-semibold uppercase px-2 py-1 rounded",
                                data.vanityRaceNumber?.enabled ? "bg-cta/20 text-cta" : "bg-white/5 text-text-muted"
                            )}>
                                {data.vanityRaceNumber?.enabled ? "Enabled" : "Disabled"}
                            </span>
                        </div>
                        {data.vanityRaceNumber?.enabled && (
                            <>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-xs font-bold uppercase text-text-muted">Premium Fee</span>
                                    <span className="text-sm font-bold text-cta">₱{data.vanityRaceNumber.premiumPrice}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-xs font-bold uppercase text-text-muted">Max Digits</span>
                                    <span className="text-sm font-bold text-white">{data.vanityRaceNumber.maxDigits}</span>
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-between py-2 border-b border-white/5 pt-4">
                            <span className="text-xs font-bold uppercase text-text-muted">Early Bird</span>
                            <span className={cn(
                                "text-xs font-semibold uppercase px-2 py-1 rounded",
                                data.earlyBird?.enabled ? "bg-green-500/20 text-green-500" : "bg-white/5 text-text-muted"
                            )}>
                                {data.earlyBird?.enabled ? "Active" : "Disabled"}
                            </span>
                        </div>
                        {data.earlyBird?.enabled && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-text-muted">Start</span>
                                    <span className="text-xs font-medium text-white">{data.earlyBird.startDate ? formatDateLabel(data.earlyBird.startDate) : "-"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-text-muted">End</span>
                                    <span className="text-xs font-medium text-white">{data.earlyBird.endDate ? formatDateLabel(data.earlyBird.endDate) : "-"}</span>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card className="p-6 bg-surface border-white/5 space-y-4">
                        {/* Payment Mode */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Payment Mode</h3>
                            <div className="flex items-center gap-2">
                                {data.paymentMode === "manual" ? (
                                    <>
                                        <Upload size={16} className="text-blue-500" />
                                        <span className="text-sm font-semibold text-white">Manual Payment</span>
                                        <Badge className="text-[10px] font-semibold uppercase border px-1.5 py-0 text-blue-500 bg-blue-500/10 border-blue-500/20">
                                            Proof required
                                        </Badge>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={16} className="text-primary" />
                                        <span className="text-sm font-semibold text-white">Payment Portal (Xendit)</span>
                                        <Badge className="text-[10px] font-semibold uppercase border px-1.5 py-0 text-primary bg-primary/10 border-primary/20">
                                            Auto-confirm
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div >
            </div >
        </div >
    );
}
