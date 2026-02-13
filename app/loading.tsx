import { Loader2 } from "lucide-react";

export default function RootLoading() {
    return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4 z-50">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <div className="space-y-1 text-center">
                <p className="text-xl font-black italic uppercase tracking-tighter text-white">RaceDay</p>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse italic">Loading Experience</p>
            </div>
        </div>
    );
}
