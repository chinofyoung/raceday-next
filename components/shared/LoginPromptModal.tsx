"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogIn, X, ShieldCheck } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/config";
import Image from "next/image";

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (userId: string) => void;
}

export function LoginPromptModal({ isOpen, onClose, onLoginSuccess }: LoginPromptModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { user } = await signInWithGoogle();
            const idToken = await auth.currentUser?.getIdToken();

            if (idToken) {
                await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });
            }

            onLoginSuccess(user.uid);
        } catch (err: any) {
            console.error("Login failed:", err);
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
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
                        isLoading={loading}
                    >
                        {!loading && <LogIn size={20} />}
                        Continue with Google
                    </Button>

                    {error && (
                        <p className="text-sm text-red-500 font-bold italic text-center animate-in fade-in">
                            {error}
                        </p>
                    )}
                </div>

                <p className="text-center text-[10px] text-text-muted font-bold italic uppercase tracking-widest">
                    Your registration data is safe and will be submitted after login
                </p>
            </Card>
        </div>
    );
}
