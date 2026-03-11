import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    description?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, description, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300",
                            icon ? "pl-12 pr-4 py-3.5" : "px-4 py-3.5",
                            error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5",
                            className
                        )}
                        aria-describedby={error && props.name ? `${props.name}-error` : undefined}
                        aria-invalid={!!error}
                        {...props}
                    />
                </div>
                {description && !error && (
                    <p className="text-[10px] text-text-muted ml-1 italic opacity-50">{description}</p>
                )}
                {error && (
                    <p id={props.name ? `${props.name}-error` : undefined} className="text-[10px] text-red-500 ml-1 font-bold uppercase italic tracking-wide">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
