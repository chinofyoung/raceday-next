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
}

export function LoginPromptModal({ isOpen, onClose, onLoginSuccess }: LoginPromptModalProps) {
    const { openSignIn } = useClerk();
    const pathname = usePathname();

    if (!isOpen) return null;

    const handleLogin = () => {
        // Since we are migrating to Clerk, we'll use their managed sign-in modal
        // or redirect. openSignIn() is the easiest way to show the modal.
        // After success, it will redirect back to the current page.
        openSignIn({
            afterSignInUrl: pathname,
            afterSignUpUrl: pathname,
        });
        onClose();
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
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
                        Almost <span className="text-primary">There!</span>
                    </h2>
                    <p className="text-sm text-text-muted font-medium italic leading-relaxed">
                        Sign in to complete your registration and secure your slot. Your registration details have been saved.
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-14 text-lg font-bold uppercase italic tracking-wider gap-3 bg-cta hover:bg-cta-hover border-none shadow-xl shadow-cta/20"
                        onClick={handleLogin}
                    >
                        <LogIn size={20} />
                        Continue to Sign In
                    </Button>
                </div>

                <p className="text-center text-[10px] text-text-muted font-bold italic uppercase tracking-widest">
                    Your registration data is safe and will be submitted after login
                </p>
            </Card>
        </div>
    );
}
