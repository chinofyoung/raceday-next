import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mail, Github, Twitter, MapPin } from "lucide-react";

export default function AboutPage() {
    return (
        <PageWrapper className="pb-24 space-y-24">
            {/* Hero */}
            <section className="pt-12 text-center space-y-6 max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tight">
                    We Live For <br /> <span className="text-primary underline decoration-cta decoration-4 underline-offset-8">The Chase</span>.
                </h1>
                <p className="text-xl text-text-muted leading-relaxed">
                    RaceDay was born out of a frustration with clunky race registration systems. We&apos;re on a mission to build the world&apos;s most energetic and efficient platform for runners.
                </p>
            </section>

            {/* Values */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h2 className="text-4xl font-black italic uppercase tracking-tight">Our Mission</h2>
                    <p className="text-text-muted text-lg leading-relaxed">
                        To empower organizers and runners through cutting-edge technology, ensuring every race day is focused on the movement, not the paperwork.
                    </p>
                    <div className="p-8 bg-primary/10 border border-primary/20 rounded-[2rem] space-y-4">
                        <h4 className="text-xl font-bold uppercase italic text-primary tracking-wide">The Vision</h4>
                        <p className="text-text-muted leading-relaxed">
                            A world where finding a race and crossing the finish line is as seamless as the run itself.
                        </p>
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="text-4xl font-black italic uppercase tracking-tight">The Core Team</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { name: "Alex Rivera", role: "Product Lead" },
                            { name: "Sane Chen", role: "Engineering" },
                            { name: "Jordan Lim", role: "Designer" },
                            { name: "Maya Cruz", role: "Community" }
                        ].map((member, i) => (
                            <Card key={i} className="p-6 bg-surface/50 border border-white/5 space-y-2 cursor-default hover:translate-y-0">
                                <div className="w-12 h-12 bg-white/10 rounded-full mb-4" />
                                <h4 className="font-bold text-lg">{member.name}</h4>
                                <p className="text-xs text-primary font-bold uppercase tracking-wider">{member.role}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" className="space-y-12 bg-surface/30 p-12 md:p-20 rounded-[2rem] border border-white/5">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase">Get In <span className="text-cta">Touch</span></h2>
                    <p className="text-text-muted max-w-xl mx-auto">
                        Questions? Feedback? Just want to say hello? Our team is always ready to talk shop.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <a href="mailto:hello@raceday.io" className="group">
                        <Card className="p-8 text-center space-y-4 hover:border-cta/50 hover:bg-cta/5 transition-all">
                            <Mail className="mx-auto text-cta group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="font-bold uppercase italic font-heading">Email Us</h4>
                            <p className="text-xs text-text-muted">hello@raceday.io</p>
                        </Card>
                    </a>
                    <a href="#" className="group">
                        <Card className="p-8 text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all">
                            <Twitter className="mx-auto text-primary group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="font-bold uppercase italic font-heading">Follow Us</h4>
                            <p className="text-xs text-text-muted">@raceday_io</p>
                        </Card>
                    </a>
                    <div className="group">
                        <Card className="p-8 text-center space-y-4 cursor-default">
                            <MapPin className="mx-auto text-blue-500" size={24} />
                            <h4 className="font-bold uppercase italic font-heading">Location</h4>
                            <p className="text-xs text-text-muted">BGC, Taguig, PH</p>
                        </Card>
                    </div>
                </div>
            </section>
        </PageWrapper>
    );
}
