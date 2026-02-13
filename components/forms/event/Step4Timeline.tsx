"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { EventFormValues } from "@/lib/validations/event";
import { Plus, Trash2, Calendar, Clock, AlignLeft } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

export function Step4Timeline() {
    const { control, register, formState: { errors } } = useFormContext<EventFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "timeline"
    });

    const addTimelineItem = () => {
        append({
            id: uuidv4(),
            activity: "",
            description: "",
            time: "",
            order: fields.length
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Event Timeline</h2>
                    <p className="text-text-muted font-medium">Schedule the day of the race and lead-up activities.</p>
                </div>
                <Button onClick={addTimelineItem} variant="primary" size="sm" className="gap-2 self-start md:self-center">
                    <Plus size={18} /> Add Activity
                </Button>
            </div>

            <div className="space-y-4">
                {fields.length === 0 && (
                    <div className="py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                            <Calendar size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold uppercase italic text-white">No activities scheduled</p>
                            <p className="text-sm text-text-muted font-medium">Keep your runners informed by adding a timeline.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4 max-w-3xl mx-auto">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-6 bg-surface/50 border-white/5 relative group">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                <div className="md:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                                        <Clock size={12} className="text-primary" />
                                        Time
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. 03:00 AM"
                                        {...register(`timeline.${index}.time`)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all"
                                    />
                                    {errors.timeline?.[index]?.time?.message && (
                                        <p className="text-[10px] text-red-500 font-bold uppercase italic">{errors.timeline[index].time.message}</p>
                                    )}
                                </div>

                                <div className="md:col-span-8 space-y-4">
                                    <Input
                                        label="Activity Name"
                                        {...register(`timeline.${index}.activity`)}
                                        error={errors.timeline?.[index]?.activity?.message}
                                        placeholder="e.g. Race Kit Collection"
                                    />
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                                            <AlignLeft size={12} /> Description (Optional)
                                        </label>
                                        <textarea
                                            {...register(`timeline.${index}.description`)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all min-h-[60px]"
                                            placeholder="Details about this activity..."
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-1 pt-8 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2 text-text-muted hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
