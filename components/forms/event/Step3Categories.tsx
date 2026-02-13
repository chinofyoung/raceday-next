"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { EventFormValues } from "@/lib/validations/event";
import { Plus, Trash2, Map, Shirt, Clock, Ruler, DollarSign, CloudUpload } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { CldUploadWidget } from "next-cloudinary";
import { RouteMapViewer } from "@/components/shared/RouteMapViewer";

export function Step3Categories() {
    const methods = useFormContext<EventFormValues>();
    const { control, register, watch, formState: { errors } } = methods;
    const { fields, append, remove } = useFieldArray({
        control,
        name: "categories"
    });

    const addCategory = () => {
        append({
            id: uuidv4(),
            name: "",
            distance: "",
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Distance Categories</h2>
                    <p className="text-text-muted font-medium">Add different distances for your event (e.g. 5K, 10K, 21K).</p>
                </div>
                <Button onClick={addCategory} variant="primary" size="sm" className="gap-2 self-start md:self-center">
                    <Plus size={18} /> Add Category
                </Button>
            </div>

            <div className="space-y-6">
                {fields.length === 0 && (
                    <div className="py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                            <Ruler size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold uppercase italic text-white">No categories added yet</p>
                            <p className="text-sm text-text-muted font-medium">Click the button above to add your first distance.</p>
                        </div>
                    </div>
                )}

                {fields.map((field, index) => (
                    <Card key={field.id} className="p-8 space-y-8 bg-surface border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />

                        <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic">
                                    {index + 1}
                                </div>
                                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Category Details</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="p-2 text-text-muted hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Category Name"
                                            {...register(`categories.${index}.name`)}
                                            error={errors.categories?.[index]?.name?.message}
                                            placeholder="e.g. 21K Half Marathon"
                                        />
                                    </div>
                                    <Input
                                        label="Distance"
                                        {...register(`categories.${index}.distance`)}
                                        error={errors.categories?.[index]?.distance?.message}
                                        placeholder="e.g. 21.1 km"
                                    />
                                    <Input
                                        type="number"
                                        label="Price (PHP)"
                                        {...register(`categories.${index}.price`, { valueAsNumber: true })}
                                        error={errors.categories?.[index]?.price?.message}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Assembly</p>
                                        <input type="time" {...register(`categories.${index}.assemblyTime`)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Gun Start</p>
                                        <input type="time" {...register(`categories.${index}.gunStartTime`)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Cut-off</p>
                                        <input type="time" {...register(`categories.${index}.cutOffTime`)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs [color-scheme:dark]" />
                                    </div>
                                </div>

                                <Input
                                    label="Race Number Format"
                                    {...register(`categories.${index}.raceNumberFormat`)}
                                    error={errors.categories?.[index]?.raceNumberFormat?.message}
                                    placeholder="e.g. 21K-{number}"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted italic">Route Map (GPX)</p>
                                    <CldUploadWidget
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                        onSuccess={(res: any) => {
                                            if (res.event === "success") {
                                                const url = res.info.secure_url;
                                                // @ts-ignore
                                                const currentCats = control._formValues.categories;
                                                currentCats[index].routeMap = { gpxFileUrl: url };
                                                methods.setValue("categories", currentCats);
                                            }
                                        }}
                                    >
                                        {({ open }) => (
                                            <button type="button" onClick={() => open?.()} className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
                                                <CloudUpload size={12} /> Upload
                                            </button>
                                        )}
                                    </CldUploadWidget>
                                </div>

                                <div className="aspect-square bg-background rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
                                    {watch(`categories.${index}.routeMap.gpxFileUrl`) ? (
                                        <RouteMapViewer gpxUrl={watch(`categories.${index}.routeMap.gpxFileUrl`)} />
                                    ) : (
                                        <div className="text-center space-y-2 p-6">
                                            <Map className="mx-auto text-text-muted opacity-20" size={32} />
                                            <p className="text-[10px] font-bold uppercase text-text-muted italic">No route map uploaded</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                                <Shirt size={14} className="text-blue-500" />
                                Inclusions
                            </div>
                            <textarea
                                placeholder="List inclusions separated by commas (e.g. Finisher Medal, Shirt, Bib, Food)"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-blue-500 transition-all min-h-[80px]"
                                onChange={(e) => {
                                    const items = e.target.value.split(",").map(i => i.trim()).filter(Boolean);
                                    // @ts-ignore
                                    const currentCats = methods.getValues().categories;
                                    currentCats[index].inclusions = items;
                                    methods.setValue("categories", currentCats);
                                }}
                                defaultValue={field.inclusions?.join(", ")}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            {errors.categories?.message && (
                <p className="text-sm text-red-500 font-bold uppercase italic tracking-wide text-center">{errors.categories.message}</p>
            )}
        </div>
    );
}
