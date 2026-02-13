"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { isNewUser } = await signInWithGoogle();
            if (isNewUser) {
                router.push("/dashboard/profile?setup=true");
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper className="flex items-center justify-center min-h-[70vh]">
            <Card className="max-w-md w-full p-10 space-y-8 bg-surface/50 border border-white/5 shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/logo.png"
                            alt="RaceDay"
                            width={240}
                            height={60}
                            className="h-12 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tight text-text">Welcome Back</h1>
                    <p className="text-text-muted">Sign in to manage your races and registrations.</p>
                </div>

                <div className="pt-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-14 text-lg font-bold uppercase italic tracking-wider gap-3"
                        onClick={handleLogin}
                        isLoading={loading}
                    >
                        {!loading && <LogIn size={20} />}
                        Continue with Google
                    </Button>
                </div>

                <p className="text-center text-xs text-text-muted pt-4 leading-relaxed">
                    By continuing, you agree to our <span className="text-primary hover:underline cursor-pointer">Terms of Service</span> and <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
            </Card>
        </PageWrapper>
    );
}
