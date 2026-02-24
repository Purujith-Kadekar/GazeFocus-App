"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Eye, Timer, Search, Lock, Mail, KeyRound } from "lucide-react";

const FEATURES = [
  { icon: Eye, label: "AI Gaze Tracking", desc: "On-device only, never uploaded" },
  { icon: Timer, label: "Wellness Breaks", desc: "At 25%, 50%, 75%, 100% milestones" },
  { icon: Search, label: "Search Leash", desc: "15-minute anti-doomscroll timer" },
  { icon: Lock, label: "Progress & notes", desc: "Stored securely in your account" },
];

export function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"google" | "email-login" | "email-register">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "email-register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        callbackUrl: "/app",
        email,
        password,
      });

      if (signInResult?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/app");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-accent font-display">Privacy first.</span> Your camera is
            processed on-device, and your playlists/notes live in your own database account.
          </p>
        </div>

        {/* Auth modes */}
        <div className="w-full space-y-4">
          <div className="grid grid-cols-3 gap-1 text-xs font-display rounded-lg bg-surface-2 p-1 mb-1">
            <button
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 ${
                mode === "google" ? "bg-accent text-surface" : "text-text-secondary"
              }`}
              onClick={() => setMode("google")}
              type="button"
            >
              <Eye size={12} />
              Google
            </button>
            <button
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 ${
                mode === "email-login" ? "bg-accent text-surface" : "text-text-secondary"
              }`}
              onClick={() => setMode("email-login")}
              type="button"
            >
              <Mail size={12} />
              Login
            </button>
            <button
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 ${
                mode === "email-register" ? "bg-accent text-surface" : "text-text-secondary"
              }`}
              onClick={() => setMode("email-register")}
              type="button"
            >
              <KeyRound size={12} />
              Register
            </button>
          </div>

          {mode === "google" && (
            <>
              <button
                onClick={() => signIn("google", { callbackUrl: "/app" })}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-gray-900 font-display text-sm tracking-wider uppercase rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-lg"
              >
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
            </>
          )}

          {mode !== "google" && (
            <form onSubmit={handleEmailAuth} className="w-full space-y-3">
              {mode === "email-register" && (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs text-text-secondary">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
                    placeholder="How should we call you?"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs text-text-secondary">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs text-text-secondary">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
                  placeholder="At least 8 characters"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center mt-1">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-surface font-display text-sm tracking-wider uppercase rounded-xl hover:bg-accent-dim disabled:opacity-60 transition-colors"
              >
                {loading ? "Please wait…" : mode === "email-register" ? "Create account" : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

