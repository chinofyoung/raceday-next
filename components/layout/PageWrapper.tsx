import { cn } from "@/lib/utils";

interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    container?: boolean;
}

export function PageWrapper({
    children,
    className,
    container = true,
    ...props
}: PageWrapperProps) {
    return (
        <div
            className={cn(
                "animate-in fade-in duration-700",
                container && "max-w-7xl mx-auto px-4 sm:px-0",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
