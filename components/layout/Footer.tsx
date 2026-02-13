import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-surface/50 border-t border-white/5 py-12 px-4 mt-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <Link href="/" className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                        <Image
                            src="/logo.png"
                            alt="RaceDay"
                            width={140}
                            height={36}
                            className="h-7 w-auto object-contain"
                        />
                    </Link>
                    <p className="text-text-muted text-sm leading-relaxed">
                        The ultimate platform for running events. We make registration easy for runners and management seamless for organizers.
                    </p>
                </div>

                <div>
                    <h4 className="text-text font-bold uppercase mb-6 tracking-wide">Explore</h4>
                    <ul className="space-y-3 text-text-muted text-sm">
                        <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
                        <li><Link href="/for-organizers" className="hover:text-primary transition-colors">For Organizers</Link></li>
                        <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-text font-bold uppercase mb-6 tracking-wide">Legal</h4>
                    <ul className="space-y-3 text-text-muted text-sm">
                        <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-text font-bold uppercase mb-6 tracking-wide">Connect</h4>
                    <ul className="space-y-3 text-text-muted text-sm">
                        <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted opacity-50">
                <p>© 2026 RaceDay. All rights reserved.</p>
                <p>Built with Passion for Runners.</p>
            </div>
        </footer>
    );
}
