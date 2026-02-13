import Link from "next/link";
import { ArrowRight, Calendar, MapPin, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { RaceEvent } from "@/types/event";
import { format } from "date-fns";
import Image from "next/image";

async function getUpcomingEvents() {
    try {
        const q = query(
            collection(db, "events"),
            where("status", "==", "published"),
            orderBy("date", "asc"),
            limit(3)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RaceEvent[];
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
            <section className="relative pt-12 text-center space-y-8 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-sm uppercase tracking-wider animate-bounce">
                    <TrendingUp size={16} />
                    <span>New events added daily</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase leading-none tracking-tight">
                    Chase the <span className="text-primary italic">High</span>, <br />
                    Define the <span className="text-cta">Line</span>.
                </h1>

                <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-medium italic">
                    The ultimate platform for running enthusiasts. Discover upcoming marathons,
                    manage your race kits, and join a community that never stops moving.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button size="lg" className="w-full sm:w-auto text-lg uppercase italic tracking-wider font-black shadow-xl shadow-primary/20" asChild>
                        <Link href="/events">Browse Events <ArrowRight className="ml-2" size={20} /></Link>
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg uppercase italic tracking-wider font-black" asChild>
                        <Link href="/for-organizers">Host an Event</Link>
                    </Button>
                </div>

                <div className="hidden lg:block absolute -top-10 -left-20 w-32 h-32 bg-cta/10 rounded-full blur-3xl animate-pulse" />
                <div className="hidden lg:block absolute top-40 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
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
                                                <Badge key={idx} variant="outline" className="bg-white/5 border-none text-[9px] font-bold">{cat.distance}</Badge>
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
