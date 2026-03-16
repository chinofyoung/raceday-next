import Link from "next/link";
import { ArrowRight, Calendar, MapPin, TrendingUp, Users, Navigation, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <PageWrapper className="space-y-24">
            {/* Hero Section */}
            <section className="relative pt-16 pb-8 lg:pt-28 lg:pb-16 overflow-visible">
                {/* Background hero image — full bleed */}
                <div className="absolute inset-0 -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden pointer-events-none" aria-hidden="true">
                    <Image
                        src="/placeholder-running.jpg"
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-background/80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
                </div>

                <div className="relative z-10 space-y-14">
                    {/* Top Badge */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full backdrop-blur-sm">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-cta" />
                            <span className="text-xs font-semibold text-text-muted">
                                The Running Community Platform
                            </span>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="space-y-6 text-center lg:text-left max-w-5xl">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                            Find your next race.<br />
                            <span className="text-primary">Register in seconds.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed font-normal lg:pr-8">
                            From fun runs to ultra marathons — discover events, register fast,
                            and join thousands of runners pushing their limits every weekend.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-2">
                            <Button size="lg" className="w-full sm:w-auto font-semibold px-8 bg-cta hover:bg-cta/90 text-white" asChild>
                                <Link href="/events" className="flex items-center gap-2">
                                    Browse Events
                                    <ArrowRight size={16} />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium px-8 border-white/[0.12] text-text hover:bg-white/[0.03] backdrop-blur-sm" asChild>
                                <Link href="/for-organizers">Host an Event</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Strip — clean divided grid, no icons per stat */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.06] rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="flex flex-col items-center py-7 px-6 gap-1.5 bg-background/80">
                            <span className="text-3xl font-bold text-white leading-none">50+</span>
                            <span className="text-xs uppercase tracking-wider text-text-muted">Events Listed</span>
                        </div>
                        <div className="flex flex-col items-center py-7 px-6 gap-1.5 bg-background/80">
                            <span className="text-3xl font-bold text-white leading-none">10K+</span>
                            <span className="text-xs uppercase tracking-wider text-text-muted">Runners Joined</span>
                        </div>
                        <div className="flex flex-col items-center py-7 px-6 gap-1.5 bg-background/80">
                            <span className="text-3xl font-bold text-white leading-none">200+</span>
                            <span className="text-xs uppercase tracking-wider text-text-muted">Race Categories</span>
                        </div>
                        <div className="flex flex-col items-center py-7 px-6 gap-1.5 bg-background/80">
                            <span className="text-3xl font-bold text-white leading-none">30s</span>
                            <span className="text-xs uppercase tracking-wider text-text-muted">Avg. Registration</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Races */}
            <section className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Upcoming Races</h2>
                        <p className="text-text-muted font-normal">Don&apos;t miss out on the biggest events of the season.</p>
                    </div>
                    <Link href="/events" className="hidden md:flex items-center gap-1.5 text-primary font-semibold hover:underline">
                        View All Events <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((event, idx) => {
                        const eventDate = new Date(event.date as string | number | Date);
                        const isValidDate = eventDate && !isNaN(eventDate.getTime());
                        return (
                            <Link key={event.id} href={`/events/${event.id}`}>
                                <Card className="group overflow-hidden border border-white/[0.06] hover:border-primary/30 bg-white/[0.02] p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col h-full">
                                    <div className="aspect-[16/9] bg-white/[0.05] relative overflow-hidden shrink-0">
                                        {event.featuredImage ? (
                                            <Image
                                                src={event.featuredImage}
                                                alt={event.name}
                                                fill
                                                priority={idx < 3}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-500 ease-out"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                        )}
                                        <div className="absolute top-3 right-3 z-20">
                                            <Badge variant="success" className="bg-cta hover:bg-cta/90 text-white border border-white/10 shadow-md backdrop-blur-md text-xs font-semibold">Open</Badge>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col gap-4 grow">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                                                    <Calendar size={12} />
                                                    <span>{isValidDate ? format(eventDate, "MMM d, yyyy") : "TBD"}</span>
                                                </div>
                                                <div className="text-text text-xs font-semibold flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cta" />
                                                    {event.categories?.length > 0
                                                        ? `₱${Math.min(...event.categories.map(c => c.price))}`
                                                        : "Price TBD"}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                                {event.name}
                                            </h3>
                                        </div>

                                        <div className="flex items-start gap-2 text-sm text-text-muted">
                                            <MapPin size={14} className="text-cta shrink-0 mt-0.5" />
                                            <span className="line-clamp-2 leading-snug">{event.location?.name || "Multiple Locations"}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.05] mt-auto">
                                            {event.categories?.slice(0, 3).map((cat, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-white/[0.05] border-white/[0.08] text-text-muted text-xs font-medium py-0.5 px-2.5 hover:bg-white/[0.08] transition-colors">
                                                    {formatDistance(cat.distance, cat.distanceUnit)}
                                                </Badge>
                                            )) || (
                                                    <Badge variant="outline" className="bg-white/[0.05] border-white/[0.08] text-text-muted text-xs font-medium py-0.5 px-2.5">Standard</Badge>
                                                )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    }) : (
                        [1, 2, 3].map((i) => (
                            <Card key={i} className="aspect-[16/9] bg-white/[0.03] animate-pulse border-white/[0.05]" />
                        ))
                    )}
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-white/[0.015] rounded-2xl p-12 md:p-16 border border-white/[0.05] relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                    <div className="space-y-4 text-center">
                        <div className="w-14 h-14 bg-primary/[0.08] border border-primary/[0.12] rounded-2xl flex items-center justify-center mx-auto text-primary">
                            <Calendar size={24} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step 1</p>
                            <h4 className="text-xl font-bold text-white">Find an event</h4>
                        </div>
                        <p className="text-text-muted text-sm px-4 leading-relaxed">Browse through running events near your location.</p>
                    </div>
                    <div className="space-y-4 text-center">
                        <div className="w-14 h-14 bg-cta/[0.08] border border-cta/[0.12] rounded-2xl flex items-center justify-center mx-auto text-cta">
                            <Users size={24} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-cta">Step 2</p>
                            <h4 className="text-xl font-bold text-white">Quick register</h4>
                        </div>
                        <p className="text-text-muted text-sm px-4 leading-relaxed">Auto-fill your details and secure your slot in seconds.</p>
                    </div>
                    <div className="space-y-4 text-center">
                        <div className="w-14 h-14 bg-blue-500/[0.08] border border-blue-500/[0.12] rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                            <TrendingUp size={24} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Step 3</p>
                            <h4 className="text-xl font-bold text-white">Run & track</h4>
                        </div>
                        <p className="text-text-muted text-sm px-4 leading-relaxed">Get your race bib QR code and cross the finish line.</p>
                    </div>
                </div>
            </section>

            {/* Live Tracking Feature Highlight */}
            <section className="relative rounded-2xl overflow-hidden border border-white/[0.05] bg-white/[0.02] p-12 md:p-20 isolate">
                {/* Reduced opacity background glows */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-green-500/[0.06] rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/[0.05] rounded-full blur-[150px] pointer-events-none" />

                {/* Dot grid texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        {/* "New Feature" badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-green-500/[0.12] rounded-md bg-green-500/[0.06]">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-green-400">New Feature</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                                Never run<br />
                                <span className="text-green-400">alone</span> again.
                            </h2>
                            <p className="text-text-muted text-lg font-normal leading-relaxed max-w-lg">
                                Real-time live tracking on an interactive course map. See your position, monitor your heading, and track friends across the field.
                            </p>
                        </div>

                        <ul className="space-y-5 pt-2">
                            <li className="flex items-start gap-4">
                                <div className="mt-0.5 w-8 h-8 rounded-lg bg-green-500/[0.08] border border-green-500/[0.12] flex items-center justify-center shrink-0">
                                    <Navigation size={14} className="text-green-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white text-sm font-bold">Personal Navigator</h4>
                                    <p className="text-text-muted text-sm leading-relaxed pr-4">Your exact location and real-time heading on the course map.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-500/[0.08] border border-blue-500/[0.12] flex items-center justify-center shrink-0">
                                    <Users size={14} className="text-blue-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white text-sm font-bold">Field Radar</h4>
                                    <p className="text-text-muted text-sm leading-relaxed pr-4">See other runners on the map to gauge your pace and position.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Map Mockup — simplified circle markers */}
                    <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-green-500/[0.08] bg-[#111827]">
                        {/* Dot grid */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                        {/* Route line */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M 8 82 Q 25 65, 42 42 T 78 22 T 96 48" fill="none" stroke="#f97316" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
                        </svg>

                        {/* Current user marker — green circle */}
                        <div className="absolute top-[38%] left-[42%] -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
                            {/* Name popup */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.08] shadow-lg whitespace-nowrap">
                                <span className="text-xs font-semibold text-white">Jane Doe <span className="text-green-400">(You)</span></span>
                            </div>
                        </div>

                        {/* Other runner 1 — blue circle */}
                        <div className="absolute top-[26%] left-[64%] -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white/70 opacity-80 animate-pulse" />
                        </div>

                        {/* Other runner 2 — blue circle */}
                        <div className="absolute top-[62%] left-[26%] -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white/70 opacity-80 animate-pulse" />
                        </div>

                        {/* Background field runners — smaller blue circles */}
                        <div className="absolute top-[20%] left-[20%] z-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/50 opacity-40" />
                        </div>
                        <div className="absolute top-[80%] left-[80%] z-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/50 opacity-40" />
                        </div>
                        <div className="absolute top-[74%] left-[52%] z-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/50 opacity-40" />
                        </div>

                        {/* Bottom status bar */}
                        <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-xl p-3 border border-white/[0.06] flex justify-between items-center z-30">
                            <div className="flex items-center gap-2.5">
                                <div className="flex -space-x-1.5">
                                    <div className="w-6 h-6 rounded-full border-2 border-black bg-surface flex items-center justify-center z-30 relative">
                                        <span className="text-xs font-bold text-white">C</span>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black bg-green-500" />
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-black bg-surface flex items-center justify-center z-20 relative">
                                        <span className="text-xs font-bold text-white">M</span>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black bg-blue-500" />
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-black bg-surface flex items-center justify-center z-10 relative">
                                        <span className="text-xs font-bold text-white">A</span>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black bg-blue-500" />
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-text-muted"><span className="text-white">1,024</span> Active</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.05] rounded-md">
                                <Activity size={10} className="text-green-400 animate-pulse" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-white">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Organizer CTA */}
            <section className="relative rounded-2xl overflow-hidden border border-white/[0.05] bg-white/[0.015] p-12 md:p-20 text-center">
                {/* Reduced opacity glows */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/[0.06] rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-cta/[0.04] rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    {/* Badge */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/[0.12] rounded-md bg-primary/[0.06]">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">For Organizers</span>
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
                        Empowering organizers,<br />
                        igniting <span className="text-primary">communities.</span>
                    </h2>

                    <p className="text-text-muted max-w-xl mx-auto text-lg font-normal leading-relaxed">
                        The most robust registration and participant management platform built for professional race directors and local running clubs.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                        <Button size="lg" className="w-full sm:w-auto font-semibold px-8 bg-primary hover:bg-primary/90 text-white" asChild>
                            <Link href="/for-organizers" className="flex items-center gap-2">
                                Launch Your Event
                                <ArrowRight size={16} />
                            </Link>
                        </Button>
                        <Link href="/about" className="text-text-muted text-sm hover:text-white transition-colors border-b border-white/[0.1] pb-px hover:border-white/[0.3]">
                            Explore platform features
                        </Link>
                    </div>
                </div>
            </section>
        </PageWrapper>
    );
}
