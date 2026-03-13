"use client";

import { useState } from "react";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { EventFormValues } from "@/lib/validations/event";
import { Plus, Trash2, Map, Shirt, Clock, Ruler, DollarSign, CloudUpload, Info, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn, generateId } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";
import dynamic from "next/dynamic";

const RouteMapViewer = dynamic(
    () => import("@/components/shared/RouteMapViewer").then((mod) => mod.RouteMapViewer),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-3xl">
                <div className="text-center space-y-2 opacity-40">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Loading map...</p>
                </div>
            </div>
        ),
    }
);

export function Step3Categories() {
    const { control, register, formState: { errors } } = useFormContext<EventFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "categories"
    });

    const isEarlyBirdEnabled = useWatch({ control, name: "earlyBird.enabled" });

    const addCategory = () => {
        append({
            id: generateId(),
            name: "",
            distance: 0,
            distanceUnit: "km",
            assemblyTime: "",
            gunStartTime: "",
            cutOffTime: "",
            price: 0,
            inclusions: ["", "", ""],
            raceNumberFormat: "{number}",
            maxParticipants: 0,
            showMaxParticipants: true,
            showRegisteredCount: false,
            registeredCount: 0,
            stations: []
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Distance <span className="text-primary">Categories</span></h2>
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
                                {...register("earlyBird.enabled")}
                                className="w-5 h-5 accent-primary rounded bg-white/10 border-white/20"
                            />
                            <span className="text-sm font-semibold tracking-wide text-white">Enable Early Bird Promo</span>
                        </label>
                        <p className="text-xs text-text-muted ml-8">Offer discounted rates for early registrants.</p>
                    </div>
                </div>

                {isEarlyBirdEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Promo Start Date</label>
                            <input
                                type="date"
                                {...register("earlyBird.startDate")}
                                className="w-full h-10 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                            />
                            {errors.earlyBird?.startDate?.message && <p className="text-xs text-red-500 font-bold uppercase tracking-wide">{errors.earlyBird.startDate.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Promo End Date</label>
                            <input
                                type="date"
                                {...register("earlyBird.endDate")}
                                className="w-full h-10 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                            />
                            {errors.earlyBird?.endDate?.message && <p className="text-xs text-red-500 font-bold uppercase tracking-wide">{errors.earlyBird.endDate.message}</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {fields.length === 0 && (
                    <div className="py-24 text-center space-y-6 bg-white/[0.02] rounded-2xl border-2 border-dashed border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted/30">
                            <Ruler size={40} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-white/50">Ready to start?</p>
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
                    <div className="flex items-center justify-center gap-2 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-wide">
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
    const { fields: inclusionFields, append: appendInclusion, remove: removeInclusion } = useFieldArray({
        control,
        name: `categories.${index}.inclusions` as any
    });

    const gpxUrl = watch(`categories.${index}.routeMap.gpxFileUrl`);

    return (
        <Card className="p-0 overflow-hidden bg-surface/40 border-white/5 shadow-2xl transition-all hover:bg-surface/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-white leading-tight">Category Details</h3>
                        <p className="text-xs font-semibold uppercase text-primary tracking-wider opacity-70">Distance Configuration</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => remove(index)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Remove category"
                    aria-label={`Remove category ${index + 1}`}
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
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Category Name</Label>
                            <Input
                                {...register(`categories.${index}.name`)}
                                placeholder="e.g. 21K Half Marathon"
                            />
                            {errors.categories?.[index]?.name?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted opacity-50 ml-1">Distance</label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    <Input
                                        type="number"
                                        {...register(`categories.${index}.distance`, { valueAsNumber: true })}
                                        placeholder="e.g. 21"
                                        className="pl-9"
                                    />
                                    {errors.categories?.[index]?.distance?.message && <p className="text-xs text-red-500 font-bold uppercase mt-1">{errors.categories[index].distance.message}</p>}
                                </div>
                                <select
                                    {...register(`categories.${index}.distanceUnit`)}
                                    className="h-10 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-text focus:border-primary/50 focus:outline-none transition-all appearance-none cursor-pointer min-w-[80px]"
                                >
                                    <option value="km">km</option>
                                    <option value="mi">mi</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Registration Price (PHP)</Label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                <Input
                                    type="number"
                                    {...register(`categories.${index}.price`, { valueAsNumber: true })}
                                    className="pl-9"
                                />
                            </div>
                            {errors.categories?.[index]?.price?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].price.message}</p>}
                        </div>

                        {watch("earlyBird.enabled") && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Early Bird Price</Label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    <Input
                                        type="number"
                                        {...register(`categories.${index}.earlyBirdPrice`, { valueAsNumber: true })}
                                        className="pl-9 border-primary/50 bg-primary/5 text-primary"
                                    />
                                </div>
                                {errors.categories?.[index]?.earlyBirdPrice?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].earlyBirdPrice.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Race Number Format</Label>
                            <Input
                                {...register(`categories.${index}.raceNumberFormat`)}
                                placeholder="e.g. 21K-{number}"
                            />
                            {errors.categories?.[index]?.raceNumberFormat?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].raceNumberFormat.message}</p>}
                            <p className="text-xs text-text-muted ml-1 opacity-50">Use {"{number}"} as placeholder.</p>
                        </div>

                        <div className="space-y-4 md:col-span-3 pt-4 border-t border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Max Participants</Label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        <Input
                                            type="number"
                                            {...register(`categories.${index}.maxParticipants`, { valueAsNumber: true })}
                                            placeholder="0 for unlimited"
                                            className="pl-9"
                                        />
                                    </div>
                                    {errors.categories?.[index]?.maxParticipants?.message && <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].maxParticipants.message}</p>}
                                    <p className="text-xs text-text-muted ml-1 opacity-50">Maximum number of registrants allowed for this category.</p>
                                </div>
                                <div className="pb-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            {...register(`categories.${index}.showMaxParticipants`)}
                                            className="w-5 h-5 accent-primary rounded bg-white/10 border-white/20"
                                        />
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-semibold tracking-wide text-white group-hover:text-primary transition-colors">Show Slots Remaining</span>
                                            <p className="text-xs text-text-muted font-medium">Display remaining slots to the public.</p>
                                        </div>
                                    </label>
                                </div>
                                <div className="pb-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            {...register(`categories.${index}.showRegisteredCount`)}
                                            className="w-5 h-5 accent-primary rounded bg-white/10 border-white/20"
                                        />
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-semibold tracking-wide text-white group-hover:text-primary transition-colors">Show Participant Count</span>
                                            <p className="text-xs text-text-muted font-medium">Display total registered count to the public.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timing Fields */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted bg-white/5 w-fit px-3 py-1 rounded-full">
                            <Clock size={12} className="text-primary" />
                            Event Timeline
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted opacity-50 ml-1">Assembly Time</label>
                                <input type="time" {...register(`categories.${index}.assemblyTime`)} aria-invalid={!!errors.categories?.[index]?.assemblyTime} className={`w-full h-10 px-4 py-2 bg-white/5 border rounded-xl text-sm [color-scheme:dark] focus:border-primary/50 focus:outline-none transition-all ${errors.categories?.[index]?.assemblyTime ? "border-red-500/50" : "border-white/10"}`} />
                                {errors.categories?.[index]?.assemblyTime?.message && (
                                    <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].assemblyTime.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted opacity-50 ml-1">Gun Start</label>
                                <input type="time" {...register(`categories.${index}.gunStartTime`)} aria-invalid={!!errors.categories?.[index]?.gunStartTime} className={`w-full h-10 px-4 py-2 bg-white/5 border rounded-xl text-sm [color-scheme:dark] focus:border-primary/50 focus:outline-none transition-all ${errors.categories?.[index]?.gunStartTime ? "border-red-500/50" : "border-white/10"}`} />
                                {errors.categories?.[index]?.gunStartTime?.message && (
                                    <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].gunStartTime.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted opacity-50 ml-1">Cut-off Time</label>
                                <input type="time" {...register(`categories.${index}.cutOffTime`)} aria-invalid={!!errors.categories?.[index]?.cutOffTime} className={`w-full h-10 px-4 py-2 bg-white/5 border rounded-xl text-sm [color-scheme:dark] focus:border-primary/50 focus:outline-none transition-all ${errors.categories?.[index]?.cutOffTime ? "border-red-500/50" : "border-white/10"}`} />
                                {errors.categories?.[index]?.cutOffTime?.message && (
                                    <p className="text-xs text-red-500 font-bold uppercase">{errors.categories[index].cutOffTime.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Inclusions */}
                <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Shirt size={16} />
                            </div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Category Inclusions</label>
                        </div>
                        <Button
                            type="button"
                            onClick={() => appendInclusion("")}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 gap-2 border-white/10 text-text-muted hover:text-white hover:bg-white/5"
                        >
                            <Plus size={14} /> Add Inclusion
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {inclusionFields.map((field, inclusionIndex) => (
                            <div key={field.id} className="relative group/inclusion">
                                <input
                                    {...register(`categories.${index}.inclusions.${inclusionIndex}` as const)}
                                    placeholder="e.g. Finisher Medal"
                                    className="w-full h-10 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-text text-sm focus:outline-none focus:border-blue-500/50 transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeInclusion(inclusionIndex)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted opacity-0 group-hover/inclusion:opacity-100 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-text-muted font-medium opacity-50 ml-1">
                        Define items included in this specific distance category.
                    </p>
                </div>

                {/* Bottom Section: Route Map */}
                <div className="space-y-6 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center text-cta">
                                <Map size={16} />
                            </div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Route Configuration</label>
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
                                <p className="text-xs font-bold uppercase tracking-wider text-text-muted max-w-sm mx-auto leading-relaxed">
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

