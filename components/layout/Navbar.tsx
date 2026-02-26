"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { label: "Events", href: "/events" },
    { label: "For Organizers", href: "/for-organizers" },
    { label: "About", href: "/about" },
];

export function Navbar() {
    const { user, loading } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);

    const pathname = usePathname();

    React.useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        let rafId: number;

        const handleScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > 10);
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-8",
                isScrolled ? "bg-background/80 backdrop-blur-md shadow-lg py-6" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center transition-transform hover:scale-105 active:scale-95">
                    <Image
                        src="/logo.png"
                        alt="RaceDay"
                        width={180}
                        height={48}
                        className="h-9 w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-text-muted hover:text-primary font-medium transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}

                    {loading ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                            <div className="w-20 h-4 bg-white/5 rounded animate-pulse hidden md:block" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <SignedOut>
                                <Button variant="primary" size="sm" asChild>
                                    <Link href="/auth/login">Sign In</Link>
                                </Button>
                            </SignedOut>
                            <SignedIn>
                                <div className="flex items-center gap-6">
                                    {user?.role === "admin" && (
                                        <Link href="/dashboard/admin" className="hidden lg:flex items-center gap-2 group/admin">
                                            <span className="text-xs font-semibold uppercase tracking-widest text-cta group-hover/admin:text-cta/80 transition-colors">
                                                Admin Panel
                                            </span>
                                        </Link>
                                    )}
                                    {(user?.role === "organizer" || user?.role === "admin") && (
                                        <Link href="/dashboard/events" className="hidden lg:flex items-center gap-2 group/manage">
                                            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted group-hover/manage:text-cta transition-colors">
                                                Manage Events
                                            </span>
                                        </Link>
                                    )}
                                    <Link href="/dashboard" className="flex items-center gap-2 group/db">
                                        <span className="text-sm font-bold uppercase italic tracking-wider text-text group-hover/db:text-primary transition-colors">
                                            Dashboard
                                        </span>
                                    </Link>
                                    <UserButton
                                        appearance={{
                                            elements: {
                                                userButtonAvatarBox: "w-8 h-8 border border-primary/20 hover:border-primary transition-all",
                                            }
                                        }}
                                    />
                                </div>
                            </SignedIn>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-text p-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-controls="mobile-nav-menu"
                    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div id="mobile-nav-menu" className="md:hidden absolute top-full left-4 right-4 mt-2 bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-top-4">
                    <div className="flex flex-col gap-4">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-lg font-semibold py-4 transition-colors border-b border-white/5 last:border-0",
                                    pathname === link.href ? "text-primary border-l-2 border-primary pl-4 -ml-4" : "text-text hover:text-primary"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-white/5 space-y-4">
                            {loading ? (
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
                                    <div className="w-32 h-5 bg-white/5 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <SignedIn>
                                        <Link
                                            href="/dashboard"
                                            className={cn(
                                                "flex items-center gap-3 text-lg font-semibold py-4 transition-colors",
                                                pathname.startsWith("/dashboard") && pathname !== "/dashboard/admin" && pathname !== "/dashboard/events" ? "text-primary" : "text-text hover:text-primary"
                                            )}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <LayoutDashboard size={20} className="text-primary" />
                                            Dashboard
                                        </Link>
                                        {user?.role === "admin" && (
                                            <Link
                                                href="/dashboard/admin"
                                                className="flex items-center gap-3 text-lg font-semibold py-4 text-cta hover:opacity-80 transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Shield size={20} />
                                                Admin Panel
                                            </Link>
                                        )}
                                        {(user?.role === "organizer" || user?.role === "admin") && (
                                            <Link
                                                href="/dashboard/events"
                                                className="flex items-center gap-3 text-lg font-semibold py-4 text-cta hover:opacity-80 transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <LayoutDashboard size={20} />
                                                Manage Events
                                            </Link>
                                        )}
                                        <div className="py-4 flex justify-between items-center border-t border-white/5">
                                            <span className="text-lg font-semibold text-text-muted">Account</span>
                                            <UserButton />
                                        </div>
                                    </SignedIn>
                                    <SignedOut>
                                        <Button className="w-full" asChild>
                                            <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                                                Sign In
                                            </Link>
                                        </Button>
                                    </SignedOut>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
