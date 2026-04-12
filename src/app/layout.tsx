import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { SchedulerInit } from "@/components/SchedulerInit";
import { SiteFooter } from "@/components/layout/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gaze-focus.vercel.app"),
  title: {
    default: "GazeFocus - Focus-Aware YouTube Learning Platform",
    template: "%s | GazeFocus",
  },
  description: "GazeFocus is a productivity web app for focus-aware YouTube learning, playlist management, reminders, and progress tracking.",
  keywords: ["GazeFocus", "eye tracking", "learning", "YouTube", "focus", "distraction-free"],
  authors: [{ name: "Purujith Kadekar" }],
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "5vFUyvgyOv-f4f4J_3IoaW4EQBeCLiaUkp8e8Vj8EaU",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/logo.svg" },
  },
  openGraph: {
    title: "GazeFocus - Focus-Aware YouTube Learning Platform",
    description: "Your eyes stay focused. Your learning stays on track with focus-aware playback, reminders, and progress dashboards.",
    type: "website",
    url: "https://gaze-focus.vercel.app",
    siteName: "GazeFocus",
  },
  twitter: {
    card: "summary_large_image",
    title: "GazeFocus - Focus-Aware YouTube Learning Platform",
    description: "Track focus, organize videos and playlists, and build consistent study routines.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GazeFocus",
  url: "https://gaze-focus.vercel.app",
  logo: "https://gaze-focus.vercel.app/logo.svg",
  founder: {
    "@type": "Person",
    name: "Purujith Kadekar",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GazeFocus",
  url: "https://gaze-focus.vercel.app",
  description:
    "Focus-aware YouTube learning and productivity platform for tracking progress, playlists, reminders, and study consistency.",
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GazeFocus",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  url: "https://gaze-focus.vercel.app",
  description:
    "GazeFocus helps users learn from YouTube with focus-aware playback, progress tracking, reminders, channels, and playlist organization.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

// Blocking script to prevent theme flickering
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('settings-storage');
    var theme = 'system';
    if (stored) {
      var parsed = JSON.parse(stored);
      theme = parsed.state.theme || 'system';
    }
    
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SchedulerInit />
        <Providers>
          {children}
          <SiteFooter />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
