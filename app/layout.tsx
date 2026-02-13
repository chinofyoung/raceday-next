import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RaceDay | Running Events & Race Registration Platform",
    template: "%s | RaceDay"
  },
  description: "Discover marathons, fun runs, and trail races. Register, pay, and track your race passes in one place. The premium platform for the Philippine running community.",
  keywords: ["running", "marathon", "race registration", "fun run", "Philippines runs", "RaceDay"],
  authors: [{ name: "RaceDay Team" }],
  creator: "RaceDay",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://raceday.com"),
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://raceday.com",
    title: "RaceDay | Running Events Platform",
    description: "Discover and register for the best running events in the Philippines.",
    siteName: "RaceDay",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RaceDay - The Ultimate Running Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "RaceDay | Running Events Platform",
    description: "Discover and register for the best running events in the Philippines.",
    images: ["/og-image.png"],
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased selection:bg-primary/30 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
