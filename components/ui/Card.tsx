import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = true, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-surface rounded-xl p-6 shadow-md transition-all duration-200",
                    hover && "cursor-pointer hover:shadow-lg hover:-translate-y-1",
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = "Card";

export { Card };
