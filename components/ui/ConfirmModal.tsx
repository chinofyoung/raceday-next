"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ConfirmModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: "primary" | "danger";
    icon?: React.ReactNode;
    isLoading?: boolean;
}

export function ConfirmModal({
    open,
    onConfirm,
    onCancel,
    title = "Are you sure?",
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmVariant = "danger",
    icon,
    isLoading = false,
}: ConfirmModalProps) {
    // Close on Escape key
    React.useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onCancel]);

    // Prevent body scroll when open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-surface shadow-2xl overflow-hidden",
                    "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                )}
            >
                {/* Top accent line */}
                <div className={cn(
                    "h-[2px] w-full",
                    confirmVariant === "danger"
                        ? "bg-gradient-to-r from-transparent via-red-500 to-transparent"
                        : "bg-gradient-to-r from-transparent via-primary to-transparent"
                )} />

                <div className="p-8">
                    {icon && (
                        <div className="flex justify-center mb-5">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                confirmVariant === "danger" ? "bg-red-500/10" : "bg-primary/10"
                            )}>
                                {icon}
                            </div>
                        </div>
                    )}

                    <h2 className="text-xl font-black italic uppercase tracking-tight text-text text-center">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-2 text-sm text-text-muted text-center leading-relaxed">
                            {description}
                        </p>
                    )}

                    <div className="mt-6 mb-6 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            size="md"
                            className="flex-1 border border-white/[0.08]"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant={confirmVariant}
                            size="md"
                            className="flex-1"
                            onClick={onConfirm}
                            isLoading={isLoading}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
