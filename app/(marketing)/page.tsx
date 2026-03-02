import Link from "next/link";
import { ArrowRight, Calendar, MapPin, TrendingUp, Users, Zap, Trophy, Timer, Navigation, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RaceEvent } from "@/types/event";
import { format } from "date-fns";
import Image from "next/image";
import { formatDistance, cn } from "@/lib/utils";
import { isEventOver } from "@/lib/earlyBirdUtils";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

async function getUpcomingEvents() {
    try {
        const convexEvents = await fetchQuery(api.events.list, {
            status: "published",
            paginationOpts: { numItems: 10, cursor: null }
        });

        const allEvents = (convexEvents?.page || []).map(e => ({
            ...e,
            id: e._id
        })) as RaceEvent[];

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
                            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">
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
                                <span className="absolute -bottom-2.5 left-0 w-full h-1.5 bg-cta/30 rounded-full" />
                            </span>.
                        </h1>

                        <p className="text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed font-medium lg:pr-8">
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
                            <div className="flex items-center gap-3 text-primary">
                                <Calendar size={24} />
                                <span className="text-4xl md:text-5xl font-black italic tracking-tight text-white">50+</span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mt-1">Events Listed</span>
                        </div>
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-3 text-cta">
                                <Users size={24} />
                                <span className="text-4xl md:text-5xl font-black italic tracking-tight text-white">10K+</span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mt-1">Runners Joined</span>
                        </div>
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-3 text-blue-400">
                                <Trophy size={24} />
                                <span className="text-4xl md:text-5xl font-black italic tracking-tight text-white">200+</span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mt-1">Race Categories</span>
                        </div>
                        <div className="flex flex-col items-center md:py-8 gap-2">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Timer size={24} />
                                <span className="text-4xl md:text-5xl font-black italic tracking-tight text-white">30s</span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mt-1">Avg. Registration</span>
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

                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((event, idx) => {
                        const eventDate = new Date(event.date as string | number | Date);
                        const isValidDate = eventDate && !isNaN(eventDate.getTime());
                        return (
                            <Link key={event.id} href={`/events/${event.id}`}>
                                <Card className="group overflow-hidden border border-white/5 hover:border-primary/40 bg-surface/40 p-0 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col h-full">
                                    <div className="aspect-[16/9] bg-white/5 relative overflow-hidden shrink-0">
                                        {event.featuredImage ? (
                                            <Image
                                                src={event.featuredImage}
                                                alt={event.name}
                                                fill
                                                priority={idx < 3}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                        )}
                                        <div className="absolute top-4 right-4 z-20">
                                            <Badge variant="success" className="bg-cta hover:bg-cta/90 text-white border border-white/10 shadow-lg backdrop-blur-md">Open</Badge>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col gap-5 grow">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-1.5 text-primary text-[11px] font-black uppercase tracking-widest italic">
                                                    <Calendar size={14} />
                                                    <span>{isValidDate ? format(eventDate, "MMM d, yyyy") : "TBD"}</span>
                                                </div>
                                                <div className="text-white text-[11px] font-black uppercase tracking-widest italic flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
                                                    {event.categories?.length > 0
                                                        ? `₱${Math.min(...event.categories.map(c => c.price))}`
                                                        : "Price TBD"}
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black uppercase italic text-white group-hover:text-primary transition-colors tracking-tighter leading-tight line-clamp-2">
                                                {event.name}
                                            </h3>
                                        </div>

                                        <div className="flex items-start gap-2.5 text-sm text-text-muted font-medium">
                                            <MapPin size={16} className="text-cta shrink-0 mt-0.5" />
                                            <span className="line-clamp-2 leading-snug">{event.location?.name || "Multiple Locations"}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5 mt-auto">
                                            {event.categories?.slice(0, 3).map((cat, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-white text-[10px] uppercase font-bold py-0.5 px-2.5 hover:bg-white/10 transition-colors">
                                                    {formatDistance(cat.distance, cat.distanceUnit)}
                                                </Badge>
                                            )) || (
                                                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white text-[10px] uppercase font-bold py-0.5 px-2.5">Standard</Badge>
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

            {/* Live Tracking Feature Highlight */}
            <section className="relative rounded-[3rem] overflow-hidden border border-white/5 bg-surface/40 p-12 md:p-24 space-y-16 group isolate">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

                {/* Simulated Map Background lines */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-green-500/30 rounded-full text-green-400 bg-green-500/10 uppercase font-black italic tracking-widest text-[10px]">
                            <Activity size={12} className="animate-pulse" /> New Feature
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black italic uppercase leading-[0.9] tracking-tighter text-white">
                                Never Run <br />
                                <span className="text-green-400">Alone</span> Again.
                            </h2>
                            <p className="text-text-muted text-lg md:text-xl font-medium italic leading-relaxed max-w-lg">
                                Experience race day like never before with real-time <span className="text-white font-bold">Live Tracking</span>. See exactly where you are on the interactive course map, monitor your heading, and track your friends and the entire field live.
                            </p>
                        </div>

                        <ul className="space-y-4 pt-4">
                            <li className="flex items-start gap-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
                                    <Navigation size={14} className="text-green-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold italic uppercase tracking-wide text-sm">Personal Navigator</h4>
                                    <p className="text-text-muted text-sm italic pr-4">A vibrant emerald directional marker shows your exact location and real-time heading based on your device's compass.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                                    <Users size={14} className="text-blue-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold italic uppercase tracking-wide text-sm">Field Radar</h4>
                                    <p className="text-text-muted text-sm italic pr-4">Spot other runners instantly with blue markers, allowing you to gauge your pace and position against the pack.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Highly Styled Mockup */}
                    <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-green-500/10 bg-[#1f2937] flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-700">
                        {/* Map base simulation */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `repeating-linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151), repeating-linear-gradient(45deg, #374151 25%, #1f2937 25%, #1f2937 75%, #374151 75%, #374151)`,
                            backgroundPosition: `0 0, 20px 20px`,
                            backgroundSize: `40px 40px`
                        }} />

                        {/* Glowing Route Line */}
                        <svg className="absolute inset-0 w-full h-full stroke-primary opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M 0 80 Q 20 70, 40 40 T 80 20 T 100 50" fill="none" strokeWidth="1.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        </svg>

                        {/* Simulated Current User Marker */}
                        <div className="absolute top-[40%] left-[40%] -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="w-12 h-12 flex items-center justify-center animate-bounce duration-[2000ms]">
                                <div style={{ transform: 'rotate(45deg)' }} className="w-10 h-10 flex items-center justify-center relative">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                                        <path d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" fill="#22c55e" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                                        <circle cx="12" cy="13.5" r="2.5" fill="white" fillOpacity="0.4" />
                                    </svg>
                                </div>
                            </div>
                            {/* Popup Simulation */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap">
                                <span className="text-[10px] font-black italic uppercase tracking-wider text-white">Jane Doe <span className="text-green-400">(You)</span></span>
                            </div>
                        </div>

                        {/* Simulated Other Runner 1 */}
                        <div className="absolute top-[30%] left-[65%] -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-1000 animate-pulse">
                            <div style={{ transform: 'rotate(15deg)' }} className="w-6 h-6 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md opacity-90">
                                    <path d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" fill="#3b82f6" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                                    <circle cx="12" cy="13.5" r="2.5" fill="white" fillOpacity="0.4" />
                                </svg>
                            </div>
                        </div>

                        {/* Simulated Other Runner 2 */}
                        <div className="absolute top-[65%] left-[25%] -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-1000 animate-pulse">
                            <div style={{ transform: 'rotate(70deg)' }} className="w-6 h-6 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md opacity-90">
                                    <path d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" fill="#3b82f6" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                                    <circle cx="12" cy="13.5" r="2.5" fill="white" fillOpacity="0.4" />
                                </svg>
                            </div>
                        </div>

                        {/* Background Field Runners Simulation */}
                        <div className="absolute top-[20%] left-[20%] z-0 opacity-40" style={{ transform: 'rotate(50deg)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" fill="#3b82f6" stroke="white" strokeWidth="2" /></svg></div>
                        <div className="absolute top-[80%] left-[80%] z-0 opacity-40" style={{ transform: 'rotate(-40deg)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" fill="#3b82f6" stroke="white" strokeWidth="2" /></svg></div>
                        <div className="absolute top-[75%] left-[50%] z-0 opacity-40" style={{ transform: 'rotate(80deg)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" fill="#3b82f6" stroke="white" strokeWidth="2" /></svg></div>

                        {/* Live Tracking overlay simulation */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/10 flex justify-between items-center z-30 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-black bg-surface flex items-center justify-center z-30 relative"><span className="text-[10px] font-black text-white">C</span><div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black bg-green-500" /></div>
                                    <div className="w-7 h-7 rounded-full border-2 border-black bg-surface flex items-center justify-center z-20 relative"><span className="text-[10px] font-black text-white">M</span><div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black bg-blue-500" /></div>
                                    <div className="w-7 h-7 rounded-full border-2 border-black bg-surface flex items-center justify-center z-10 relative"><span className="text-[10px] font-black text-white">A</span><div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black bg-blue-500" /></div>
                                </div>
                                <span className="text-[10px] font-black uppercase italic tracking-wider text-text-muted"><span className="text-white">1,024</span> Active</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded">
                                <Activity size={12} className="text-green-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase text-white italic tracking-widest">Live</span>
                            </div>
                        </div>
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

                    <h2 className="text-4xl md:text-7xl font-black italic uppercase leading-[0.9] tracking-tighter text-white max-w-7xl mx-auto">
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
