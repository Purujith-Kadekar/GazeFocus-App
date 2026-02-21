"use client";

import { signIn } from "next-auth/react";
import { Shield, Eye, Timer, Search, Lock } from "lucide-react";

const FEATURES = [
  { icon: Eye, label: "AI Gaze Tracking", desc: "On-device only, never uploaded" },
  { icon: Timer, label: "Wellness Breaks", desc: "At 25%, 50%, 75%, 100% milestones" },
  { icon: Search, label: "Search Leash", desc: "15-minute anti-doomscroll timer" },
  { icon: Lock, label: "No Data Stored", desc: "LocalStorage only, zero backend" },
];

export function LoginScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgb(110 231 183 / 0.3) 1px, transparent 1px), linear-gradient(90deg, rgb(110 231 183 / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Eye size={20} className="text-accent" />
            </div>
          </div>
          <h1 className="font-display text-4xl tracking-widest text-text-primary">
            GAZE<span className="text-text-muted">FOCUS</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2 tracking-wider">
            DISTRACTION-FREE LEARNING ENVIRONMENT
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-10">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-start gap-3 p-4 bg-surface-1 border border-border rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-text-primary text-xs font-display">{f.label}</p>
                  <p className="text-text-muted text-xs mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl w-full mb-6">
          <Shield size={16} className="text-accent shrink-0 mt-0.5" />
          <p className="text-text-secondary text-xs leading-relaxed">
            <span className="text-accent font-display">Privacy first.</span> Google Sign-In
            is used only to access your YouTube playlists via read-only OAuth. No data is
            stored on our servers — everything lives on your device.
          </p>
        </div>

        {/* Sign in button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/app" })}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-gray-900 font-display text-sm tracking-wider uppercase rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-lg"
        >
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-text-muted text-xs mt-4 text-center">
          By signing in, you grant read-only access to your YouTube playlists.
        </p>
      </div>
    </div>
  );
}
