"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Wallet, Loader2, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function OrganizerBalanceCard() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!user) return;
            try {
                const response = await fetch("/api/xendit/balance", {
                    headers: { "x-user-id": user.uid }
                });
                if (response.ok) {
                    const data = await response.json();
                    setBalance(data.balance);
                }
            } catch (error) {
                console.error("Error fetching balance:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [user]);

    return (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-cta/10 border-primary/20 relative overflow-hidden group hover:from-primary/20 hover:to-cta/20 transition-all duration-500">
            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary backdrop-blur-md border border-white/10">
                        <Wallet size={20} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-primary italic tracking-widest animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Live Balance
                    </div>
                </div>

                <div>
                    {loading ? (
                        <Loader2 className="animate-spin text-white/20" size={32} />
                    ) : (
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white italic opacity-50">₱</span>
                            <h2 className="text-4xl font-black italic tracking-tighter text-white">
                                {balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                            </h2>
                        </div>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic mt-2 opacity-70">
                        Available for Withdrawal
                    </p>
                </div>

                <div className="pt-2">
                    <button className="flex items-center gap-1.5 text-[10px] font-black uppercase italic text-white hover:text-primary transition-colors group/btn">
                        Manage Wallet <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </Card>
    );
}
