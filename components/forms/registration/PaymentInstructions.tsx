"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";
import { Copy, Check, Upload, QrCode, Building2, Wallet, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentInstructionsProps {
    organizerId: string;
    registrationId?: string;
    totalPrice: number;
    showUpload?: boolean;
    onProofUploaded?: () => void;
}

const TYPE_ICONS: Record<string, typeof Building2> = {
    bank: Building2,
    ewallet: Wallet,
    other: HelpCircle,
};

const TYPE_COLORS: Record<string, string> = {
    bank: "text-cta bg-cta/10 border-cta/20",
    ewallet: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    other: "text-purple-500 bg-purple-500/10 border-purple-500/20",
};

export function PaymentInstructions({ organizerId, registrationId, totalPrice, showUpload = false, onProofUploaded }: PaymentInstructionsProps) {
    const methods = useQuery(api.users.getPaymentMethods, { userId: organizerId as Id<"users"> });
    const uploadProof = useMutation(api.registrations.uploadProofOfPayment);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUploadProof = async () => {
        if (!proofUrl) {
            toast.error("Please upload a screenshot of your payment.");
            return;
        }

        setUploading(true);
        try {
            await uploadProof({
                id: registrationId as Id<"registrations">,
                storageId: proofUrl,
                url: proofUrl,
            });
            toast.success("Proof of payment uploaded! The organizer will review it shortly.");
            onProofUploaded?.();
        } catch (error: any) {
            toast.error(error?.message || "Failed to upload proof of payment.");
        } finally {
            setUploading(false);
        }
    };

    if (!methods) return null;

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-white">Send your payment</h3>
                <p className="text-text-muted">
                    Transfer <span className="text-white font-bold">₱{totalPrice}</span> to any of the accounts below, then upload your proof of payment.
                </p>
            </div>

            {/* Payment methods grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {methods.map((method: any) => {
                    const Icon = TYPE_ICONS[method.type] || HelpCircle;
                    const color = TYPE_COLORS[method.type] || TYPE_COLORS.other;
                    return (
                        <Card key={method.id} className="p-4 bg-surface/30 border-white/8 flex gap-4 items-start">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white/3 border border-white/8">
                                {method.qrCodeStorageId ? (
                                    <img src={method.qrCodeStorageId} alt="QR" className="w-full h-full object-cover" />
                                ) : (
                                    <QrCode size={20} className="text-text-muted/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-white truncate">{method.label}</h4>
                                    <Badge className={cn("text-[10px] font-semibold uppercase border px-1.5 py-0", color)}>
                                        {method.type === "ewallet" ? "E-wallet" : method.type === "bank" ? "Bank" : "Other"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-text-muted">{method.accountName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-white font-mono">{method.accountNumber}</p>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(method.accountNumber, method.id)}
                                        className="p-1 text-text-muted hover:text-primary transition-colors"
                                    >
                                        {copiedId === method.id ? <Check size={12} className="text-cta" /> : <Copy size={12} />}
                                    </button>
                                </div>
                                {method.instructions && (
                                    <p className="text-xs text-text-muted mt-2 italic">{method.instructions}</p>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Upload proof — only shown when explicitly enabled */}
            {showUpload && registrationId && (
                <Card className="p-6 bg-surface/50 border-white/10 space-y-4">
                    <div className="flex items-center gap-2">
                        <Upload size={16} className="text-primary" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Upload proof of payment</h4>
                    </div>
                    <p className="text-xs text-text-muted">
                        Take a screenshot of your payment confirmation and upload it here. The organizer will review and confirm your registration.
                    </p>
                    <ImageUpload
                        value={proofUrl}
                        onChange={setProofUrl}
                        label="Upload screenshot"
                        aspectRatio="square"
                        className="max-w-[200px]"
                    />
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="primary"
                            onClick={handleUploadProof}
                            disabled={!proofUrl || uploading}
                            className="gap-2 bg-cta hover:bg-cta/90 border-none"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            Submit proof
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
