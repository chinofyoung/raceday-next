"use client";

import { useState, useEffect } from "react";
import {
  Flag,
  LayoutGrid,
  Type,
  Palette,
  Square,
  MousePointer,
  Tag,
  ArrowRight,
  Calendar,
  Users,
  TrendingUp,
  Navigation,
  Activity,
  MapPin,
  Star,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Section registry
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: "colors", label: "Colors", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "buttons", label: "Buttons", icon: MousePointer },
  { id: "badges", label: "Badges & Pills", icon: Tag },
  { id: "cards", label: "Cards", icon: Square },
  { id: "icons", label: "Icons", icon: LayoutGrid },
  { id: "layout", label: "Layout", icon: Flag },
];

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
      {children}
    </h2>
  );
}

function SectionContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white/[0.015] border border-white/5 rounded-2xl p-8 md:p-12", className)}>
      {children}
    </div>
  );
}

function CodeLabel({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono text-text-muted">
      {children}
    </code>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Color swatch
// ---------------------------------------------------------------------------

interface SwatchProps {
  name: string;
  hex: string;
  cssVar: string;
  textDark?: boolean;
}

function Swatch({ name, hex, cssVar, textDark }: SwatchProps) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="h-20 rounded-xl border border-white/10"
        style={{ backgroundColor: hex }}
      />
      <div className="space-y-1">
        <p className={cn("text-sm font-bold", textDark ? "text-white/80" : "text-white")}>{name}</p>
        <CodeLabel>{hex}</CodeLabel>
        <div className="mt-1">
          <CodeLabel>{cssVar}</CodeLabel>
        </div>
      </div>
    </div>
  );
}

