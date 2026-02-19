"use client";

import { useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { EventFormValues } from "@/lib/validations/event";
import { Plus, Trash2, Map, Shirt, Clock, Ruler, DollarSign, CloudUpload, Info } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { RouteMapViewer } from "@/components/shared/RouteMapViewer";

export function Step3Categories() {
    const { control, formState: { errors } } = useFormContext<EventFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "categories"
    });

    const isEarlyBirdEnabled = useFormContext<EventFormValues>().watch("earlyBird.enabled");

    const addCategory = () => {
        append({
            id: uuidv4(),
            name: "",
            distance: 0,
            distanceUnit: "km",
            assemblyTime: "",
            gunStartTime: "",
            cutOffTime: "",
            price: 0,
            inclusions: ["Race Bib"],
            raceNumberFormat: "{number}",
            registeredCount: 0
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Distance <span className="text-primary">Categories</span></h2>
                    <p className="text-text-muted font-medium">Define the race distances and their specific logistics.</p>
                </div>
                <Button onClick={addCategory} variant="primary" className="gap-2 self-start md:self-center bg-cta hover:bg-cta-hover border-none shadow-lg shadow-cta/20">
                    <Plus size={18} /> Add Category
                </Button>
            </div>

            {/* Early Bird Configuration */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                {...useFormContext<EventFormValues>().register("earlyBird.enabled")}
                                className="w-5 h-5 accent-primary rounded bg-white/10 border-white/20"
                            />
                            <span className="text-sm font-black italic uppercase tracking-wide text-white">Enable Early Bird Promo</span>
                        </label>
                        <p className="text-xs text-text-muted ml-8">Offer discounted rates for early registrants.</p>
                    </div>
                </div>

                {isEarlyBirdEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Promo Start Date</label>
                            <input
                                type="date"
                                {...useFormContext<EventFormValues>().register("earlyBird.startDate", { valueAsDate: true })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                            />
                            {errors.earlyBird?.startDate?.message && <p className="text-xs text-red-500 font-bold uppercase italic tracking-wide">{errors.earlyBird.startDate.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Promo End Date</label>
                            <input
                                type="date"
                                {...useFormContext<EventFormValues>().register("earlyBird.endDate", { valueAsDate: true })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                            />
                            {errors.earlyBird?.endDate?.message && <p className="text-xs text-red-500 font-bold uppercase italic tracking-wide">{errors.earlyBird.endDate.message}</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {fields.length === 0 && (
                    <div className="py-24 text-center space-y-6 bg-white/[0.02] rounded-[2rem] border-2 border-dashed border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted/30">
                            <Ruler size={40} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold uppercase italic text-white/50">Ready to start?</p>
                            <p className="text-sm text-text-muted max-w-xs mx-auto">Add your first race category (e.g., 5K Fun Run or 42K Marathon) to begin.</p>
                        </div>
                        <Button onClick={addCategory} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                            Add First Category
                        </Button>
                    </div>
                )}

                {fields.map((field, index) => (
                    <CategoryItem
                        key={field.id}
                        index={index}
                        remove={remove}
                        field={field}
                    />
                ))}
            </div>

            {
                errors.categories?.message && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 text-sm font-bold uppercase italic tracking-wide">
                        <Info size={16} />
                        {errors.categories.message}
                    </div>
                )
            }
        </div >
    );
}

function CategoryItem({ index, remove, field }: { index: number, remove: (index: number) => void, field: any }) {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<EventFormValues>();
    const [inclusionsText, setInclusionsText] = useState(field.inclusions?.join(", ") || "");

    const handleInclusionsBlur = () => {
        const items = inclusionsText.split(",").map((item: string) => item.trim()).filter(Boolean);
        setValue(`categories.${index}.inclusions`, items, { shouldValidate: true });
    };

    const gpxUrl = watch(`categories.${index}.routeMap.gpxFileUrl`);

    return (
        <Card className="p-0 overflow-hidden bg-surface/40 border-white/5 shadow-2xl transition-all hover:bg-surface/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black italic text-xl shadow-inner">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold uppercase italic tracking-tight text-white leading-tight">Category Details</h3>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest italic opacity-70">Distance Configuration</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => remove(index)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Remove category"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-10">
                {/* Top Section: General Info & Timing */}
                <div className="space-y-8">
                    {/* Basic Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3">
                            <Input
                                label="Category Name"
                                {...register(`categories.${index}.name`)}
                                error={errors.categories?.[index]?.name?.message}
                                placeholder="e.g. 21K Half Marathon"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 ml-1">Distance</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        {...register(`categories.${index}.distance`, { valueAsNumber: true })}
                                        error={errors.categories?.[index]?.distance?.message}
                                        placeholder="e.g. 21"
                                        icon={<Ruler size={16} />}
                                    />
                                </div>
                                <select
                                    {...register(`categories.${index}.distanceUnit`)}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-text focus:border-primary/50 focus:outline-none transition-all appearance-none cursor-pointer min-w-[80px]"
                                >
                                    <option value="km">km</option>
                                    <option value="mi">mi</option>
                                </select>
                            </div>
                        </div>
                        <Input
                            type="number"
                            label="Registration Price (PHP)"
                            {...register(`categories.${index}.price`, { valueAsNumber: true })}
                            error={errors.categories?.[index]?.price?.message}
                            icon={<DollarSign size={16} />}
                        />

                        {watch("earlyBird.enabled") && (
                            <Input
                                type="number"
                                label="Early Bird Price"
                                {...register(`categories.${index}.earlyBirdPrice`, { valueAsNumber: true })}
                                error={errors.categories?.[index]?.earlyBirdPrice?.message}
                                icon={<DollarSign size={16} />}
                                className="border-primary/50 bg-primary/5 text-primary"
                            />
                        )}

                        <Input
                            label="Race Number Format"
                            {...register(`categories.${index}.raceNumberFormat`)}
                            error={errors.categories?.[index]?.raceNumberFormat?.message}
                            placeholder="e.g. 21K-{number}"
                            description="Use {number} as placeholder."
                        />
                    </div>

                    {/* Timing Fields */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted italic bg-white/5 w-fit px-3 py-1 rounded-full">
                            <Clock size={12} className="text-primary" />
                            Event Timeline
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 ml-1">Assembly Time</label>
                                <input type="time" {...register(`categories.${index}.assemblyTime`)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark] focus:border-primary/50 focus:outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 ml-1">Gun Start</label>
                                <input type="time" {...register(`categories.${index}.gunStartTime`)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark] focus:border-primary/50 focus:outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 ml-1">Cut-off Time</label>
                                <input type="time" {...register(`categories.${index}.cutOffTime`)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm [color-scheme:dark] focus:border-primary/50 focus:outline-none transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Inclusions */}
                <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Shirt size={16} />
                        </div>
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted italic">Category Inclusions</label>
                    </div>
                    <textarea
                        placeholder="List inclusions separated by commas (e.g. Finisher Medal, Shirt, Bib, Food)"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-text text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[100px] resize-none"
                        value={inclusionsText}
                        onChange={(e) => setInclusionsText(e.target.value)}
                        onBlur={handleInclusionsBlur}
                    />
                    <p className="text-[10px] text-text-muted italic font-medium opacity-50 ml-1">
                        Tip: Separate items with commas to display them as a list on the event page.
                    </p>
                </div>

                {/* Bottom Section: Route Map */}
                <div className="space-y-6 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center text-cta">
                                <Map size={16} />
                            </div>
                            <label className="text-xs font-black uppercase tracking-widest text-text-muted italic">Route Configuration</label>
                        </div>
                        <div className="w-auto">
                            <ImageUpload
                                value={gpxUrl}
                                onChange={(url) => {
                                    setValue(`categories.${index}.routeMap.gpxFileUrl`, url, { shouldValidate: true });
                                }}
                                resourceType="raw"
                                acceptedFileTypes=".gpx,.xml"
                                variant="compact"
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="aspect-[21/9] bg-black/40 rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center relative group min-h-[300px]">
                        {gpxUrl ? (
                            <RouteMapViewer gpxUrl={gpxUrl} />
                        ) : (
                            <div className="text-center space-y-3 p-8 opacity-40 group-hover:opacity-60 transition-opacity">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                    <Map size={32} />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted italic max-w-sm mx-auto leading-relaxed">
                                    No GPX route uploaded. Uploading a GPX file will generate an interactive map for participants.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

