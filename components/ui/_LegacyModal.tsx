"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({
    open,
    onClose,
    title,
    children,
    className,
}: ModalProps) {
    // Close on Escape key
    React.useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

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
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-surface shadow-2xl overflow-hidden",
                    "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200",
                    className
                )}
            >
                {/* Top accent line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black italic uppercase tracking-tight text-text">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-text-muted hover:text-text transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="mt-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
