"use client";

import { useFormContext } from "react-hook-form";
import { EventFormInput } from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import { CreditCard, Upload, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function Step2PaymentMode() {
    const { watch, setValue } = useFormContext<EventFormInput>();
    const { user } = useAuth();
    const paymentMode = watch("paymentMode") || "portal";
    const hasPaymentMethods = (user?.paymentMethods?.length || 0) > 0;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    How will runners <span className="text-primary">pay</span>?
                </h2>
                <p className="text-text-muted font-medium">
                    Choose how you'd like to collect registration fees. This applies to all categories in this event.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Portal Card */}
                <button
                    type="button"
                    onClick={() => setValue("paymentMode", "portal", { shouldDirty: true })}
                    className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all cursor-pointer group",
                        paymentMode === "portal"
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-white/10 bg-white/2 hover:border-primary/30"
                    )}
                >
                    {paymentMode === "portal" && (
                        <span className="inline-flex items-center px-2 py-0.5 mb-4 text-[10px] font-semibold uppercase tracking-wider bg-primary text-white rounded-full">
                            Selected
                        </span>
                    )}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border",
                        paymentMode === "portal"
                            ? "bg-primary/12 border-primary/20 text-primary"
                            : "bg-white/4 border-white/8 text-text-muted group-hover:text-primary group-hover:border-primary/20"
                    )}>
                        <CreditCard size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Payment portal</h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-3">
                        Runners pay through a secure online checkout powered by Xendit. Payments are processed automatically and registrations are confirmed instantly.
                    </p>
                    <p className="text-xs text-amber-400/80 font-medium mb-4">
                        A 3.5% platform fee will be applied to each registration fee.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["GCash", "Cards", "Bank transfer", "Maya"].map((m) => (
                            <span key={m} className="text-xs text-text-muted bg-white/4 border border-white/8 px-3 py-1 rounded-full">
                                {m}
                            </span>
                        ))}
                    </div>
                </button>

                {/* Manual Payment Card */}
                <button
                    type="button"
                    onClick={() => setValue("paymentMode", "manual", { shouldDirty: true })}
                    className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all cursor-pointer group",
                        paymentMode === "manual"
                            ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                            : "border-white/10 bg-white/2 hover:border-blue-500/30"
                    )}
                >
                    {paymentMode === "manual" && (
                        <span className="inline-flex items-center px-2 py-0.5 mb-4 text-[10px] font-semibold uppercase tracking-wider bg-blue-500 text-white rounded-full">
                            Selected
                        </span>
                    )}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border",
                        paymentMode === "manual"
                            ? "bg-blue-500/12 border-blue-500/20 text-blue-500"
                            : "bg-white/4 border-white/8 text-text-muted group-hover:text-blue-500 group-hover:border-blue-500/20"
                    )}>
                        <Upload size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Manual payment</h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                        Runners pay you directly via bank transfer or e-wallet, then upload proof of payment. You review and confirm each registration manually.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Bank transfer", "E-wallet", "QR code"].map((m) => (
                            <span key={m} className="text-xs text-text-muted bg-white/4 border border-white/8 px-3 py-1 rounded-full">
                                {m}
                            </span>
                        ))}
                    </div>
                </button>
            </div>

            {/* Warning: no payment methods */}
            {paymentMode === "manual" && !hasPaymentMethods && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-500">No payment methods set up</p>
                        <p className="text-xs text-text-muted mt-1">
                            You need at least one payment method on your{" "}
                            <a href="/dashboard/organizer/settings" target="_blank" className="text-primary underline">
                                organizer profile
                            </a>{" "}
                            so runners know where to send payment.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
