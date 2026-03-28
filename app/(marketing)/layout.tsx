import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TopoBackground } from "@/components/layout/TopoBackground";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-white">
            <TopoBackground />
            <Navbar />
            <main className="flex-grow pt-24 relative z-10">
                {children}
            </main>
            <Footer />
        </div>
    );
}
