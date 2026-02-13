"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, MapPin, Phone, ShieldAlert, Shirt, Edit2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    const completion = user.profileCompletion || 0;

    const infoGroups = [
        {
            title: "Personal Information",
            icon: <User className="text-primary" size={20} />,
            fields: [
                { label: "Full Name", value: user.displayName || "Not set" },
                { label: "Email Address", value: user.email },
                { label: "Phone Number", value: user.phone || "Not set" },
                { label: "Medical Conditions", value: user.medicalConditions || "None disclosed" },
            ]
        },
        {
            title: "Residential Address",
            icon: <MapPin className="text-cta" size={20} />,
            fields: [
                { label: "Street", value: user.address?.street || "Not set" },
                { label: "City", value: user.address?.city || "Not set" },
                { label: "Province", value: user.address?.province || "Not set" },
                { label: "ZIP Code", value: user.address?.zipCode || "Not set" },
            ]
        },
        {
            title: "Emergency Contact",
            icon: <ShieldAlert className="text-red-500" size={20} />,
            fields: [
                { label: "Contact Name", value: user.emergencyContact?.name || "Not set" },
                { label: "Relationship", value: user.emergencyContact?.relationship || "Not set" },
                { label: "Contact Phone", value: user.emergencyContact?.phone || "Not set" },
            ]
        },
        {
            title: "Apparel Sizes",
            icon: <Shirt className="text-blue-500" size={20} />,
            fields: [
                { label: "T-Shirt Size", value: user.tShirtSize || "Not set" },
                { label: "Singlet Size", value: user.singletSize || "Not set" },
            ]
        }
    ];

    return (
        <PageWrapper className="pt-8 pb-12 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/dashboard" className="text-text-muted hover:text-primary text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1 transition-colors">
                        <ArrowLeft size={12} /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-surface rounded-full border-4 border-primary/20 overflow-hidden shadow-2xl">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10">
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black italic uppercase tracking-tight text-white leading-none">{user.displayName}</h1>
                            <Badge variant="outline" className="border-primary text-primary px-3 py-0.5">{user.role}</Badge>
                        </div>
                    </div>
                </div>
                <Button variant="primary" asChild>
                    <Link href="/dashboard/settings"><Edit2 size={16} className="mr-2" /> Edit Profile</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Col: Info Cards */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {infoGroups.map((group, i) => (
                            <Card key={i} className="p-8 space-y-6 bg-surface/50 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                    {group.icon}
                                    <h3 className="font-bold uppercase italic tracking-wider text-sm text-text">{group.title}</h3>
                                </div>
                                <div className="space-y-4">
                                    {group.fields.map((field, j) => (
                                        <div key={j} className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest leading-none">{field.label}</p>
                                            <p className="text-base font-semibold text-text">{field.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Col: Completion & Tools */}
                <div className="space-y-8">
                    <Card className="p-8 text-center space-y-6 bg-primary/5 border border-primary/10 shadow-xl">
                        <h3 className="font-bold uppercase italic tracking-wider text-text">Profile Strength</h3>
                        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="64"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="64"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 64}
                                    strokeDashoffset={2 * Math.PI * 64 * (1 - completion / 100)}
                                    className="text-primary transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="font-black italic text-3xl text-white">{completion}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed px-2">
                            {completion === 100
                                ? "Your profile is fully optimized! You're ready for lightning-fast registrations."
                                : "Complete your profile to unlock faster event registrations and ensure accurate kit sizing."}
                        </p>
                        {completion < 100 && (
                            <Button variant="outline" className="w-full py-6 text-lg" asChild>
                                <Link href="/dashboard/settings">Finish Profile</Link>
                            </Button>
                        )}
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-bold uppercase italic tracking-wider text-sm flex items-center gap-2 text-text">
                            <CheckCircle2 size={16} className="text-cta" /> Verified Status
                        </h3>
                        <div className="p-5 bg-cta/10 border border-cta/20 rounded-2xl space-y-2">
                            <p className="text-xs font-bold uppercase text-cta tracking-widest">Identity Verified</p>
                            <p className="text-[11px] text-text-muted leading-relaxed font-medium">Your account is securely linked with {user.email}.</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
