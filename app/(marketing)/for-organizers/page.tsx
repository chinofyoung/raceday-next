import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Zap, BarChart3, QrCode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ForOrganizersPage() {
    const features = [
        {
            icon: <Zap className="text-primary" size={24} />,
            iconBg: "bg-primary/8 border border-primary/12",
            title: "Easy event creation",
            description: "Build your event in minutes with our multi-step intuitive form. Add categories, timelines, and GPX routes effortlessly."
        },
        {
            icon: <BarChart3 className="text-cta" size={24} />,
            iconBg: "bg-cta/8 border border-cta/12",
            title: "Real-time analytics",
            description: "Track registrations and revenue as they happen. Export data to CSV for your own reporting and logistics."
        },
        {
            icon: <QrCode className="text-blue-500" size={24} />,
            iconBg: "bg-blue-500/8 border border-blue-500/12",
            title: "Race kit tools",
            description: "Built-in QR scanner for organizers to quickly verify runners and mark race kits as claimed on race day."
        }
    ];

    return (
        <PageWrapper className="space-y-24">
            {/* Hero */}
            <section className="relative pt-16 lg:pt-24 pb-8 lg:pb-12 text-center space-y-6 max-w-7xl mx-auto">
                {/* Background hero image — full bleed */}
                <div className="absolute inset-0 -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden pointer-events-none" aria-hidden="true">
                    <Image
                        src="/assets/run.png"
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-background/80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Orientation badge */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-primary" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                For Event Organizers
                            </span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
                        <span className="text-primary">Run your event.</span>
                        <br />
                        Not your spreadsheets.
                    </h1>

                    <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-normal">
                        From local 5K fun runs to international full marathons, RaceDay provides the tools you need to manage your event from start to finish line.
                    </p>

                    <div className="pt-6 flex flex-col items-center gap-3">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8" asChild>
                            <Link href="/dashboard/become-organizer">Start hosting</Link>
                        </Button>
                        <a href="#features" className="text-sm text-text-muted hover:text-white transition-colors">
                            See what&apos;s included
                        </a>
                    </div>

                    {/* Social proof stats */}
                    <div className="flex flex-wrap justify-center gap-8 pt-4 text-center">
                        {[
                            { value: "50+", label: "Events Managed" },
                            { value: "10K+", label: "Registrations Processed" },
                            { value: "Free", label: "To Get Started" },
                        ].map(stat => (
                            <div key={stat.label} className="space-y-1">
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefit Grid */}
            <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, i) => (
                    <Card key={i} className="p-8 space-y-5 bg-surface/40 border border-white/[0.06] rounded-xl hover:-translate-y-1 hover:border-white/[0.12] transition-all cursor-default group">
                        <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-text-muted leading-relaxed">
                            {feature.description}
                        </p>
                    </Card>
                ))}
            </section>

            {/* Feature Showcase */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Everything you need in one <span className="text-primary">dashboard</span>
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
                                <div className="mt-1 w-5 h-5 rounded-full bg-cta/10 flex items-center justify-center text-cta transition-colors flex-shrink-0">
                                    <CheckCircle2 size={14} />
                                </div>
                                <span className="text-base text-text leading-tight">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative aspect-square md:aspect-video lg:aspect-square bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-cta/10 animate-pulse" />
                    <div className="absolute inset-4 bg-background border border-white/10 rounded-2xl shadow-inner flex flex-col overflow-hidden">
                        {/* Mock Dashboard Topbar */}
                        <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center px-4 justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary" />
                                <div className="h-3 w-20 bg-white/20 rounded-sm" />
                            </div>
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/10" />
                                <div className="w-6 h-6 rounded-full bg-white/10" />
                            </div>
                        </div>
                        {/* Mock Dashboard Content */}
                        <div className="p-4 flex-1 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1.5">
                                    <div className="h-4 w-32 bg-white/20 rounded-sm" />
                                    <div className="h-2 w-24 bg-white/10 rounded-sm" />
                                </div>
                                <div className="h-6 w-16 bg-cta/80 rounded-sm flex items-center justify-center">
                                    <div className="h-1.5 w-8 bg-white/50 rounded-sm" />
                                </div>
                            </div>
                            {/* Mock Stat Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-surface border border-white/5 rounded-lg flex flex-col justify-center px-3 space-y-2">
                                        <div className="h-2 w-12 bg-white/10 rounded-sm" />
                                        <div className="h-4 w-8 bg-white/40 rounded-sm" />
                                    </div>
                                ))}
                            </div>
                            {/* Mock Table/List */}
                            <div className="flex-1 bg-surface border border-white/5 rounded-lg p-3 flex flex-col gap-3">
                                <div className="h-3 w-24 bg-white/10 rounded-sm mb-2" />
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-white/10" />
                                            <div className="space-y-1.5">
                                                <div className="h-2 w-16 bg-white/20 rounded-sm" />
                                                <div className="h-1.5 w-10 bg-white/10 rounded-sm" />
                                            </div>
                                        </div>
                                        <div className="h-2 w-8 bg-cta/40 rounded-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="text-center bg-primary/[0.06] border border-primary/[0.12] rounded-2xl p-12 md:p-16 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to scale your event?</h2>
                <p className="text-text-muted max-w-xl mx-auto font-normal">
                    Join hundreds of successful organizers who trust RaceDay for their event management.
                </p>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8" asChild>
                    <Link href="/dashboard/become-organizer">Get started</Link>
                </Button>
            </section>
        </PageWrapper>
    );
}
