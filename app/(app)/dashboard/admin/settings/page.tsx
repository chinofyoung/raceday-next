"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Loader2, Save, Shield, Percent, Wallet, ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from "@/lib/services/settingsService";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PlatformSettings>({
        processingFeePercent: 5,
        minimumPayoutAmount: 500,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getPlatformSettings();
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load platform settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            await updatePlatformSettings(settings, user.uid);
            toast.success("Platform settings updated successfully");
            fetchSettings(); // Refresh to get the updated timestamp
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Failed to update platform settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-24 space-y-10 text-white">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/admin" className="text-text-muted text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors italic">
                    <ArrowLeft size={14} /> Back to Command Center
                </Link>
                <div className="space-y-1">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        Platform <span className="text-primary">Settings</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Global configuration for the RaceDay platform.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-8 bg-surface border-white/5 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black italic uppercase tracking-tight">Financial Configuration</h3>
                                <p className="text-[10px] text-text-muted font-bold uppercase italic tracking-widest text-wrap">Fees and payout thresholds</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-2">
                                    <Percent size={12} className="text-primary" /> Processing Fee Percentage
                                </Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.1"
                                        value={settings.processingFeePercent}
                                        onChange={(e) => setSettings({ ...settings, processingFeePercent: parseFloat(e.target.value) })}
                                        className="bg-white/5 border-white/10 h-14 text-xl font-black italic focus:border-primary transition-all pr-12"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black italic text-text-muted">%</div>
                                </div>
                                <p className="text-[10px] text-text-muted italic font-medium leading-relaxed">
                                    Added on top of the registration price. This goes to the platform revenue. Default is 5%.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted italic flex items-center gap-2">
                                    <Wallet size={12} className="text-green-500" /> Min Payout Amount (PHP)
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black italic text-text-muted">₱</div>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={settings.minimumPayoutAmount}
                                        onChange={(e) => setSettings({ ...settings, minimumPayoutAmount: parseFloat(e.target.value) })}
                                        className="bg-white/5 border-white/10 h-14 text-xl font-black italic focus:border-primary transition-all pl-12"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-text-muted italic font-medium leading-relaxed">
                                    Minimum balance required for organizers to request a payout.
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex justify-end">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 px-10 h-14 font-black italic uppercase tracking-widest text-base shadow-xl shadow-primary/20"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} /> Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2" size={20} /> Save Configuration
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Audit & Info */}
                <div className="space-y-8">
                    <Card className="p-6 bg-surface border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <History className="text-text-muted" size={18} />
                                <h4 className="font-bold uppercase italic text-sm tracking-tight text-white">Last Update</h4>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-muted italic tracking-widest">Modified At</p>
                                    <p className="text-sm font-bold italic text-white flex items-center gap-2 mt-1">
                                        {settings.updatedAt ? format(settings.updatedAt.toDate(), "MMM dd, yyyy · HH:mm") : "Initial Setup"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-muted italic tracking-widest">Updated By</p>
                                    <p className="text-sm font-bold italic text-white mt-1 truncate">
                                        {settings.updatedBy || "System Admin"}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                <p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Impact Note</p>
                                <p className="text-[10px] text-text-muted italic font-medium leading-relaxed uppercase">
                                    Changes to the processing fee will apply immediately to all new registration checkouts. Existing pending checkouts will retain the fee they were created with.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </form>
        </PageWrapper>
    );
}
