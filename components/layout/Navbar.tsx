"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LayoutDashboard, Shield, Calendar, BarChart3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { label: "Events", href: "/events", icon: Calendar },
    { label: "For Organizers", href: "/for-organizers", icon: BarChart3 },
    { label: "About", href: "/about", icon: Info },
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
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-8",
                    isScrolled ? "bg-background/80 backdrop-blur-md shadow-lg py-6" : "bg-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Mobile Toggle - Left side for consistency with dashboard */}
                    <button
                        className="md:hidden text-text p-2 hover:bg-white/5 rounded-lg"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        aria-controls="mobile-nav-menu"
                        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                    >
                        {isOpen ? <X /> : <Menu />}
                    </button>

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
                                                <span className="text-sm font-bold text-cta group-hover/admin:text-cta/80 transition-colors">
                                                    Admin Panel
                                                </span>
                                            </Link>
                                        )}
                                        {(user?.role === "organizer" || user?.role === "admin") && (
                                            <Link href="/dashboard/organizer/events" className="hidden lg:flex items-center gap-2 group/manage">
                                                <span className="text-sm font-bold text-text-muted group-hover/manage:text-cta transition-colors">
                                                    Manage Events
                                                </span>
                                            </Link>
                                        )}
                                        <Link href="/dashboard" className="flex items-center gap-2 group/db">
                                            <span className="text-sm font-bold tracking-wider text-text group-hover/db:text-primary transition-colors">
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

                    {/* Spacer for mobile to balance the left burger menu */}
                    <div className="md:hidden w-10" />
                </div>
            </nav>

            {/* Mobile Nav Drawer - Outside <nav> to avoid overflow issues */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
                    <div id="mobile-nav-menu" className="fixed top-0 left-0 bottom-0 z-[110] w-4/5 max-w-sm bg-sidebar border-r border-sidebar-border shadow-2xl animate-in slide-in-from-left md:hidden overflow-y-auto flex flex-col">
                        {/* Header: Logo + close button */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border shrink-0">
                            <Link href="/" onClick={() => setIsOpen(false)} className="block px-2 py-2">
                                <Image
                                    src="/logo.png"
                                    alt="RaceDay"
                                    width={200}
                                    height={40}
                                    className="h-8 w-auto object-contain object-left"
                                />
                            </Link>
                            <button
                                className="text-sidebar-foreground p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close navigation menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Nav content */}
                        <div className="flex flex-col flex-1 py-2 overflow-y-auto">
                            {/* Browse group */}
                            <div className="px-4 py-2">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1 px-2">Browse</p>
                                <div className="flex flex-col gap-1">
                                    {NAV_LINKS.map((link) => {
                                        const Icon = link.icon;
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                )}
                                            >
                                                <Icon size={16} className="shrink-0" />
                                                <span>{link.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Account group - SignedIn only */}
                            {loading ? (
                                <div className="px-4 py-2 mt-2">
                                    <div className="flex items-center gap-3 px-3 py-2">
                                        <div className="w-8 h-8 rounded-full bg-sidebar-accent animate-pulse shrink-0" />
                                        <div className="w-32 h-4 bg-sidebar-accent rounded animate-pulse" />
                                    </div>
                                </div>
                            ) : (
                                <SignedIn>
                                    <div className="px-4 py-2 mt-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1 px-2">Account</p>
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                    pathname.startsWith("/dashboard") && pathname !== "/dashboard/admin" && !pathname.startsWith("/dashboard/organizer")
                                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                )}
                                            >
                                                <LayoutDashboard size={16} className="shrink-0" />
                                                <span>Dashboard</span>
                                            </Link>
                                            {user?.role === "admin" && (
                                                <Link
                                                    href="/dashboard/admin"
                                                    onClick={() => setIsOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                        pathname === "/dashboard/admin"
                                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                    )}
                                                >
                                                    <Shield size={16} className="shrink-0" />
                                                    <span>Admin Panel</span>
                                                </Link>
                                            )}
                                            {(user?.role === "organizer" || user?.role === "admin") && (
                                                <Link
                                                    href="/dashboard/organizer/events"
                                                    onClick={() => setIsOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                        pathname.startsWith("/dashboard/organizer")
                                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                    )}
                                                >
                                                    <BarChart3 size={16} className="shrink-0" />
                                                    <span>Manage Events</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </SignedIn>
                            )}
                        </div>

                        {/* Footer: UserButton or Sign In */}
                        <div className="shrink-0 border-t border-sidebar-border px-6 py-4">
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sidebar-accent animate-pulse" />
                                    <div className="w-24 h-4 bg-sidebar-accent rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <SignedIn>
                                        <div className="flex items-center gap-3">
                                            <UserButton
                                                appearance={{
                                                    elements: {
                                                        userButtonAvatarBox: "w-8 h-8 border border-primary/20 hover:border-primary transition-all",
                                                    }
                                                }}
                                            />
                                            <span className="text-sm font-medium text-sidebar-foreground">My Account</span>
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
                </>
            )}
        </>
    );
}
