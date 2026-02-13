import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Zap, BarChart3, QrCode } from "lucide-react";
import Link from "next/link";

export default function ForOrganizersPage() {
    const features = [
        {
            icon: <Zap className="text-primary" size={24} />,
            title: "Easy Event Creation",
            description: "Build your event in minutes with our multi-step intuitive form. Add categories, timelines, and GPX routes effortlessly."
        },
        {
            icon: <BarChart3 className="text-cta" size={24} />,
            title: "Real-time Analytics",
            description: "Track registrations and revenue as they happen. Export data to CSV for your own reporting and logistics."
        },
        {
            icon: <QrCode className="text-blue-500" size={24} />,
            title: "Race Kit Tools",
            description: "Built-in QR scanner for organizers to quickly verify runners and mark race kits as claimed on race day."
        }
    ];

    return (
        <PageWrapper className="pb-24 space-y-24">
            {/* Hero */}
            <section className="pt-12 text-center space-y-6 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tight">
                    Host Your Next <br />
                    <span className="text-primary">Great Race</span> With Us.
                </h1>
                <p className="text-xl text-text-muted max-w-2xl mx-auto">
                    From local 5K fun runs to international full marathons, RaceDay provides the tools you need to manage your event from start to finish line.
                </p>
                <div className="pt-6">
                    <Button size="lg" className="text-lg uppercase italic tracking-wider h-16 px-10" asChild>
                        <Link href="/auth/login">Apply to Host Now</Link>
                    </Button>
                </div>
            </section>

            {/* Benefit Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, i) => (
                    <Card key={i} className="p-8 space-y-4 bg-surface/50 border border-white/5 hover:border-primary/20 transition-all cursor-default translate-y-0 hover:translate-y-0">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                            {feature.icon}
                        </div>
                        <h3 className="text-2xl font-bold italic uppercase tracking-tight">{feature.title}</h3>
                        <p className="text-text-muted leading-relaxed">
                            {feature.description}
                        </p>
                    </Card>
                ))}
            </section>

            {/* Feature Showcase */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none">
                        Everything You Need <br /> In One <span className="text-primary">Dashboard</span>
                    </h2>
                    <ul className="space-y-6">
                        {[
                            "Manage multiple distance categories and pricing",
                            "Interactive GPX route map integration",
                            "Vanity race number (premium bib) management",
                            "Automated participant data collection",
                            "Secure payment processing via Xendit",
                            "In-person QR code scanning for race kits"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-4 group">
                                <div className="mt-1 w-5 h-5 rounded-full bg-cta/10 flex items-center justify-center text-cta group-hover:bg-cta group-hover:text-white transition-colors">
                                    <CheckCircle2 size={14} />
                                </div>
                                <span className="text-lg text-text leading-tight">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative aspect-square md:aspect-video lg:aspect-square bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-cta/10 animate-pulse" />
                    <div className="absolute inset-12 bg-background border border-white/10 rounded-2xl shadow-inner flex flex-col p-6 items-center justify-center space-y-4">
                        {/* Mock UI elements */}
                        <div className="w-full flex justify-between gap-4">
                            <div className="h-20 flex-1 bg-white/5 rounded-xl animate-pulse" />
                            <div className="h-20 flex-1 bg-white/5 rounded-xl animate-pulse delay-75" />
                            <div className="h-20 flex-1 bg-white/5 rounded-xl animate-pulse delay-150" />
                        </div>
                        <div className="w-full h-full bg-white/5 rounded-xl animate-pulse delay-300" />
                    </div>
                    <div className="absolute bottom-8 right-8 bg-cta p-4 rounded-xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform cursor-default">
                        <QrCode size={40} className="text-white" />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="text-center bg-cta/10 border-2 border-cta/20 p-16 rounded-[2rem] space-y-6">
                <h2 className="text-4xl font-black italic uppercase">Ready to scale your event?</h2>
                <p className="text-text-muted max-w-xl mx-auto italic">
                    Join hundreds of successful organizers who trust RaceDay for their event management.
                </p>
                <Button size="lg" variant="primary" asChild>
                    <Link href="/auth/login" className="px-12">Get Started</Link>
                </Button>
            </section>
        </PageWrapper>
    );
}
