"use client";

import { useState } from "react";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import { Eye, Timer, Search, Shield, Camera, ChevronRight, ChevronLeft, Zap } from "lucide-react";

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: Shield,
    title: "100% Private by Design",
    description:
      "GazeFocus runs entirely on your device. Your camera feed never leaves your browser. No video history, no analytics, no ads. Google OAuth is used only to fetch your playlists — nothing else.",
    accent: "text-accent",
  },
  {
    icon: Camera,
    title: "AI Gaze Tracking",
    description:
      "We use MediaPipe (by Google) running in WebAssembly locally. If your eyes look away from the screen for more than 1.5 seconds, the video pauses automatically. It resumes the moment you look back.",
    accent: "text-accent",
  },
  {
    icon: Timer,
    title: "Wellness Breaks",
    description:
      "At 25%, 50%, 75%, and 100% of every video, GazeFocus enforces a 2-minute break. You'll see a full-screen prompt to stand up, stretch, and rest your eyes. The video auto-resumes after.",
    accent: "text-warn",
  },
  {
    icon: Search,
    title: "The 15-Minute Search Leash",
    description:
      "Search mode starts a 15-minute countdown. You can add videos to playlists or watch them with the leash active. After 15 minutes, search locks. This kills doomscrolling before it starts.",
    accent: "text-danger",
  },
  {
    icon: Zap,
    title: "Tab Inactivity Alerts",
    description:
      "If you switch tabs or minimize the window, GazeFocus plays an audio beep and pauses your video after a configurable threshold (default: 45 seconds). All customizable in Settings.",
    accent: "text-warn",
  },
];

export function OnboardingModal() {
  const { settings, updateSettings } = useStore();
  const [step, setStep] = useState(0);

  if (settings.onboardingComplete) return null;

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const complete = () => updateSettings({ onboardingComplete: true });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to GazeFocus"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 bg-surface-1 border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up">
        {/* Progress bar */}
        <div className="h-0.5 bg-surface-3">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-8 py-10">
          {/* Logo */}
          {step === 0 && (
            <div className="mb-6 text-center">
              <span className="font-display text-2xl tracking-widest text-accent">
                GAZE<span className="text-text-muted">FOCUS</span>
              </span>
              <p className="text-text-muted text-xs mt-1 tracking-wider">
                DISTRACTION-FREE LEARNING
              </p>
            </div>
          )}

          {/* Step icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
              <Icon size={36} className={currentStep.accent} />
            </div>
          </div>

          {/* Step content */}
          <div className="text-center">
            <h2 className="font-display text-xl text-text-primary tracking-wide mb-3">
              {currentStep.title}
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-8">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-6 bg-accent" : "w-1.5 bg-surface-4"
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-border">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-2 text-sm font-display tracking-wider uppercase transition-colors",
              isFirst
                ? "text-text-muted cursor-not-allowed"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            onClick={isLast ? complete : () => setStep((s) => s + 1)}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-surface font-display text-sm tracking-wider uppercase rounded-lg hover:bg-accent-dim transition-colors"
          >
            {isLast ? "Get Started" : "Next"}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
