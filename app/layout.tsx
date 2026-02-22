import type { Metadata } from "next";
import { DM_Mono, Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
});

const inter = Inter({
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
      </head>
      <body
        className={`${dmMono.variable} ${inter.variable} font-body bg-surface text-text-primary antialiased`}
      >
        <SessionProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#111118",
                border: "1px solid #2a2a38",
                color: "#f0f0f5",
                fontFamily: "var(--font-display)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
