import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { SchedulerInit } from "@/components/SchedulerInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GazeFocus - Distraction-Free Learning Platform",
  description: "Your distraction-free learning companion with eye tracking. Auto-pauses video when you look away.",
  keywords: ["GazeFocus", "eye tracking", "learning", "YouTube", "focus", "distraction-free"],
  authors: [{ name: "Purujith Kadekar" }],
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
    title: "GazeFocus",
    description: "Your eyes stay focused. Your learning stays on track.",
    type: "website",
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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SchedulerInit />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
