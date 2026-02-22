import Link from "next/link";
import { ArrowRight, Calendar, MapPin, TrendingUp, Users, Zap, Trophy, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { format } from "date-fns";
import Image from "next/image";
import { formatDistance } from "@/lib/utils";
import { isEventOver } from "@/lib/earlyBirdUtils";

async function getUpcomingEvents() {
    try {
        const q = query(
            collection(db, "events"),
            where("status", "==", "published"),
            orderBy("date", "asc")
        );
        const snap = await getDocs(q);
        const allEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RaceEvent[];
        const upcoming = allEvents.filter(e => !isEventOver(e));
        return upcoming.slice(0, 3);
    } catch (e) {
        console.error("Error fetching homepage events:", e);
        return [];
    }
}

export default async function HomePage() {
    const upcomingEvents = await getUpcomingEvents();

    return (
        <PageWrapper className="space-y-24 pb-20">
            {/* Hero Section */}
            <section className="relative pt-16 pb-8 lg:pt-28 lg:pb-16 overflow-visible">
                {/* Atmospheric glow — breaks out of wrapper to fill viewport edges */}
                <div className="absolute inset-0 -mx-[50vw] left-1/2 right-1/2 w-screen pointer-events-none overflow-hidden" aria-hidden="true">
                    <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
                    <div className="absolute -bottom-40 left-0 w-[400px] h-[400px] bg-cta/10 rounded-full blur-[130px]" />
                </div>

                <div className="relative z-10 space-y-14">
                    {/* Top Badge */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-cta" />
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-text-muted italic">
                                The Running Community Platform
                            </span>
                        </div>
                    </div>

                    {/* Main Headline — Left-aligned on desktop for asymmetry */}
                    <div className="space-y-6 text-center lg:text-left max-w-5xl">
                        <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-black italic uppercase leading-[0.88] tracking-tighter text-white">
                            Chase the{" "}
                            <span className="text-primary">High</span>,{" "}
                            <br className="hidden md:block" />
                            Define the{" "}
                            <span className="relative inline-block">
                                <span className="text-cta">Line</span>
                                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-cta/30 rounded-full" />
                            </span>.
                        </h1>

                        <p className="text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed font-medium italic lg:pr-8">
                            From fun runs to ultra marathons — discover events, register in seconds,
                            and join thousands of runners pushing their limits every weekend.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-2">
                            <Button size="lg" className="w-full sm:w-auto text-base uppercase italic tracking-wider font-black px-8 shadow-xl shadow-cta/20" asChild>
                                <Link href="/events" className="flex items-center gap-2">
                                    Browse Events
                                    <ArrowRight size={18} />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base uppercase italic tracking-wider font-black" asChild>
                                <Link href="/for-organizers">Host an Event</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Strip — Social proof for credibility */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-white/10 bg-surface/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-0">
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-2 text-primary">
                                <Calendar size={18} />
                                <span className="text-3xl md:text-4xl font-black italic tracking-tight text-white">50+</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">Events Listed</span>
                        </div>
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-2 text-cta">
                                <Users size={18} />
                                <span className="text-3xl md:text-4xl font-black italic tracking-tight text-white">10K+</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">Runners Joined</span>
                        </div>
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Trophy size={18} />
                                <span className="text-3xl md:text-4xl font-black italic tracking-tight text-white">200+</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">Race Categories</span>
                        </div>
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Timer size={18} />
                                <span className="text-3xl md:text-4xl font-black italic tracking-tight text-white">30s</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">Avg. Registration</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Events */}
            <section className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">Upcoming <span className="text-primary">Races</span></h2>
                        <p className="text-text-muted font-medium italic">Don&apos;t miss out on the biggest events of the season.</p>
                    </div>
                    <Button variant="ghost" className="hidden md:flex text-primary font-black italic uppercase tracking-widest gap-2" asChild>
                        <Link href="/events">View All Events <ArrowRight size={16} /></Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((event) => {
                        const eventDate = typeof (event.date as any).toDate === 'function' ? (event.date as any).toDate() : new Date(event.date as string | number | Date);
                        return (
                            <Link key={event.id} href={`/events/${event.id}`}>
                                <Card className="group overflow-hidden border border-white/5 hover:border-primary/50 p-0 transition-all hover:-translate-y-2 bg-surface/30">
                                    <div className="aspect-[16/9] bg-white/5 relative overflow-hidden">
                                        {event.featuredImage && (
                                            <Image src={event.featuredImage} alt={event.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10" />
                                        <div className="absolute top-4 right-4 z-20">
                                            <Badge variant="success" className="bg-cta text-white border-none shadow-lg">Open</Badge>
                                        </div>
                                        <div className="absolute bottom-4 left-4 z-20 space-y-1">
                                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest italic">
                                                <Calendar size={12} />
                                                <span>{format(eventDate, "MMM d, yyyy")}</span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase italic text-white group-hover:text-primary transition-colors tracking-tighter leading-tight">{event.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between text-[11px] text-text-muted font-black uppercase italic tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-cta" />
                                                <span>{event.location?.name || "Multiple Locations"}</span>
                                            </div>
                                            <div className="text-white">
                                                {event.categories?.length > 0
                                                    ? `₱${Math.min(...event.categories.map(c => c.price))}`
                                                    : "Price TBD"}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {event.categories?.slice(0, 3).map((cat, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-white/5 border-none text-[9px] font-bold">{formatDistance(cat.distance, cat.distanceUnit)}</Badge>
                                            )) || (
                                                    <Badge variant="outline" className="bg-white/5 border-none text-[9px] font-bold">Standard</Badge>
                                                )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    }) : (
                        [1, 2, 3].map((i) => (
                            <Card key={i} className="aspect-[16/9] bg-surface/30 animate-pulse border-white/5" />
                        ))
                    )}
                </div>
            </section>

            {/* How it Works / Stats */}
            <section className="bg-surface/30 rounded-[2rem] p-12 md:p-20 border border-white/5 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    <div className="space-y-4 text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
                            <Calendar size={32} />
                        </div>
                        <h4 className="text-2xl font-bold italic">Find Event</h4>
                        <p className="text-text-muted text-sm px-4">Browse through hundreds of running events near your location.</p>
                    </div>
                    <div className="space-y-4 text-center">
                        <div className="w-16 h-16 bg-cta/20 rounded-2xl flex items-center justify-center mx-auto text-cta">
                            <Users size={32} />
                        </div>
                        <h4 className="text-2xl font-bold italic">Quick Register</h4>
                        <p className="text-text-muted text-sm px-4">Auto-fill your details and secure your slot in seconds.</p>
                    </div>
                    <div className="space-y-4 text-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-500">
                            <TrendingUp size={32} />
                        </div>
                        <h4 className="text-2xl font-bold italic">Run & Track</h4>
                        <p className="text-text-muted text-sm px-4">Get your race bib QR code and join the finish line feeling proud.</p>
                    </div>
                </div>
            </section>

            {/* Organizer CTA */}
            <section className="relative rounded-[3rem] overflow-hidden border border-white/5 bg-surface/30 p-12 md:p-24 text-center space-y-10 group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-cta/10 rounded-full blur-[120px] opacity-30 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/30 rounded-full text-primary bg-primary/5 uppercase font-black italic tracking-widest text-[10px]">
                        Organizers Hub
                    </div>

                    <h2 className="text-4xl md:text-7xl font-black italic uppercase leading-[0.9] tracking-tighter text-white max-w-4xl mx-auto">
                        Empowering <span className="text-primary italic">Organizers</span>, <br />
                        Igniting <span className="text-cta">Communities</span>.
                    </h2>

                    <p className="text-text-muted max-w-2xl mx-auto text-lg md:text-xl font-medium italic leading-relaxed px-4">
                        Scale your race with the most robust registration and participant management platform
                        built specifically for professional race directors and local running clubs.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
                        <Button size="lg" className="w-full sm:w-auto text-lg uppercase italic tracking-wider font-black px-10 shadow-2xl shadow-primary/20 hover:scale-105 transition-transform" asChild>
                            <Link href="/for-organizers">Launch Your Event <ArrowRight className="ml-2" size={20} /></Link>
                        </Button>
                        <Link href="/about" className="text-text-muted hover:text-white font-black uppercase italic tracking-widest text-[10px] transition-colors border-b border-white/10 pb-1 hover:border-primary/50">
                            Explore platform features
                        </Link>
                    </div>
                </div>
            </section>
        </PageWrapper>
    );
}
