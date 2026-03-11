import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "primary" | "secondary" | "success" | "warning" | "error" | "outline" | "destructive" | "cta";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        const variants = {
            primary: "bg-primary/20 text-primary border border-primary/20",
            secondary: "bg-secondary/20 text-secondary border border-secondary/20",
            success: "bg-green-500/20 text-green-500 border border-green-500/20", // Fixed success color
            warning: "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20",
            error: "bg-red-500/20 text-red-500 border border-red-500/20",
            destructive: "bg-red-500/20 text-red-500 border border-red-500/20",
            cta: "bg-cta/20 text-cta border border-cta/20",
            outline: "bg-transparent text-text border border-white/10",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

Badge.displayName = "Badge";

export { Badge };
