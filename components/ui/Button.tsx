import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, asChild = false, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        const variants = {
            primary: "bg-cta text-white hover:opacity-90 shadow-md",
            secondary: "bg-primary text-white hover:opacity-90 shadow-md",
            outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary/10",
            ghost: "bg-transparent text-text hover:bg-white/5",
            danger: "bg-red-600 text-white hover:bg-red-700 shadow-md",
        };

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3",
            lg: "px-8 py-4 text-lg",
        };

        return (
            <Comp
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {asChild ? (
                    children
                ) : (
                    <>
                        {isLoading && (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        {children}
                    </>
                )}
            </Comp>
        );
    }
);

Button.displayName = "Button";

export { Button };
