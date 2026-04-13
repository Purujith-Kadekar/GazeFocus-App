import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { AutoSyncInit } from "@/components/AutoSyncInit";

type ViewportMode = "mobile" | "tablet" | "desktop";

function detectInitialViewportMode(requestHeaders: Headers): ViewportMode {
  const chMobile = requestHeaders.get("sec-ch-ua-mobile");
  if (chMobile === "?1") return "mobile";

  const ua = (requestHeaders.get("user-agent") || "").toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) return "mobile";

  return "desktop";
}

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
    default: "GazeFocus - Focus-Aware YouTube Learning Platform by Purujith Kadekar",
    template: "%s | GazeFocus",
  },
  description: "GazeFocus is a focus-aware YouTube learning platform built by Purujith Kadekar. Manage playlists, track study progress, set reminders, and stay distraction-free while learning.",
  keywords: [
    "GazeFocus",
    "Purujith Kadekar",
    "focus-aware learning",
    "YouTube learning platform",
    "eye tracking",
    "distraction-free study",
    "playlist management",
    "progress tracking",
    "study reminders",
    "online learning productivity",
  ],
  authors: [{ name: "Purujith Kadekar", url: "https://www.linkedin.com/in/purujith-kadekar/" }],
  creator: "Purujith Kadekar",
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
    title: "GazeFocus - Focus-Aware YouTube Learning Platform by Purujith Kadekar",
    description: "Built by Purujith Kadekar — GazeFocus keeps your eyes and mind on track with focus-aware playback, playlist management, reminders, and progress dashboards.",
    type: "website",
    url: "https://gaze-focus.vercel.app",
    siteName: "GazeFocus",
  },
  twitter: {
    card: "summary_large_image",
    title: "GazeFocus by Purujith Kadekar - Focus-Aware YouTube Learning",
    description: "Track focus, organize videos and playlists, and build consistent study routines. Created by Purujith Kadekar.",
    creator: "@purujithkadekar",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GazeFocus",
  url: "https://gaze-focus.vercel.app",
  description: "GazeFocus is a focus-aware YouTube learning platform built by Purujith Kadekar. Manage playlists, track study progress, set reminders, and stay distraction-free while learning.",
  author: {
    "@type": "Person",
    name: "Purujith Kadekar",
    url: "https://gaze-focus.vercel.app/about",
    sameAs: [
      "https://www.linkedin.com/in/purujith-kadekar/",
    ],
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://gaze-focus.vercel.app/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Purujith Kadekar",
  url: "https://gaze-focus.vercel.app/about",
  sameAs: [
    "https://www.linkedin.com/in/purujith-kadekar/",
  ],
  jobTitle: "Founder",
  worksFor: {
    "@type": "Organization",
    name: "GazeFocus",
    url: "https://gaze-focus.vercel.app",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const initialViewportMode = detectInitialViewportMode(requestHeaders);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AutoSyncInit />
        <Providers initialViewportMode={initialViewportMode}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
