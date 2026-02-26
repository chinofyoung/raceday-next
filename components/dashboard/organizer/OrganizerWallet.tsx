"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Wallet,
    ArrowUpRight,
    History,
    ArrowDownLeft,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Banknote,
    ArrowRight
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn, formatDate } from "@/lib/utils";
import { OrganizerBalanceCard } from "./OrganizerBalanceCard";

export function OrganizerWallet() {
    const { user } = useAuth();
    const [payouts, setPayouts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestingPayout, setRequestingPayout] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");

    useEffect(() => {
        // In a real implementation, you'd fetch payoutRequests and organizerTransactions from Firestore here
        // For now, we'll keep it simple
        setLoading(false);
    }, [user]);

    const handlePayoutRequest = async () => {
        if (!user || !payoutAmount) return;
        setRequestingPayout(true);
        try {
            const response = await fetch("/api/xendit/request-payout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user.uid
                },
                body: JSON.stringify({ amount: parseFloat(payoutAmount) })
            });

            if (response.ok) {
                alert("Payout request submitted successfully!");
                setPayoutAmount("");
                // Refresh data...
            } else {
                const err = await response.json();
                alert(err.error || "Failed to request payout");
            }
        } catch (error) {
            console.error("Payout error:", error);
            alert("An error occurred");
        } finally {
            setRequestingPayout(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance & Action */}
                <div className="lg:col-span-1 space-y-6">
                    <OrganizerBalanceCard />

                    <Card className="p-6 bg-surface border-white/5 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black italic uppercase text-white">Request Payout</h3>
                            <p className="text-xs text-text-muted font-medium italic">Withdraw your available funds to your linked bank account.</p>
                        </div>

                        {!user?.organizer?.kycVerified && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-xs italic text-amber-500">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-bold uppercase tracking-tight">KYC Verification Pending</p>
                                    <p className="opacity-80">Withdrawals are disabled until Xendit verifies your business documents. This usually takes 1-3 business days.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black italic text-white/30 group-focus-within:text-primary transition-colors">₱</span>
                                <input
                                    type="number"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder="0.00"
                                    disabled={!user?.organizer?.kycVerified}
                                    className="w-full h-14 bg-black/40 border-2 border-white/5 rounded-2xl pl-10 pr-6 text-xl font-black italic text-white focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-12 uppercase italic font-black shadow-lg shadow-primary/20"
                                onClick={handlePayoutRequest}
                                isLoading={requestingPayout}
                                disabled={!user?.organizer?.kycVerified || !payoutAmount || parseFloat(payoutAmount) <= 0}
                            >
                                Withdraw Funds <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-widest">
                                <span className="text-text-muted">Linked Account</span>
                                <span className="text-white">{user?.organizer?.bankDetails?.bankCode || "Not Set"}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-widest">
                                <span className="text-text-muted">Account No.</span>
                                <span className="text-white">****{user?.organizer?.bankDetails?.accountNumber?.slice(-4) || "0000"}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-widest">
                                <span className="text-text-muted">KYC Status</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full border",
                                    user?.organizer?.kycVerified ? "text-success border-success/20 bg-success/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                )}>
                                    {user?.organizer?.kycVerified ? "Verified" : "Pending"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <History size={20} />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">Recent Activity</h3>
                        </div>
                    </div>

                    <Card className="bg-surface border-white/5 overflow-hidden">
                        <div className="divide-y divide-white/5">
                            {loading ? (
                                <div className="p-20 flex justify-center">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-20">
                                        <Banknote size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold uppercase italic text-white/50 tracking-widest">No transactions yet</p>
                                        <p className="text-[10px] text-text-muted italic opacity-50">Earnings from your event registrations will appear here.</p>
                                    </div>
                                </div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
                                                tx.type === 'registration_income' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                                            )}>
                                                {tx.type === 'registration_income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase italic text-white tracking-tight">
                                                    {tx.type === 'registration_income' ? "Registration Fee" : "Payout Withdrawal"}
                                                </p>
                                                <p className="text-[10px] text-text-muted font-bold uppercase italic opacity-60">
                                                    {formatDate(tx.createdAt)} • {tx.metadata?.runnerName || "System"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-lg font-black italic tracking-tight",
                                                tx.type === 'registration_income' ? 'text-success' : 'text-white'
                                            )}>
                                                {tx.type === 'registration_income' ? '+' : '-'} ₱{tx.amount.toLocaleString()}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                {tx.status === 'completed' ? (
                                                    <CheckCircle2 size={10} className="text-success" />
                                                ) : tx.status === 'failed' ? (
                                                    <AlertCircle size={10} className="text-destructive" />
                                                ) : (
                                                    <Clock size={10} className="text-cta" />
                                                )}
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase italic tracking-widest opacity-60",
                                                    tx.status === 'completed' ? 'text-success' : tx.status === 'failed' ? 'text-destructive' : 'text-cta'
                                                )}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
