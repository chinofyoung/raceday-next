"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Save, Loader2, QrCode, Building2, Wallet, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethodType = "bank" | "ewallet" | "other";

interface PaymentMethod {
    id: string;
    type: PaymentMethodType;
    label: string;
    accountName: string;
    accountNumber: string;
    instructions?: string;
    qrCodeStorageId?: string;
}

const TYPE_OPTIONS: { value: PaymentMethodType; label: string; icon: typeof Building2; color: string }[] = [
    { value: "bank", label: "Bank", icon: Building2, color: "text-cta bg-cta/10 border-cta/20" },
    { value: "ewallet", label: "E-wallet", icon: Wallet, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { value: "other", label: "Other", icon: HelpCircle, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
];

function getTypeStyle(type: PaymentMethodType) {
    return TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[2];
}

export function PaymentMethodsManager() {
    const { user } = useAuth();
    const methods: PaymentMethod[] = (user?.paymentMethods as PaymentMethod[]) || [];
    const addMethod = useMutation(api.users.addPaymentMethod);
    const updateMethod = useMutation(api.users.updatePaymentMethod);
    const deleteMethod = useMutation(api.users.deletePaymentMethod);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formType, setFormType] = useState<PaymentMethodType>("bank");
    const [formLabel, setFormLabel] = useState("");
    const [formAccountName, setFormAccountName] = useState("");
    const [formAccountNumber, setFormAccountNumber] = useState("");
    const [formInstructions, setFormInstructions] = useState("");
    const [formQrCode, setFormQrCode] = useState("");

    const resetForm = () => {
        setFormType("bank");
        setFormLabel("");
        setFormAccountName("");
        setFormAccountNumber("");
        setFormInstructions("");
        setFormQrCode("");
        setEditingId(null);
        setShowForm(false);
    };

    const openEditForm = (method: PaymentMethod) => {
        setFormType(method.type);
        setFormLabel(method.label);
        setFormAccountName(method.accountName);
        setFormAccountNumber(method.accountNumber);
        setFormInstructions(method.instructions || "");
        setFormQrCode(method.qrCodeStorageId || "");
        setEditingId(method.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formLabel || !formAccountName || !formAccountNumber) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setSaving(true);
        try {
            const data = {
                type: formType,
                label: formLabel,
                accountName: formAccountName,
                accountNumber: formAccountNumber,
                instructions: formInstructions || undefined,
                qrCodeStorageId: formQrCode || undefined,
            };

            if (editingId) {
                await updateMethod({ methodId: editingId, ...data });
                toast.success("Payment method updated.");
            } else {
                await addMethod(data);
                toast.success("Payment method added.");
            }
            resetForm();
        } catch (error: any) {
            toast.error(error?.message || "Failed to save payment method.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (methodId: string) => {
        try {
            await deleteMethod({ methodId });
            toast.success("Payment method removed.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete payment method.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-white">Payment methods</h3>
                    <p className="text-sm text-text-muted">Runners will see these when you use manual payment mode.</p>
                </div>
                {!showForm && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowForm(true)}
                        className="gap-2"
                    >
                        <Plus size={14} /> Add
                    </Button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <Card className="p-6 bg-surface/50 border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {editingId ? "Edit payment method" : "Add payment method"}
                        </h4>
                        <button type="button" onClick={resetForm} className="text-text-muted hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Type selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Type</Label>
                        <div className="flex gap-2">
                            {TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormType(opt.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                                        formType === opt.value
                                            ? opt.color
                                            : "bg-white/4 border-white/8 text-text-muted hover:border-white/20"
                                    )}
                                >
                                    <opt.icon size={14} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Label *</Label>
                            <Input
                                value={formLabel}
                                onChange={(e) => setFormLabel(e.target.value)}
                                placeholder="e.g. GCash, BPI Savings"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Account name *</Label>
                            <Input
                                value={formAccountName}
                                onChange={(e) => setFormAccountName(e.target.value)}
                                placeholder="Account holder name"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Account number *</Label>
                            <Input
                                value={formAccountNumber}
                                onChange={(e) => setFormAccountNumber(e.target.value)}
                                placeholder="e.g. 0917 123 4567"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">QR code image</Label>
                            <ImageUpload
                                value={formQrCode}
                                onChange={setFormQrCode}
                                label="Upload QR"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Instructions for runners</Label>
                        <textarea
                            value={formInstructions}
                            onChange={(e) => setFormInstructions(e.target.value)}
                            placeholder="e.g. Use your full name as reference"
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={resetForm} size="sm">Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {editingId ? "Update" : "Add Method"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Grid */}
            {methods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {methods.map((method) => {
                        const style = getTypeStyle(method.type);
                        return (
                            <Card
                                key={method.id}
                                className="p-4 bg-surface/30 border-white/8 flex gap-4 items-start"
                            >
                                {/* QR thumbnail */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white/3 border border-white/8">
                                    {method.qrCodeStorageId ? (
                                        <img
                                            src={method.qrCodeStorageId}
                                            alt="QR"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <QrCode size={20} className="text-text-muted/30" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white truncate">{method.label}</h4>
                                            <Badge className={cn("text-[10px] font-semibold uppercase border px-1.5 py-0", style.color)}>
                                                {style.label}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(method)}
                                                className="p-1.5 text-text-muted hover:text-white transition-colors"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(method.id)}
                                                className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted truncate">{method.accountName}</p>
                                    <p className="text-xs text-white font-mono truncate">{method.accountNumber}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : !showForm ? (
                <Card className="p-8 bg-surface/20 border-dashed border-2 border-white/5 text-center space-y-3">
                    <Wallet size={32} className="mx-auto text-text-muted/20" />
                    <p className="text-sm text-text-muted">No payment methods yet.</p>
                    <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2">
                        <Plus size={14} /> Add your first method
                    </Button>
                </Card>
            ) : null}
        </div>
    );
}
