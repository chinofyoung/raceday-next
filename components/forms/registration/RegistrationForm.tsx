"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, RegistrationFormValues } from "@/lib/validations/registration";
import { RaceEvent } from "@/types/event";
import { getEffectivePrice } from "@/lib/earlyBirdUtils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Step1Category } from "./Step1Category";
import { Step2Details } from "./Step2Details";
import { Step3Vanity } from "./Step3Vanity";
import { Step4Review } from "./Step4Review";
import { Step0Who } from "./Step0Who";
import { Step5Payment } from "./Step5Payment";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { calculateCompletion } from "@/lib/validations/profile";
import { useFormSteps } from "@/lib/hooks/useFormSteps";

const DETAILS_FIELDS: (keyof RegistrationFormValues | string)[] = [
    "participantInfo.name",
    "participantInfo.email",
    "participantInfo.phone",
    "participantInfo.gender",
    "participantInfo.birthDate",
    "participantInfo.tShirtSize",
    "participantInfo.singletSize",
    "participantInfo.emergencyContact.name",
    "participantInfo.emergencyContact.phone",
    "participantInfo.emergencyContact.relationship",
];

function buildFormSteps(hasVanity: boolean) {
    const steps = hasVanity
        ? ["Who", "Category", "Details", "Vanity", "Review"]
        : ["Who", "Category", "Details", "Review"];

    const fields: Record<number, (keyof RegistrationFormValues | string)[]> = {
        0: ["registrationType"],
        1: ["categoryId"],
        2: DETAILS_FIELDS,
    };
    if (hasVanity) {
        fields[3] = ["vanityNumber"];
    }

    return { steps, fields };
}

interface RegistrationFormProps {
    event: RaceEvent;
    initialCategoryId?: string | null;
}

