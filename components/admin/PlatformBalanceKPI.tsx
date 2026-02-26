"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Wallet, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function PlatformBalanceKPI() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!user) return;
            try {
                const response = await fetch("/api/admin/xendit/balance", {
                    headers: {
                        "x-user-id": user.uid,
                    },
                });
                const data = await response.json();
                if (data.balance !== undefined) {
                    setBalance(data.balance);
                }
            } catch (error) {
                console.error("Error fetching kpi balance:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [user]);

    return (
        <Card className="p-6 bg-surface border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Wallet size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Platform Balance</p>
                    {loading ? (
                        <div className="h-8 flex items-center">
                            <Loader2 className="animate-spin text-primary/30" size={16} />
                        </div>
                    ) : (
                        <p className="text-2xl font-black italic">₱{balance?.toLocaleString() || "0"}</p>
                    )}
                </div>
            </div>
        </Card>
    );
}
