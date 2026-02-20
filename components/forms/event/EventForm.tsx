"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, EventFormValues } from "@/lib/validations/event";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Save, Send } from "lucide-react";
import { Step1Basic } from "./Step1Basic";
import { Step2Images } from "./Step2Images";
import { Step3Categories } from "./Step3Categories";
import { Step4Timeline } from "./Step4Timeline";
import { Step5Vanity } from "./Step5Vanity";
import { Step6Review } from "./Step6Review";
import { useAuth } from "@/lib/hooks/useAuth";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { toInputDate } from "@/lib/utils";

const STEPS = [
    "Basic Info",
    "Images",
    "Categories",
    "Timeline",
    "Vanity Bibs",
    "Review"
];

interface EventFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function EventForm({ initialData, isEditing }: EventFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(isEditing ? STEPS.length - 1 : 0);
    const [loading, setLoading] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(initialData?.id || null);

    const methods = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema) as any,
        defaultValues: initialData || {
            name: "",
            description: "",
            date: toInputDate(new Date()),
            registrationEndDate: toInputDate(new Date()),
            location: { name: "", address: "" },
            featuredImage: "",
            galleryImages: [],
            vanityRaceNumber: { enabled: false, premiumPrice: 0 },
            earlyBird: { enabled: false },
            timeline: [],
            categories: [],
            status: "draft",
            featured: false,
        },
        mode: "onChange"
    });

    const { handleSubmit, trigger, watch } = methods;
    const values = watch();

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

    const saveDraft = async () => {
        if (!user) {
            toast.error("You must be logged in to save.", {
                description: "Session may have expired. Please refresh."
            });
            return;
        }

        const loadingToast = toast.loading("Saving draft...");

        const values = methods.getValues();
        try {
            if (draftId && typeof draftId === "string" && draftId.length > 0) {
                await updateDoc(doc(db, "events", draftId), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
            } else {
                const res = await addDoc(collection(db, "events"), {
                    ...values,
                    organizerId: user.uid,
                    organizerName: user.displayName || "Unknown Organizer",
                    status: "draft",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                setDraftId(res.id);
            }
            toast.success("Draft saved successfully!", { id: loadingToast });
        } catch (e) {
            console.error("Error saving draft:", e);
            toast.error("Failed to save draft.", {
                id: loadingToast,
                description: "Please check your connection and try again."
            });
        }
    };

    const onSubmit = async (data: EventFormValues) => {
        if (!user) return;
        setLoading(true);
        try {
            const payload = {
                ...data,
                organizerId: user.uid,
                organizerName: user.displayName || "Unknown Organizer",
                status: "published" as const,
                updatedAt: serverTimestamp(),
            };

            if (draftId && typeof draftId === "string" && draftId.length > 0) {
                await updateDoc(doc(db, "events", draftId), payload);
            } else {
                await addDoc(collection(db, "events"), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
            }
            router.push("/dashboard/events");
        } catch (e) {
            console.error("Error publishing event:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="space-y-8 mx-auto">
                {/* Progress Header */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {STEPS.map((step, i) => {
                        const isClickable = i <= maxStepReached;
                        const isActive = currentStep === i;
                        const isAccomplished = (() => {
                            if (i === 0) return !!(values.name?.length >= 5 && values.description?.length >= 20 && values.date && values.location?.name && values.location?.address);
                            if (i === 1) return !!values.featuredImage;
                            if (i === 2) return (values.categories?.length || 0) > 0;
                            if (i === 3) return (values.timeline?.length || 0) > 0;
                            if (i === 4) return i < currentStep || (isEditing && values.vanityRaceNumber);
                            return false;
                        })();

                        return (
                            <div key={i} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                                <button
                                    type="button"
                                    onClick={() => handleStepClick(i)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "flex items-center gap-2 transition-all p-2 rounded-xl shrink-0",
                                        isClickable ? "cursor-pointer hover:bg-white/5" : "cursor-not-allowed opacity-50",
                                        isActive && "bg-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0",
                                        isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" :
                                            isAccomplished ? "bg-cta/20 text-cta" :
                                                "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                    )}>
                                        {isAccomplished ? "✓" : isActive ? i + 1 : "!"}
                                    </div>
                                    <span className={cn(
                                        "hidden md:block text-[10px] uppercase font-black italic tracking-widest transition-colors",
                                        isActive ? "text-white" : isAccomplished ? "text-cta" : "text-text-muted opacity-50",
                                        isClickable && !isActive && "group-hover:text-white"
                                    )}>
                                        {step}
                                    </span>
                                </button>
                                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10 mx-4" />}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-surface/30 backdrop-blur-sm border border-white/5 rounded-3xl p-8 shadow-2xl">
                    {currentStep === 0 && <Step1Basic />}
                    {currentStep === 1 && <Step2Images />}
                    {currentStep === 2 && <Step3Categories />}
                    {currentStep === 3 && <Step4Timeline />}
                    {currentStep === 4 && <Step5Vanity />}
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
