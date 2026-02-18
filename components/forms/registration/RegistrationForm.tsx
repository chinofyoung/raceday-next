"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, RegistrationFormValues } from "@/lib/validations/registration";
import { RaceEvent } from "@/types/event";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Step1Category } from "./Step1Category";
import { Step2Details } from "./Step2Details";
import { Step3Vanity } from "./Step3Vanity";
import { Step4Review } from "./Step4Review";
import { Step0Who } from "./Step0Who";
import { cn } from "@/lib/utils";

const STEPS = ["Who", "Category", "Details", "Vanity", "Review"];

interface RegistrationFormProps {
    event: RaceEvent;
    initialCategoryId?: string | null;
}

export function RegistrationForm({ event, initialCategoryId }: RegistrationFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // If a category is pre-selected via URL, look up its price
    const initialCategory = initialCategoryId
        ? event.categories.find(c => (c.id || "0") === initialCategoryId)
        : null;
    const initialBasePrice = initialCategory ? Number(initialCategory.price) || 0 : 0;

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

    const registrationType = methods.watch("registrationType");

    // Update form when user data loads or registration type changes
    useEffect(() => {
        if (!user) return;

        const currentValues = methods.getValues();

        if (registrationType === "self") {
            methods.reset({
                ...currentValues,
                participantInfo: {
                    name: user.displayName || "",
                    email: user.email || "",
                    phone: user.phone || "",
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
        } else {
            // Proxy - clear fields
            methods.reset({
                ...currentValues,
                participantInfo: {
                    name: "",
                    email: "",
                    phone: "",
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
    }, [user, registrationType, methods]);

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (currentStep === 0) fieldsToValidate = ["registrationType"];
        if (currentStep === 1) fieldsToValidate = ["categoryId"];
        if (currentStep === 2) fieldsToValidate = [
            "participantInfo.name",
            "participantInfo.email",
            "participantInfo.phone",
            "participantInfo.tShirtSize",
            "participantInfo.singletSize",
            "participantInfo.emergencyContact.name",
            "participantInfo.emergencyContact.phone",
            "participantInfo.emergencyContact.relationship"
        ];
        if (currentStep === 3) fieldsToValidate = ["vanityNumber"];

        const isValid = await methods.trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onSubmit = async (data: RegistrationFormValues) => {
        setLoading(true);
        try {
            const selectedCategory = event.categories.find(c => (c.id || "0") === data.categoryId) || event.categories[0];

            const response = await fetch("/api/payments/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registrationData: {
                        ...data,
                        userId: user?.uid,
                        registeredByUserId: user?.uid,
                        registeredByName: user?.displayName || "Unknown",
                        isProxy: data.registrationType === "proxy",
                    },
                    eventName: event.name,
                    categoryName: selectedCategory.name
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Failed to initiate payment");

            if (result.free) {
                // Free registration — go straight to success
                router.push(`/events/${event.id}/register/success?id=${result.registrationId}`);
            } else if (result.checkoutUrl) {
                // Redirect to Xendit Checkout
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
    };

    return (
        <FormProvider {...methods}>
            <div className="space-y-10">
                {/* Progress Tracks */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                    {STEPS.map((step, i) => (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-black italic transition-all duration-300 border-2",
                                i < currentStep
                                    ? "bg-cta border-cta text-white"
                                    : i === currentStep
                                        ? "bg-primary border-primary text-white scale-125 shadow-lg shadow-primary/20"
                                        : "bg-surface border-white/10 text-text-muted"
                            )}>
                                {i < currentStep ? <CheckCircle2 size={18} /> : i + 1}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest italic transition-colors",
                                i <= currentStep ? "text-white" : "text-text-muted"
                            )}>
                                {step}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form Steps */}
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-12">
                    {currentStep === 0 && <Step0Who />}
                    {currentStep === 1 && <Step1Category event={event} />}
                    {currentStep === 2 && <Step2Details event={event} />}
                    {currentStep === 3 && <Step3Vanity event={event} />}
                    {currentStep === 4 && <Step4Review event={event} />}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className={cn(currentStep === 0 && "invisible")}
                            disabled={loading}
                        >
                            <ChevronLeft className="mr-2" size={18} /> Previous
                        </Button>

                        {currentStep === STEPS.length - 1 ? (
                            <Button
                                type="submit"
                                variant="primary"
                                className="bg-cta hover:bg-cta-hover border-none px-12 shadow-xl shadow-cta/20 italic font-black"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Registration"}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={nextStep}
                                className="px-12 italic font-black group"
                                disabled={loading}
                            >
                                Next Step <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </FormProvider>
    );
}
