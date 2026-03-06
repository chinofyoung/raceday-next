"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, EventFormValues, EventFormInput } from "@/lib/validations/event";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Save, Send } from "lucide-react";
import { Step1Basic } from "./Step1Basic";
import { Step2Images } from "./Step2Images";
import { Step3Categories } from "./Step3Categories";
import { Step4Timeline } from "./Step4Timeline";
import { Step5Features } from "./Step5Features";
import { Step6Review } from "./Step6Review";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toInputDate } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const STEPS = [
    "Basic Info",
    "Images",
    "Categories",
    "Timeline",
    "Features",
    "Review"
];

interface EventFormProps {
    initialData?: EventFormInput;
    isEditing?: boolean;
}

export function EventForm({ initialData, isEditing }: EventFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(isEditing ? STEPS.length - 1 : 0);
    const [loading, setLoading] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(initialData?.id || null);

    const createEvent = useMutation(api.events.create);
    const updateEvent = useMutation(api.events.update);

    const methods = useForm<EventFormInput>({
        resolver: zodResolver(eventSchema) as any,
        defaultValues: initialData || {
            name: "",
            description: "",
            date: toInputDate(new Date()),
            registrationEndDate: toInputDate(new Date()),
            location: { name: "", address: "" },
            featuredImage: "",
            galleryImages: [],
            vanityRaceNumber: { enabled: false, premiumPrice: 0, maxDigits: 4 },
            earlyBird: { enabled: false },
            timeline: [],
            categories: [],
            status: "draft",
            featured: false,
            isLiveTrackingEnabled: true,
        },
        mode: "onChange"
    });

    const { handleSubmit, trigger, control } = methods;
    const [watchName, watchDescription, watchDate, watchFeaturedImage, watchCategories, watchTimeline, watchVanity, watchLocationName, watchLocationAddress] =
        useWatch({
            control,
            name: ["name", "description", "date", "featuredImage", "categories", "timeline", "vanityRaceNumber", "location.name", "location.address"],
        });

    const nextStep = async () => {
        // Validate current step before proceeding
        let fieldsToValidate: any[] = [];
        if (currentStep === 0) fieldsToValidate = ["name", "description", "date", "registrationEndDate", "location.name", "location.address"];
        if (currentStep === 1) fieldsToValidate = ["featuredImage", "galleryImages"];
        if (currentStep === 2) fieldsToValidate = ["categories", "earlyBird"];
        if (currentStep === 3) fieldsToValidate = ["timeline"];

        const isValid = await trigger(fieldsToValidate as any);
        if (isValid) {
            const next = Math.min(currentStep + 1, STEPS.length - 1);
            setCurrentStep(next);
            setMaxStepReached(prev => Math.max(prev, next));
            // Autosave draft if it's the first time or every step
            saveDraft();
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleStepClick = (i: number) => {
        if (i <= maxStepReached) {
            setCurrentStep(i);
        }
    };

    const saveDraft = useCallback(async () => {
        if (!user) {
            toast.error("You must be logged in to save.", {
                description: "Session may have expired. Please refresh."
            });
            return;
        }

        const loadingToast = toast.loading("Saving draft...");

        const values = methods.getValues();
        try {
            // Clean system and metadata fields that Convex doesn't allow in args
            const { _id, _creationTime, id: _, createdAt, updatedAt, organizerId, organizerName, ...rest } = values as any;

            const payload = {
                ...rest,
                date: new Date(values.date).getTime(),
                registrationEndDate: new Date(values.registrationEndDate).getTime(),
                earlyBird: values.earlyBird?.enabled ? {
                    enabled: true,
                    startDate: values.earlyBird.startDate ? new Date(values.earlyBird.startDate).getTime() : 0,
                    endDate: values.earlyBird.endDate ? new Date(values.earlyBird.endDate).getTime() : 0,
                } : undefined,
                status: "draft" as const,
                featured: values.featured ?? false,
                isLiveTrackingEnabled: values.isLiveTrackingEnabled ?? true,
            };

            if (draftId && draftId.length > 20) { // Convex IDs are typically > 20 chars
                await updateEvent({
                    id: draftId as any,
                    ...payload as any,
                });
            } else {
                const res = await createEvent({
                    ...payload,
                });
                setDraftId(res);
            }
            toast.success("Draft saved successfully!", { id: loadingToast });
        } catch (e) {
            console.error("Error saving draft:", e);
            toast.error("Failed to save draft.", {
                id: loadingToast,
                description: "Please check your connection and try again."
            });
        }
    }, [user, draftId, methods, createEvent, updateEvent]);

    const onSubmit = async (data: EventFormInput) => {
        if (!user) return;
        setLoading(true);

        // Clean system and metadata fields
        const { _id, _creationTime, id: _, createdAt, updatedAt, organizerId, organizerName, ...rest } = data as any;

        const payload = {
            ...rest,
            date: new Date(data.date).getTime(),
            registrationEndDate: new Date(data.registrationEndDate).getTime(),
            earlyBird: data.earlyBird?.enabled ? {
                enabled: true,
                startDate: data.earlyBird.startDate ? new Date(data.earlyBird.startDate).getTime() : 0,
                endDate: data.earlyBird.endDate ? new Date(data.earlyBird.endDate).getTime() : 0,
            } : undefined,
            status: "published" as const,
            featured: data.featured ?? false,
            isLiveTrackingEnabled: data.isLiveTrackingEnabled ?? true,
        };

        try {
            if (draftId && draftId.length > 20) {
                await updateEvent({
                    id: draftId as any,
                    ...payload as any,
                });
            } else {
                await createEvent({
                    ...payload,
                });
            }
            router.push("/dashboard/organizer/events");
        } catch (e: any) {
            console.error("Error publishing event:", e);
            toast.error("Failed to publish event.", {
                description: e?.message || "Please check your connection and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="space-y-8 mx-auto">
                {/* Progress Header */}
                <div className="flex items-center gap-2 md:justify-between overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth whitespace-nowrap">
                    {STEPS.map((step, i) => {
                        const isClickable = i <= maxStepReached;
                        const isActive = currentStep === i;
                        const isAccomplished = (() => {
                            if (i === 0) return !!(watchName?.length >= 5 && watchDescription?.length >= 20 && watchDate && watchLocationName && watchLocationAddress);
                            if (i === 1) return !!watchFeaturedImage;
                            if (i === 2) return (watchCategories?.length || 0) > 0;
                            if (i === 3) return (watchTimeline?.length || 0) > 0;
                            if (i === 4) return i < currentStep || (isEditing && watchVanity);
                            return false;
                        })();

                        return (
                            <div key={i} className={cn("flex items-center shrink-0", i < STEPS.length - 1 && "md:flex-1")}>
                                <button
                                    type="button"
                                    onClick={() => handleStepClick(i)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "flex items-center gap-2 transition-all p-2 rounded-xl shrink-0",
                                        isClickable ? "cursor-pointer hover:bg-white/5 font-bold" : "cursor-not-allowed opacity-50",
                                        isActive && "bg-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0",
                                        isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/40 ring-4 ring-primary/10" :
                                            isAccomplished ? "bg-cta/20 text-cta" :
                                                "bg-white/5 text-text-muted border border-white/10"
                                    )}>
                                        {isAccomplished ? "✓" : i + 1}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] uppercase font-black italic tracking-widest transition-colors",
                                        isActive ? "text-white block" : "block text-text-muted opacity-40",
                                        isAccomplished && !isActive && "text-cta opacity-70",
                                        isClickable && !isActive && "group-hover:text-white"
                                    )}>
                                        {step}
                                    </span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={cn(
                                        "h-px bg-white/10 mx-2 md:mx-4 shrink-0",
                                        "w-4 md:w-auto md:flex-1"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-surface/30 backdrop-blur-sm border border-white/5 rounded-3xl p-8 shadow-2xl">
                    {currentStep === 0 && <Step1Basic />}
                    {currentStep === 1 && <Step2Images />}
                    {currentStep === 2 && <Step3Categories />}
                    {currentStep === 3 && <Step4Timeline />}
                    {currentStep === 4 && <Step5Features />}
                    {currentStep === 5 && <Step6Review />}

                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 0 || loading}
                            className="gap-2"
                        >
                            <ChevronLeft size={18} /> Previous
                        </Button>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={saveDraft} disabled={loading} className="hidden md:flex gap-2">
                                <Save size={18} /> Save Draft
                            </Button>

                            {initialData?.status === "published" && currentStep < STEPS.length - 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={loading}
                                    className="hidden md:flex gap-2 px-8 border-primary/20 hover:bg-primary/5 text-primary italic font-black uppercase text-[10px] tracking-widest"
                                >
                                    <Send size={18} /> Save & Publish
                                </Button>
                            )}

                            {currentStep < STEPS.length - 1 ? (
                                <Button variant="primary" onClick={nextStep} disabled={loading} className="gap-2 px-8">
                                    Next Step <ChevronRight size={18} />
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit(onSubmit)}
                                    isLoading={loading}
                                    className="gap-2 px-10 bg-cta hover:bg-cta-hover border-none"
                                >
                                    Publish Event <Send size={18} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FormProvider>
    );
}
