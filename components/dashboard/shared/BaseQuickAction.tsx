"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BaseQuickActionProps {
    href?: string;
    onClick?: () => void;
    icon: LucideIcon;
    label: string;
    variant?: "primary" | "secondary" | "cta" | "amber";
    className?: string; // Allow for extra custom classes if needed
}

export function BaseQuickAction({ href, onClick, icon: Icon, label, variant = "secondary", className: extraClassName }: BaseQuickActionProps) {
    const variants = {
        primary: {
            container: "bg-primary/10 border-primary/20 hover:bg-primary/20",
            icon: "text-primary"
        },
        secondary: {
            container: "bg-white/5 border-white/10 hover:bg-white/10",
            icon: "text-white opacity-60"
        },
        cta: {
            container: "bg-cta/10 border-cta/20 hover:bg-cta/20",
            icon: "text-cta"
        },
        amber: {
            container: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
            icon: "text-amber-500"
        }
    };

    const styles = variants[variant];

    const content = (
        <>
            <Icon size={16} className={cn("shrink-0", styles.icon)} />
            <span className="text-[10px] font-black uppercase tracking-widest italic text-white transition-all group-hover:scale-105 origin-left truncate">
                {label}
            </span>
        </>
    );

    const className = cn(
        "flex items-center gap-2 px-4 py-2 md:px-3 md:py-1.5 md:gap-1.5 border rounded-xl transition-all group shadow-sm active:scale-95 cursor-pointer",
        styles.container,
        extraClassName
    );

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    );
}
