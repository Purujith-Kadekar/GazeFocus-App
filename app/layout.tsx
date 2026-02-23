import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
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
        className={`${dmSans.variable} ${inter.variable} font-sans bg-background text-foreground antialiased`}
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
