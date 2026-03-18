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
  title: "Gaze Focus - Distraction-Free Learning Platform",
  description: "A focused learning platform with eye tracking, playlist management, and note-taking. Learn without distractions.",
  keywords: ["Gaze Focus", "learning", "eye tracking", "YouTube", "playlists", "notes", "focus"],
  authors: [{ name: "Gaze Focus Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Gaze Focus",
    description: "Learn without distractions",
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
