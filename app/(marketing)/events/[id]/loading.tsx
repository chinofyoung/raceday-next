import { PageWrapper } from "@/components/layout/PageWrapper";
import { Loader2 } from "lucide-react";

export default function EventLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-text-muted font-black uppercase italic tracking-widest animate-pulse">Warming Up...</p>
            </div>
        </div>
    );
}
