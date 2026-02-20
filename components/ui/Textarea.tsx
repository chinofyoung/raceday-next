import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    description?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, description, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 px-4 py-3.5 min-h-[120px] resize-none",
                        error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5",
                        className
                    )}
                    {...props}
                />
                {description && !error && (
                    <p className="text-[10px] text-text-muted ml-1 italic opacity-50">{description}</p>
                )}
                {error && (
                    <p className="text-[10px] text-red-500 ml-1 font-bold uppercase italic tracking-wide">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

export { Textarea };