function OpacitySwatch({ color, opacity, hex }: { color: string; opacity: string; hex: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
      <div
        className="w-12 h-8 rounded-lg border border-white/10 shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <CodeLabel>{color}/{opacity}</CodeLabel>
        <CodeLabel>{hex}</CodeLabel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type specimen
// ---------------------------------------------------------------------------

interface TypeSpecimenProps {
  label: string;
  className: string;
  example: string;
  note?: string;
}

function TypeSpecimen({ label, className, example, note }: TypeSpecimenProps) {
  return (
    <div className="py-8 border-b border-white/[0.05] last:border-0 space-y-3">
      <RowLabel>{label}</RowLabel>
      <p className={cn(className, "text-white")}>{example}</p>
      <div className="flex flex-wrap gap-2 items-center pt-1">
        <CodeLabel>{className}</CodeLabel>
        {note && <span className="text-xs text-text-muted">{note}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card demos (raw divs — not the shadcn Card, to match the real app pattern)
// ---------------------------------------------------------------------------

function BasicCard() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] cursor-default space-y-3">
      <div className="flex items-center gap-2 text-primary text-xs font-semibold">
        <Calendar size={12} />
        <span>Mar 22, 2026</span>
      </div>
      <h3 className="text-xl font-bold text-white leading-snug">Metro Half Marathon</h3>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <MapPin size={14} className="text-cta shrink-0" />
        <span>BGC, Taguig</span>
      </div>
      <div className="pt-4 border-t border-white/[0.05] flex flex-wrap gap-1.5">
        <Badge variant="outline" className="bg-white/[0.05] border-white/[0.08] text-text-muted text-xs">21K</Badge>
        <Badge variant="outline" className="bg-white/[0.05] border-white/[0.08] text-text-muted text-xs">10K</Badge>
        <Badge variant="outline" className="bg-white/[0.05] border-white/[0.08] text-text-muted text-xs">5K</Badge>
      </div>
    </div>
  );
}

function FeatureCard({ color, icon: Icon, label, description }: {
  color: "primary" | "cta" | "blue";
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  const colorMap = {
    primary: { bg: "bg-primary/[0.08]", border: "border-primary/[0.12]", text: "text-primary" },
    cta:     { bg: "bg-cta/[0.08]",     border: "border-cta/[0.12]",     text: "text-cta" },
    blue:    { bg: "bg-blue-500/[0.08]", border: "border-blue-500/[0.12]", text: "text-blue-400" },
  }[color];

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-4">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", colorMap.bg, "border", colorMap.border, colorMap.text)}>
        <Icon size={24} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-white">{label}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard() {
  return (
    <div className="grid grid-cols-3 gap-[1px] bg-white/[0.06] rounded-xl overflow-hidden">
      {[
        { value: "10K+", label: "Runners" },
        { value: "50+",  label: "Events" },
        { value: "30s",  label: "Avg. Reg" },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center py-5 px-4 gap-1 bg-background">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs uppercase tracking-wider text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon treatment demo
// ---------------------------------------------------------------------------

interface IconBoxProps {
  icon: React.ElementType;
  color: "primary" | "cta" | "blue";
  label: string;
}

function IconBox({ icon: Icon, color, label }: IconBoxProps) {
  const colorMap = {
    primary: { bg: "bg-primary/[0.08]", border: "border-primary/[0.12]", text: "text-primary", cssColor: "primary" },
    cta:     { bg: "bg-cta/[0.08]",     border: "border-cta/[0.12]",     text: "text-cta",     cssColor: "cta" },
    blue:    { bg: "bg-blue-500/[0.08]", border: "border-blue-500/[0.12]", text: "text-blue-400", cssColor: "blue-500" },
  }[color];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", colorMap.bg, colorMap.border, colorMap.text)}>
        <Icon size={24} />
      </div>
      <CodeLabel>{`bg-${colorMap.cssColor}/8 border-${colorMap.cssColor}/12`}</CodeLabel>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BrandingPage() {
  const [activeSection, setActiveSection] = useState("colors");

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PageWrapper className="pb-24">

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-16 pb-16 lg:pt-24 lg:pb-20">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/[0.05] rounded-full blur-[180px] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-text-muted">Internal Reference</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
            RaceDay<br />
            <span className="text-primary">brand guidelines.</span>
          </h1>

          <p className="text-lg text-text-muted leading-relaxed max-w-xl">
            The living design reference for the RaceDay platform. Colors, type, components, and layout principles — all in one place.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-white/[0.04] mb-16" />

      {/* ------------------------------------------------------------------ */}
      {/* Mobile nav                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden sticky top-[84px] z-40 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-white/[0.05] mb-12">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                activeSection === id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-muted hover:text-white border border-transparent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout: sidebar + content                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-12">

        {/* Sidebar */}
        <nav className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-[100px] space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4 px-3">Sections</p>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                  activeSection === id
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-24">

          {/* ============================================================== */}
          {/* COLORS                                                          */}
          {/* ============================================================== */}
          <section id="colors" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Colors</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                The RaceDay color palette. All values are defined as CSS custom properties via Tailwind config.
              </p>
            </div>

            {/* Core palette */}
            <SectionContainer>
              <RowLabel>Core palette</RowLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                <Swatch name="Primary"    hex="#f97316" cssVar="--color-primary" />
                <Swatch name="Secondary"  hex="#fb923c" cssVar="--color-secondary" />
                <Swatch name="CTA"        hex="#22c55e" cssVar="--color-cta" />
                <Swatch name="Blue"       hex="#3b82f6" cssVar="--color-blue-500" />
                <Swatch name="Background" hex="#1f2937" cssVar="--color-background" />
                <Swatch name="Surface"    hex="#374151" cssVar="--color-surface" />
                <Swatch name="Text"       hex="#f8fafc" cssVar="--color-text" />
                <Swatch name="Text muted" hex="#94a3b8" cssVar="--color-text-muted" />
              </div>
            </SectionContainer>

            {/* Opacity variants */}
            <SectionContainer>
              <RowLabel>Primary opacity variants</RowLabel>
              <p className="text-sm text-text-muted mb-6">
                Used for backgrounds, borders, and subtle highlights. Keep opacity at 5–20% max for backgrounds.
              </p>
              <OpacitySwatch color="primary" opacity="5"  hex="rgba(249,115,22,0.05)" />
              <OpacitySwatch color="primary" opacity="8"  hex="rgba(249,115,22,0.08)" />
              <OpacitySwatch color="primary" opacity="10" hex="rgba(249,115,22,0.10)" />
              <OpacitySwatch color="primary" opacity="12" hex="rgba(249,115,22,0.12)" />
              <OpacitySwatch color="primary" opacity="20" hex="rgba(249,115,22,0.20)" />
            </SectionContainer>

            {/* White overlay scale */}
            <SectionContainer>
              <RowLabel>White overlay scale</RowLabel>
              <p className="text-sm text-text-muted mb-6">
                Used for cards, surfaces, and dividers on the dark background.
              </p>
              {[
                { label: "white/[0.02]", hex: "rgba(255,255,255,0.02)" },
                { label: "white/[0.04]", hex: "rgba(255,255,255,0.04)" },
                { label: "white/[0.06]", hex: "rgba(255,255,255,0.06)" },
                { label: "white/[0.08]", hex: "rgba(255,255,255,0.08)" },
                { label: "white/[0.12]", hex: "rgba(255,255,255,0.12)" },
              ].map(({ label, hex }) => (
                <OpacitySwatch key={label} color={label} opacity="" hex={hex} />
              ))}
            </SectionContainer>
          </section>

          {/* ============================================================== */}
          {/* TYPOGRAPHY                                                      */}
          {/* ============================================================== */}
          <section id="typography" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Typography</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                Barlow Condensed for display headings, Barlow for body copy. Sentence case everywhere except small labels.
              </p>
            </div>

            <SectionContainer>
              <TypeSpecimen
                label="Hero headline"
                className="text-5xl md:text-7xl font-bold tracking-tight"
                example="Find your next race."
                note="Barlow Condensed · Display only · Color accents allowed"
              />
              <TypeSpecimen
                label="Section heading"
                className="text-3xl md:text-4xl font-bold tracking-tight"
                example="Upcoming races"
                note="Barlow Condensed · Sentence case"
              />
              <TypeSpecimen
                label="Card heading"
                className="text-xl font-bold"
                example="Metro Half Marathon"
                note="Barlow · Leading-snug"
              />
              <TypeSpecimen
                label="Body large"
                className="text-lg text-text-muted leading-relaxed"
                example="From fun runs to ultra marathons — discover events, register fast, and join thousands of runners every weekend."
                note="Barlow · text-text-muted"
              />
              <TypeSpecimen
                label="Body"
                className="text-base text-text-muted leading-relaxed"
                example="Browse through running events near your location. Auto-fill your details and secure your slot in seconds."
                note="Barlow · text-text-muted"
              />
              <TypeSpecimen
                label="Small label"
                className="text-xs font-semibold uppercase tracking-wider text-text-muted"
                example="Step 1 · For Organizers · Events Listed"
                note="Only context where uppercase is permitted"
              />
            </SectionContainer>

            {/* Rules card */}
            <SectionContainer>
              <RowLabel>Typography rules</RowLabel>
              <div className="space-y-3">
                {[
                  { rule: "Sentence case on all headings — never title case or ALL CAPS", ok: true },
                  { rule: "Uppercase reserved for small labels: badges, step indicators, footer columns", ok: true },
                  { rule: "font-black, italic, tracking-tighter — never use these", ok: false },
                  { rule: "Body text always text-text-muted and leading-relaxed", ok: true },
                  { rule: "Color accents (text-primary, text-cta) on hero keywords only", ok: true },
                ].map(({ rule, ok }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {ok
                      ? <CheckCircle size={16} className="text-cta shrink-0 mt-0.5" />
                      : <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />}
                    <span className="text-sm text-text-muted">{rule}</span>
                  </div>
                ))}
              </div>
            </SectionContainer>
          </section>

          {/* ============================================================== */}
          {/* BUTTONS                                                         */}
          {/* ============================================================== */}
          <section id="buttons" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Buttons</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                Three primary button contexts. Use green CTA for runner actions, orange for organizer actions, outline for secondary choices.
              </p>
            </div>

            {/* Green CTA */}
            <SectionContainer className="space-y-8">
              <div className="space-y-4">
                <RowLabel>Green CTA — runner actions (Browse Events, Register)</RowLabel>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm"      className="bg-cta hover:bg-cta/90 text-white font-semibold">Browse Events</Button>
                  <Button size="default" className="bg-cta hover:bg-cta/90 text-white font-semibold">Browse Events</Button>
                  <Button size="lg"      className="bg-cta hover:bg-cta/90 text-white font-semibold px-8">Browse Events</Button>
                </div>
                <CodeLabel>bg-cta hover:bg-cta/90 text-white font-semibold</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Orange CTA */}
              <div className="space-y-4">
                <RowLabel>Orange CTA — organizer actions (Launch Event, Manage)</RowLabel>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm"      className="bg-primary hover:bg-primary/90 text-white font-semibold">Launch Your Event</Button>
                  <Button size="default" className="bg-primary hover:bg-primary/90 text-white font-semibold">Launch Your Event</Button>
                  <Button size="lg"      className="bg-primary hover:bg-primary/90 text-white font-semibold px-8">Launch Your Event</Button>
                </div>
                <CodeLabel>bg-primary hover:bg-primary/90 text-white font-semibold</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Outline */}
              <div className="space-y-4">
                <RowLabel>Outline — secondary actions</RowLabel>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm"      variant="outline" className="border-white/[0.12] text-text hover:bg-white/[0.03]">Host an Event</Button>
                  <Button size="default" variant="outline" className="border-white/[0.12] text-text hover:bg-white/[0.03]">Host an Event</Button>
                  <Button size="lg"      variant="outline" className="border-white/[0.12] text-text hover:bg-white/[0.03] px-8">Host an Event</Button>
                </div>
                <CodeLabel>variant=&quot;outline&quot; border-white/[0.12] text-text hover:bg-white/[0.03]</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Disabled + Loading */}
              <div className="space-y-4">
                <RowLabel>States</RowLabel>
                <div className="flex flex-wrap items-center gap-4">
                  <Button className="bg-cta hover:bg-cta/90 text-white font-semibold" disabled>Disabled</Button>
                  <Button className="bg-cta hover:bg-cta/90 text-white font-semibold" isLoading>Loading</Button>
                  <Button variant="outline" className="border-white/[0.12] text-text" disabled>Disabled</Button>
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Text link */}
              <div className="space-y-4">
                <RowLabel>Text link — inline actions</RowLabel>
                <div className="flex flex-wrap items-center gap-6">
                  <a href="#buttons" className="flex items-center gap-1.5 text-primary font-semibold hover:underline text-sm">
                    View all events <ArrowRight size={14} />
                  </a>
                  <a href="#buttons" className="text-text-muted text-sm hover:text-white transition-colors border-b border-white/[0.1] pb-px hover:border-white/[0.3]">
                    Explore platform features
                  </a>
                </div>
                <CodeLabel>text-primary font-semibold hover:underline</CodeLabel>
              </div>
            </SectionContainer>
          </section>

          {/* ============================================================== */}
          {/* BADGES & PILLS                                                  */}
          {/* ============================================================== */}
          <section id="badges" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Badges &amp; pills</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                Status indicators, category tags, and contextual labels.
              </p>
            </div>

            <SectionContainer className="space-y-10">
              {/* Shadcn Badge variants */}
              <div className="space-y-4">
                <RowLabel>Badge variants</RowLabel>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="cta">CTA</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Status pill (open/closed) */}
              <div className="space-y-4">
                <RowLabel>Status badge — event status</RowLabel>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-cta hover:bg-cta/90 text-white border border-white/10 font-semibold">Open</Badge>
                  <Badge className="bg-surface text-text-muted border border-white/10 font-semibold">Closed</Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 font-semibold">Early bird</Badge>
                </div>
                <CodeLabel>bg-cta text-white border border-white/10 font-semibold</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Orientation pill */}
              <div className="space-y-4">
                <RowLabel>Orientation pill — with colored dot</RowLabel>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "The Running Community Platform", dot: "bg-cta" },
                    { label: "New Feature", dot: "bg-green-400" },
                    { label: "For Organizers", dot: "bg-primary" },
                    { label: "Internal Reference", dot: "bg-primary" },
                  ].map(({ label, dot }) => (
                    <div key={label} className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full">
                      <span className={cn("flex h-1.5 w-1.5 rounded-full", dot)} />
                      <span className="text-xs font-semibold text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
                <CodeLabel>inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Category tag */}
              <div className="space-y-4">
                <RowLabel>Category tags — race distances</RowLabel>
                <div className="flex flex-wrap gap-1.5">
                  {["5K", "10K", "21K", "42K", "50K Ultra", "Standard"].map((cat) => (
                    <Badge key={cat} variant="outline" className="bg-white/[0.05] border-white/[0.08] text-text-muted text-xs font-medium py-0.5 px-2.5">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <CodeLabel>variant=&quot;outline&quot; bg-white/[0.05] border-white/[0.08] text-text-muted</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Section label badge */}
              <div className="space-y-4">
                <RowLabel>Section label — inline badge treatment</RowLabel>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/[0.12] rounded-md bg-primary/[0.06]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">For Organizers</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-green-500/[0.12] rounded-md bg-green-500/[0.06]">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-400">New Feature</span>
                  </div>
                </div>
                <CodeLabel>px-3 py-1.5 border border-primary/[0.12] rounded-md bg-primary/[0.06]</CodeLabel>
              </div>
            </SectionContainer>
          </section>

          {/* ============================================================== */}
          {/* CARDS                                                           */}
          {/* ============================================================== */}
          <section id="cards" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Cards</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                Three card patterns used across the platform. Hover on the basic card to see the lift effect.
              </p>
            </div>

            <SectionContainer className="space-y-10">
              {/* Basic event card */}
              <div className="space-y-4">
                <RowLabel>Basic card — event listing with hover lift</RowLabel>
                <div className="max-w-sm">
                  <BasicCard />
                </div>
                <CodeLabel>bg-white/[0.02] border border-white/[0.06] rounded-xl hover:-translate-y-1 hover:border-primary/30</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Feature cards with icon */}
              <div className="space-y-4">
                <RowLabel>Feature card — icon box + heading + description</RowLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <FeatureCard color="primary" icon={Calendar}     label="Find an event"  description="Browse through running events near your location." />
                  <FeatureCard color="cta"     icon={Users}        label="Quick register" description="Auto-fill your details and secure your slot in seconds." />
                  <FeatureCard color="blue"    icon={TrendingUp}   label="Run and track"  description="Get your race bib QR code and cross the finish line." />
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Stat card */}
              <div className="space-y-4">
                <RowLabel>Stats strip — divided grid with 1px gap</RowLabel>
                <div className="max-w-sm">
                  <StatCard />
                </div>
                <CodeLabel>grid gap-[1px] bg-white/[0.06] rounded-xl overflow-hidden · cells: bg-background</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Section container */}
              <div className="space-y-4">
                <RowLabel>Section container — full-width section block</RowLabel>
                <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-8 flex items-center justify-center min-h-[100px]">
                  <span className="text-text-muted text-sm">Section content goes here</span>
                </div>
                <CodeLabel>bg-white/[0.015] border border-white/5 rounded-2xl p-8 md:p-12</CodeLabel>
              </div>
            </SectionContainer>
          </section>

          {/* ============================================================== */}
          {/* ICONS                                                           */}
          {/* ============================================================== */}
          <section id="icons" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Icons</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                Always Lucide React outline icons. Place inside tinted rounded boxes for feature icons.
              </p>
            </div>

            <SectionContainer className="space-y-10">
              {/* Icon box treatment */}
              <div className="space-y-6">
                <RowLabel>Icon box treatment — tinted rounded container</RowLabel>
                <div className="flex flex-wrap gap-10">
                  <IconBox icon={Calendar}   color="primary" label="Primary (orange)" />
                  <IconBox icon={Users}      color="cta"     label="CTA (green)" />
                  <IconBox icon={TrendingUp} color="blue"    label="Blue accent" />
                </div>
                <CodeLabel>w-14 h-14 bg-&#123;color&#125;/8 border border-&#123;color&#125;/12 rounded-2xl flex items-center justify-center</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Small icon boxes */}
              <div className="space-y-4">
                <RowLabel>Small icon box — list items and inline features</RowLabel>
                <div className="space-y-4 max-w-md">
                  {[
                    { icon: Navigation, color: "text-green-400", bg: "bg-green-500/[0.08]", border: "border-green-500/[0.12]", label: "Personal navigator", desc: "Your exact location on the course map." },
                    { icon: Users,      color: "text-blue-400",  bg: "bg-blue-500/[0.08]",  border: "border-blue-500/[0.12]",  label: "Field radar",         desc: "See other runners to gauge your pace." },
                    { icon: Activity,   color: "text-primary",   bg: "bg-primary/[0.08]",   border: "border-primary/[0.12]",   label: "Live tracking",       desc: "Real-time course monitoring." },
                  ].map(({ icon: Icon, color, bg, border, label, desc }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className={cn("mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", bg, border, color)}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{label}</p>
                        <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <CodeLabel>w-8 h-8 rounded-lg bg-&#123;color&#125;/8 border border-&#123;color&#125;/12</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Icon sizes */}
              <div className="space-y-4">
                <RowLabel>Icon sizes</RowLabel>
                <div className="flex items-end gap-8">
                  {[
                    { size: 14, label: "size={14} — small indicators" },
                    { size: 16, label: "size={16} — inline icons" },
                    { size: 24, label: "size={24} — feature icons" },
                  ].map(({ size, label }) => (
                    <div key={size} className="flex flex-col items-center gap-3">
                      <Star size={size} className="text-primary" />
                      <CodeLabel>{label}</CodeLabel>
                    </div>
                  ))}
                </div>
              </div>
            </SectionContainer>
          </section>

          {/* ============================================================== */}
          {/* LAYOUT                                                          */}
          {/* ============================================================== */}
          <section id="layout" className="space-y-10">
            <div className="space-y-2">
              <SectionHeading>Layout</SectionHeading>
              <p className="text-text-muted leading-relaxed">
                Grid, spacing, and structural patterns used consistently across all pages.
              </p>
            </div>

            <SectionContainer className="space-y-10">

              {/* Max width */}
              <div className="space-y-4">
                <RowLabel>Max width and horizontal padding</RowLabel>
                <div className="relative h-14 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-4 sm:w-0 bg-primary/[0.06] border-r border-primary/20" />
                  <div className="absolute inset-y-0 right-0 w-4 sm:w-0 bg-primary/[0.06] border-l border-primary/20" />
                  <span className="text-xs font-mono text-text-muted">max-w-7xl mx-auto</span>
                </div>
                <CodeLabel>max-w-7xl mx-auto px-4 sm:px-0</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Section spacing */}
              <div className="space-y-4">
                <RowLabel>Section spacing</RowLabel>
                <div className="space-y-3">
                  {[
                    { token: "py-24", desc: "Between major page sections (space-y-24 on PageWrapper)" },
                    { token: "pt-16 pb-8 lg:pt-28 lg:pb-16", desc: "Hero section top/bottom" },
                    { token: "p-12 md:p-16", desc: "Inner padding for section containers" },
                    { token: "p-5", desc: "Card content padding" },
                  ].map(({ token, desc }) => (
                    <div key={token} className="flex items-start gap-4 py-2 border-b border-white/[0.04] last:border-0">
                      <CodeLabel>{token}</CodeLabel>
                      <span className="text-sm text-text-muted">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Section divider */}
              <div className="space-y-4">
                <RowLabel>Section divider</RowLabel>
                <div className="space-y-3">
                  <div className="h-px bg-white/[0.04]" />
                  <span className="text-xs text-text-muted">1px divider — <CodeLabel>h-px bg-white/[0.04]</CodeLabel></span>
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Background glow */}
              <div className="space-y-4">
                <RowLabel>Background glow — 5-8% opacity max</RowLabel>
                <div className="relative h-40 rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden flex items-center justify-center">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.06] rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-cta/[0.05] rounded-full blur-[60px] pointer-events-none" />
                  <span className="relative z-10 text-xs text-text-muted font-mono">Glow example — 6% opacity</span>
                </div>
                <CodeLabel>bg-primary/[0.06] rounded-full blur-[120px] — never exceed 8% on backgrounds</CodeLabel>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Dot grid texture */}
              <div className="space-y-4">
                <RowLabel>Dot grid texture — subtle backgrounds</RowLabel>
                <div
                  className="relative h-28 rounded-xl border border-white/[0.06] overflow-hidden flex items-center justify-center"
                  style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)", backgroundSize: "20px 20px" }}
                >
                  <span className="text-xs text-text-muted font-mono relative z-10">opacity-[0.03] background texture</span>
                </div>
                <CodeLabel>{`style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}`}</CodeLabel>
                <p className="text-xs text-text-muted">Wrap in a container with <CodeLabel>opacity-[0.03]</CodeLabel> class on the dot div.</p>
              </div>

            </SectionContainer>
          </section>

        </div>
      </div>
    </PageWrapper>
  );
}
