"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CheckCircle2, ShieldCheck, Zap, ArrowLeft, BarChart3, Users } from "lucide-react";
import Link from "next/link";

const schema = z.object({
    organizerName: z.string().min(3, "Organization name is too short"),
    contactEmail: z.string().email("Invalid email"),
    phone: z.string().min(10, "Invalid phone number"),
});

type FormValues = z.infer<typeof schema>;

export default function BecomeOrganizerPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            organizerName: "",
            contactEmail: user?.email || "",
            phone: user?.phone || "",
        },
    });

    const onSubmit = async (data: FormValues) => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Create organizer application
            await addDoc(collection(db, "organizerApplications"), {
                userId: user.uid,
                ...data,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            // 2. Mark user as having an application
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                "organizer.name": data.organizerName,
                "organizer.contactEmail": data.contactEmail,
                "organizer.phone": data.phone,
                "organizer.appliedAt": serverTimestamp(),
                "organizer.approved": false,
            });

            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting application:", error);
        } finally {
            setLoading(false);
        }
    };

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
                            We&apos;ve received your application to become an organizer. Our team will review your request and get back to you within 48 hours.
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
        <PageWrapper className="pt-8 pb-12 space-y-12">
            <div className="flex flex-col gap-4 mx-auto">
                <Link href="/dashboard" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline uppercase tracking-widest italic">
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <div className="space-y-2">
                    <h1 className="text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                        Scale Your <span className="text-primary">Events</span>.
                    </h1>
                    <p className="text-xl text-text-muted font-medium">Join our community of professional race directors and organizers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mx-auto items-start">
                <div className="space-y-10">
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold uppercase italic tracking-tight text-white">Organizer Benefits</h2>
                        <div className="space-y-6">
                            {[
                                { icon: <Zap className="text-primary" />, title: "Rapid Creation", desc: "Build multi-category races with complex pricing in minutes." },
                                { icon: <BarChart3 className="text-cta" />, title: "Live Analytics", desc: "Monitor registrations and revenue in real-time." },
                                { icon: <Users className="text-blue-500" />, title: "Runner Access", desc: "Reach thousands of active runners in our platform." }
                            ].map((benefit, i) => (
                                <div key={i} className="flex gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        {benefit.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-white uppercase italic tracking-wide">{benefit.title}</h4>
                                        <p className="text-sm text-text-muted leading-relaxed">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-surface/50 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <ShieldCheck size={20} />
                            <h4 className="font-bold uppercase italic text-sm">Verified Processing</h4>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                            By applying, you agree to our Organizer Terms of Service. Applications are reviewed manually to ensure platform quality and security for all runners.
                        </p>
                    </div>
                </div>

                <Card className="p-8 space-y-6 bg-surface border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10 space-y-6">
                        <h3 className="text-xl font-bold uppercase italic tracking-tight text-white">Apply Now</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Input
                                label="Organization / Name"
                                {...register("organizerName")}
                                error={errors.organizerName?.message}
                                placeholder="e.g. Run Ph, City Sports Office"
                            />
                            <Input
                                label="Business Email"
                                {...register("contactEmail")}
                                error={errors.contactEmail?.message}
                            />
                            <Input
                                label="Contact Phone"
                                {...register("phone")}
                                error={errors.phone?.message}
                                placeholder="0917 XXX XXXX"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full h-14 uppercase italic font-bold text-lg shadow-lg"
                                isLoading={loading}
                            >
                                Submit Application
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </PageWrapper>
    );
}
