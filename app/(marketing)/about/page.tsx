import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Github, Twitter, MapPin } from "lucide-react";

export default function AboutPage() {
    return (
        <PageWrapper className="pb-24 space-y-24">
            {/* Hero */}
            <section className="pt-12 text-center space-y-6 max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                    We live for <span className="text-primary">the chase.</span>
                </h1>
                <p className="text-xl text-text-muted leading-relaxed">
                    RaceDay was born out of a frustration with clunky race registration systems. We&apos;re on a mission to build the world&apos;s most energetic and efficient platform for runners.
                </p>
            </section>

            {/* Values */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
                    <p className="text-text-muted text-lg leading-relaxed">
                        To empower organizers and runners through cutting-edge technology, ensuring every race day is focused on the movement, not the paperwork.
                    </p>
                    <div className="p-8 bg-primary/10 border border-primary/20 rounded-2xl space-y-4">
                        <h4 className="text-lg font-bold text-primary">The Vision</h4>
                        <p className="text-text-muted leading-relaxed">
                            A world where finding a race and crossing the finish line is as seamless as the run itself.
                        </p>
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight">The Core Team</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { name: "Alex Rivera", role: "Product Lead", color: "from-blue-500 to-cyan-400" },
                            { name: "Sane Chen", role: "Engineering", color: "from-primary to-amber-500" },
                            { name: "Jordan Lim", role: "Designer", color: "from-purple-500 to-pink-500" },
                            { name: "Maya Cruz", role: "Community", color: "from-cta to-emerald-400" }
                        ].map((member, i) => (
                            <Card key={i} className="p-6 bg-surface/50 border border-white/5 space-y-2 cursor-default hover:translate-y-0 group">
                                <div className={`w-14 h-14 rounded-full mb-4 flex items-center justify-center bg-gradient-to-br ${member.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                    <span className="text-white font-bold tracking-wider text-lg">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <h4 className="font-bold text-lg">{member.name}</h4>
                                <p className="text-xs text-primary font-semibold uppercase tracking-wider">{member.role}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" className="space-y-12 bg-surface/30 p-12 md:p-20 rounded-2xl border border-white/5">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get in <span className="text-cta">touch</span></h2>
                    <p className="text-text-muted font-normal max-w-xl mx-auto">
                        Questions? Feedback? Just want to say hello? Our team is always ready to talk shop.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    <a href="mailto:hello@raceday.io" className="group">
                        <Card className="p-8 text-center space-y-4 hover:border-cta/50 hover:bg-cta/5 transition-all">
                            <Mail className="mx-auto text-cta group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="font-bold">Email us</h4>
                            <p className="text-xs text-text-muted">hello@raceday.io</p>
                        </Card>
                    </a>
                    <a href="#" className="group">
                        <Card className="p-8 text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all">
                            <Twitter className="mx-auto text-primary group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="font-bold">Follow us</h4>
                            <p className="text-xs text-text-muted">@raceday_io</p>
                        </Card>
                    </a>
                    <div className="group">
                        <Card className="p-8 text-center space-y-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-default">
                            <MapPin className="mx-auto text-blue-500 group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="font-bold">Location</h4>
                            <p className="text-xs text-text-muted">BGC, Taguig, PH</p>
                        </Card>
                    </div>
                </div>
            </section>
        </PageWrapper>
    );
}
