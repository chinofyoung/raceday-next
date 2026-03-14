"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, X, ShieldCheck } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (userId: string) => void;
    pendingData?: Record<string, any> | null;
}

export function LoginPromptModal({ isOpen, onClose, onLoginSuccess, pendingData }: LoginPromptModalProps) {
    const { openSignIn } = useClerk();
    const pathname = usePathname();

    if (!isOpen) return null;

    const handleLogin = () => {
        // Persist pending registration data so it survives the OAuth redirect.
        if (pendingData) {
            try {
                sessionStorage.setItem(
                    "raceday_pending_registration",
                    JSON.stringify({
                        data: pendingData,
                        eventId: pendingData.eventId,
                        timestamp: Date.now(),
                    })
                );
            } catch {
                // sessionStorage may be unavailable (private browsing, quota exceeded, etc.)
            }
        }

        // Do NOT call onClose() here — the OAuth redirect will navigate away from
        // the page and calling onClose() would clear the parent's pending state
        // before the redirect completes, losing the registration data.
        openSignIn({
            afterSignInUrl: pathname,
            afterSignUpUrl: pathname,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <Card className="relative z-10 max-w-md w-full mx-4 p-10 space-y-8 bg-surface border-white/10 shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-500">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                    <X size={20} />
                </button>

                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShieldCheck size={32} className="text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Almost <span className="text-primary">There!</span>
                    </h2>
                    <p className="text-sm text-text-muted font-medium leading-relaxed">
                        Sign in to complete your registration and secure your slot. Your registration details have been saved.
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-14 text-lg font-bold tracking-wider gap-3 bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20"
                        onClick={handleLogin}
                    >
                        <LogIn size={20} />
                        Continue to Sign In
                    </Button>
                </div>

                <p className="text-center text-xs text-text-muted font-semibold uppercase tracking-wider">
                    Your registration data is safe and will be submitted after login
                </p>
            </Card>
        </div>
    );
}