function RegistrationFormContent({
    event,
}: {
    event: RaceEvent;
}) {
    const { user } = useAuth();
    const router = useRouter();
    const updateProfileMutation = useMutation(api.users.updateProfile);
    const { handleSubmit, watch, reset, getValues } = useFormContext<RegistrationFormValues>();
    const [loading, setLoading] = useState(false);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [showPaymentStep, setShowPaymentStep] = useState(false);

    const hasVanity = !!event.vanityRaceNumber?.enabled;
    const isManualPayment = event.paymentMode === "manual";
    const { steps: FORM_STEPS, fields: STEP_FIELDS } = buildFormSteps(hasVanity);
    const DISPLAY_STEPS = isManualPayment
        ? [...FORM_STEPS, "Payment"]
        : FORM_STEPS;

    const reviewStepIndex = FORM_STEPS.length - 1;

    const { currentStep, nextStep: baseNextStep, prevStep: basePrevStep } = useFormSteps<RegistrationFormValues>(
        FORM_STEPS.length,
        STEP_FIELDS as any
    );

    const registrationType = watch("registrationType");

    // Update form when user data loads or registration type changes
    useEffect(() => {
        if (!user) return;

        const currentValues = getValues();

        if (registrationType === "self") {
            reset({
                ...currentValues,
                participantInfo: {
                    name: user.displayName || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    gender: user.gender || "" as any,
                    birthDate: user.birthDate || "",
                    tShirtSize: user.tShirtSize || "",
                    singletSize: user.singletSize || "",
                    emergencyContact: {
                        name: user.emergencyContact?.name || "",
                        phone: user.emergencyContact?.phone || "",
                        relationship: user.emergencyContact?.relationship || "",
                    },
                    medicalConditions: user.medicalConditions || "",
                }
            });
        } else if (registrationType === "proxy") {
            reset({
                ...currentValues,
                participantInfo: {
                    name: "",
                    email: "",
                    phone: "",
                    gender: "" as any,
                    birthDate: "",
                    tShirtSize: "",
                    singletSize: "",
                    emergencyContact: {
                        name: "",
                        phone: "",
                        relationship: "",
                    },
                    medicalConditions: "",
                }
            });
        }
    }, [user, registrationType, reset, getValues]);

    const nextStep = async () => {
        await baseNextStep();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prevStep = () => {
        basePrevStep();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Sync user profile from registration data (for "self" registrations)
    const syncProfileFromRegistration = useCallback(async (formData: RegistrationFormValues) => {
        if (formData.registrationType !== "self" || !user) return;

        try {
            const profileData = {
                displayName: formData.participantInfo.name,
                phone: formData.participantInfo.phone,
                gender: formData.participantInfo.gender as any,
                birthDate: formData.participantInfo.birthDate,
                tShirtSize: formData.participantInfo.tShirtSize as any,
                singletSize: formData.participantInfo.singletSize as any,
                emergencyContact: formData.participantInfo.emergencyContact,
                medicalConditions: formData.participantInfo.medicalConditions || "",
            };

            const fullProfileForCalc = {
                ...user,
                ...profileData,
            };

            const completion = calculateCompletion(fullProfileForCalc as any);

            await updateProfileMutation({
                ...profileData,
                profileCompletion: completion,
            });
        } catch (error) {
            console.error("Error syncing profile from registration:", error);
            // Non-fatal — don't block registration
        }
    }, [user, updateProfileMutation]);

    // Submit registration to payment API
    const submitRegistration = useCallback(async (data: RegistrationFormValues, userId: string, displayName: string) => {
        setLoading(true);
        try {
            const selectedCategory = event.categories.find(c => (c.id || "0") === data.categoryId) || event.categories[0];

            const response = await fetch("/api/payments/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registrationData: {
                        ...data,
                        userId: userId,
                        registeredByUserId: userId,
                        registeredByName: displayName || "Unknown",
                        isProxy: data.registrationType === "proxy",
                    },
                    eventName: event.name,
                    categoryName: selectedCategory.name
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Failed to initiate payment");

            if (result.free) {
                router.push(`/events/${event.id}/register/success?id=${result.registrationId}`);
            } else if (result.manualPayment) {
                setRegistrationId(result.registrationId);
                setShowPaymentStep(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                throw new Error("Invalid server response. Please try again.");
            }
        } catch (error: any) {
            console.error("Error submitting registration:", error);
            alert(error.message || "An error occurred during registration. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [event, router]);

    const onSubmit = async (data: RegistrationFormValues) => {
        if (!user) return;

        await syncProfileFromRegistration(data);
        await submitRegistration(data, user._id as string, user.displayName || "Unknown");
    };

    return (
        <div className="space-y-10">
            {/* Progress Tracks */}
            <div className="flex items-center justify-between relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                {(() => {
                    const activeStep = showPaymentStep ? DISPLAY_STEPS.length - 1 : currentStep;
                    return DISPLAY_STEPS.map((step, i) => (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
                                i < activeStep
                                    ? "bg-cta border-cta text-white"
                                    : i === activeStep
                                        ? "bg-primary border-primary text-white scale-125 shadow-lg shadow-primary/20"
                                        : "bg-surface border-white/10 text-text-muted"
                            )}>
                                {i < activeStep ? <CheckCircle2 size={18} /> : i + 1}
                            </div>
                            <span className={cn(
                                "text-xs font-semibold uppercase tracking-wider transition-colors",
                                i <= activeStep ? "text-white" : "text-text-muted"
                            )}>
                                {step}
                            </span>
                        </div>
                    ));
                })()}
            </div>

            {/* Form Steps */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-12 pb-24">
                    {!showPaymentStep && currentStep === 0 && <Step0Who />}
                    {!showPaymentStep && currentStep === 1 && <Step1Category event={event} />}
                    {!showPaymentStep && currentStep === 2 && <Step2Details event={event} />}
                    {!showPaymentStep && hasVanity && currentStep === 3 && <Step3Vanity event={event} />}
                    {!showPaymentStep && currentStep === reviewStepIndex && <Step4Review event={event} />}
                    {showPaymentStep && registrationId && (
                        <Step5Payment
                            event={event}
                            registrationId={registrationId}
                            onComplete={() => {
                                router.push(`/events/${event.id}/register/success?id=${registrationId}&manual=true`);
                            }}
                        />
                    )}
                </div>

                {/* Navigation — sticky bottom bar */}
                {!showPaymentStep && (
                    <div className="sticky bottom-0 z-50 -mx-4 px-4 md:-mx-0 md:px-0 py-4 bg-background/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className={cn(currentStep === 0 && "invisible")}
                            disabled={loading}
                        >
                            <ChevronLeft className="mr-2" size={18} /> Previous
                        </Button>

                        {currentStep === reviewStepIndex ? (
                            <Button
                                type="submit"
                                variant="primary"
                                className="bg-cta hover:bg-cta-hover border-none px-12 shadow-xl shadow-cta/20 font-bold"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Submit"}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={nextStep}
                                className="px-12 font-bold group"
                                disabled={loading}
                            >
                                Next Step <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                            </Button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}

export function RegistrationForm({ event, initialCategoryId }: RegistrationFormProps) {
    const { user } = useAuth();

    const initialCategory = initialCategoryId
        ? event.categories.find(c => (c.id || "0") === initialCategoryId)
        : null;
    const initialBasePrice = initialCategory ? getEffectivePrice(event, initialCategory) : 0;

    const methods = useForm<RegistrationFormValues>({
        resolver: zodResolver(registrationSchema) as any,
        defaultValues: {
            eventId: event.id,
            registrationType: "self",
            categoryId: initialCategoryId || "",
            participantInfo: {
                name: user?.displayName || "",
                email: user?.email || "",
                phone: user?.phone || "",
                gender: (user?.gender || "") as any,
                birthDate: user?.birthDate || "",
                tShirtSize: user?.tShirtSize || "",
                singletSize: user?.singletSize || "",
                emergencyContact: {
                    name: user?.emergencyContact?.name || "",
                    phone: user?.emergencyContact?.phone || "",
                    relationship: user?.emergencyContact?.relationship || "",
                },
                medicalConditions: user?.medicalConditions || "",
            },
            vanityNumber: "",
            basePrice: initialBasePrice,
            vanityPremium: 0,
            totalPrice: initialBasePrice,
            termsAccepted: false,
        },
        mode: "onChange"
    });

    return (
        <FormProvider {...methods}>
            <RegistrationFormContent event={event} />
        </FormProvider>
    );
}
