"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Wallet, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function PlatformBalanceCard() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBalance = async () => {
        if (!user) return;
        setRefreshing(true);
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
            console.error("Error fetching admin balance:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [user]);

    return (
        <Card className="p-8 bg-surface border-white/5 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                            <Wallet className="text-primary" size={20} /> Platform Balance
                        </h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest">Live Xendit Cash account</p>
                    </div>
                    <button
                        onClick={fetchBalance}
                        disabled={refreshing}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="space-y-1">
                    {loading ? (
                        <div className="h-10 flex items-center">
                            <Loader2 className="animate-spin text-primary/50" size={24} />
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-primary text-xl font-black italic">₱</span>
                            <span className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-md">
                                {balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-green-400">
                        <TrendingUp size={14} />
                        <span className="text-[10px] font-black uppercase italic tracking-widest">Available for payout</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
