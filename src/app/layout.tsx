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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const initialViewportMode = detectInitialViewportMode(requestHeaders);

  return (
    <html lang="en" suppressHydrationWarning>
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
