import type { Metadata } from "next";
import { DM_Mono, Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "GazeFocus — Distraction-Free Learning",
  description:
    "Privacy-first YouTube learning environment with AI gaze tracking, wellness breaks, and anti-doomscroll tools.",
  keywords: ["youtube", "focus", "learning", "gaze tracking", "productivity"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to MediaPipe CDN for faster model load */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
      </head>
      <body
        className={`${dmMono.variable} ${geist.variable} font-body bg-surface text-text-primary antialiased`}
      >
        <SessionProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(var(--surface-2))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--text-primary))",
                fontFamily: "var(--font-display)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
