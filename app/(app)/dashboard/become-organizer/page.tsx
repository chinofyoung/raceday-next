"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useForm, FormProvider, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    fullOrganizerSchema,
    OrganizerFormValues,
    organizerStep1Schema,
    organizerStep2Schema,
    organizerStep3Schema,
    organizerStep4Schema
} from "@/lib/validations/organizer";
import { submitOrganizerApplication, checkExistingApplication } from "@/lib/services/applicationService";
import { OrganizerFormStepper } from "./components/OrganizerFormStepper";
import { Step1OrgInfo } from "./components/Step1OrgInfo";
import { Step2Contact } from "./components/Step2Contact";
import { Step3Address } from "./components/Step3Address";
import { Step4Verification } from "./components/Step4Verification";
import { OrganizerFormSummary } from "./components/OrganizerFormSummary";
import { OrganizerApplication } from "@/types/user";

const STEPS = [
    { id: 1, title: "Organization", description: "Basic Info", schema: organizerStep1Schema },
    { id: 2, title: "Contact", description: "Direct Details", schema: organizerStep2Schema },
    { id: 3, title: "Location", description: "Mailing Address", schema: organizerStep3Schema },
    { id: 4, title: "Verification", description: "Identity Docs", schema: organizerStep4Schema },
    { id: 5, title: "Review", description: "Final Summary", schema: null },
];

export default function BecomeOrganizerPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [existingApp, setExistingApp] = useState<OrganizerApplication | null>(null);

    const methods = useForm<OrganizerFormValues>({
        resolver: zodResolver(fullOrganizerSchema) as any,
        mode: "onChange",
        defaultValues: {
            organizerName: "",
            organizerType: undefined,
            description: "",
            contactPerson: "",
            contactEmail: "",
            phone: "",
            address: {
                street: "",
                barangay: "",
                city: "",
                province: "",
                region: "",
                zipCode: "",
            },
            governmentId: {
                type: "",
                idNumber: "",
                frontImageUrl: "",
            }
        },
    });

    const { handleSubmit, trigger, formState: { errors }, reset } = methods;

    useEffect(() => {
        const checkApp = async () => {
            if (!user) return;
            try {
                const app = await checkExistingApplication(user.uid);
                if (app) {
                    setExistingApp(app);
                }
            } catch (error) {
                console.error("Error checking existing application:", error);
            } finally {
                setChecking(false);
            }
        };
        checkApp();
    }, [user]);

    // Pre-fill user data when user is loaded
    useEffect(() => {
        if (user) {
            reset({
                ...methods.getValues(),
                contactPerson: user.displayName || "",
                contactEmail: user.email || "",
                phone: user.phone || "",
            });
        }
    }, [user, reset]);

    const handleNext = async () => {
        const stepSchema = STEPS.find(s => s.id === currentStep)?.schema;
        if (stepSchema) {
            // Validate only current step fields
            const fields = Object.keys((stepSchema as any).shape) as Path<OrganizerFormValues>[];
            if (currentStep === 3) {
                fields.push("address" as any);
            }
            if (currentStep === 4) {
                fields.push("governmentId" as any);
            }

            const isValid = await trigger(fields);
            if (isValid) {
                setCurrentStep(prev => prev + 1);
                window.scrollTo(0, 0);
            }
        } else if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const onSubmit = async (data: OrganizerFormValues) => {
        if (!user) return;
        setLoading(true);
        try {
            await submitOrganizerApplication(user.uid, data);
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting application:", error);
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    if (existingApp) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md p-10 text-center space-y-6 bg-surface shadow-2xl border-white/5">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black italic uppercase text-white">Application {existingApp.status === 'pending' ? 'Pending' : existingApp.status === 'approved' ? 'Approved' : 'Needs Info'}</h1>
                        <p className="text-text-muted font-medium">
                            {existingApp.status === 'pending'
                                ? "You already have a pending application. We are currently reviewing it. Please wait for our update."
                                : existingApp.status === 'approved'
                                    ? "Your organizer application has been approved! You can now create events from your dashboard."
                                    : "We need more information regarding your application. Please check your email for details."}
                        </p>
                    </div>
                    <Button variant="primary" className="w-full" asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </Card>
            </PageWrapper>
        );
    }

    if (submitted) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md p-10 text-center space-y-6 bg-surface shadow-2xl border-cta/20">
                    <div className="w-20 h-20 bg-cta/10 rounded-full flex items-center justify-center mx-auto text-cta">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black italic uppercase text-white">Application Sent!</h1>
                        <p className="text-text-muted font-medium">
                            We&apos;ve received your comprehensive application. Our team will review your identity and organization documents. You will hear from us soon.
                        </p>
                    </div>
                    <Button variant="primary" className="w-full" asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </Card>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4">
                <Link href="/dashboard" className="text-primary text-xs font-black flex items-center gap-1 hover:underline uppercase tracking-widest italic opacity-70">
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight text-white leading-none">
                        Become an <span className="text-primary">Organizer</span>.
                    </h1>
                    <p className="text-lg text-text-muted font-medium italic">Complete the verification process to start hosting races.</p>
                </div>
            </div>

            <OrganizerFormStepper steps={STEPS} currentStep={currentStep} />

            <Card className="p-6 md:p-10 space-y-8 bg-surface border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8 relative z-10">
                        {currentStep === 1 && <Step1OrgInfo />}
                        {currentStep === 2 && <Step2Contact />}
                        {currentStep === 3 && <Step3Address />}
                        {currentStep === 4 && <Step4Verification />}
                        {currentStep === 5 && <OrganizerFormSummary />}

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1 || loading}
                                className={cn("gap-2 uppercase italic font-bold", currentStep === 1 && "invisible")}
                            >
                                <ArrowLeft size={18} /> Back
                            </Button>

                            {currentStep < STEPS.length ? (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleNext}
                                    className="gap-2 px-8 h-12 uppercase italic font-black shadow-lg shadow-primary/20"
                                >
                                    Next Step <ArrowRight size={18} />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="gap-2 px-10 h-14 uppercase italic font-black text-lg shadow-xl shadow-primary/30"
                                    isLoading={loading}
                                >
                                    Submit Application <CheckCircle2 size={20} />
                                </Button>
                            )}
                        </div>
                    </form>
                </FormProvider>
            </Card>

            <div className="text-center p-6 bg-surface/30 border border-white/5 rounded-3xl">
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black italic">
                    Platform Security & Quality Assurance
                </p>
                <p className="text-[11px] text-text-muted/60 mt-2 max-w-xl mx-auto leading-relaxed">
                    By submitting this application, you authorize RaceDay to verify the information provided.
                    Misrepresentation of identity or organization details may lead to permanent platform banning.
                </p>
            </div>
        </PageWrapper>
    );
}
