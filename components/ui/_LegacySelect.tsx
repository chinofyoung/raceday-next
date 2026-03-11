import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    description?: string;
    options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, description, options, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 italic opacity-70">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <select
                        ref={ref}
                        className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 px-4 py-3.5 appearance-none cursor-pointer",
                            error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5",
                            className
                        )}
                        {...props}
                    >
                        <option value="" disabled className="bg-surface text-text-muted">Select an option</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-surface text-white">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                        <ChevronDown size={18} />
                    </div>
                </div>
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

Select.displayName = "Select";

export { Select };
