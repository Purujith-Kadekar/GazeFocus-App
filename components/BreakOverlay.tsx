"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import { Wind, Coffee, Eye } from "lucide-react";
import type { BreakMilestone } from "@/types";

const BREAK_MESSAGES = [
  { icon: Wind, text: "Stand up and stretch — your spine will thank you" },
  { icon: Coffee, text: "Grab some water or step outside for fresh air" },
  { icon: Eye, text: "Look at something 20ft away for 20 seconds (20-20-20 rule)" },
];

interface BreakOverlayProps {
  milestones: BreakMilestone[];
  onBreakEnd: () => void;
}

export function BreakOverlay({ milestones, onBreakEnd }: BreakOverlayProps) {
  const { breakEndsAt, settings } = useStore();
  const [secondsLeft, setSecondsLeft] = useState(settings.breakDurationSeconds);
  const [msgIndex] = useState(() => Math.floor(Math.random() * BREAK_MESSAGES.length));

  const triggeredCount = milestones.filter((m) => m.triggered).length;
  const completedPercent = triggeredCount > 0 ? milestones[triggeredCount - 1]?.percent ?? 0 : 0;

  // Countdown
  useEffect(() => {
    if (!breakEndsAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((breakEndsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) onBreakEnd();
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [breakEndsAt, onBreakEnd]);

  const Msg = BREAK_MESSAGES[msgIndex];
  const Icon = Msg.icon;
  const progress = ((settings.breakDurationSeconds - secondsLeft) / settings.breakDurationSeconds) * 100;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Wellness break"
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 backdrop-blur-xl bg-surface/90" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md text-center px-8 animate-slide-up">
        {/* Milestone badge */}
        <div className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-display tracking-widest uppercase">
          {completedPercent}% milestone reached
        </div>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-surface-2 border border-border flex items-center justify-center">
          <Icon size={32} className="text-accent" />
        </div>

        {/* Heading */}
        <div>
          <h2 className="font-display text-2xl text-text-primary tracking-wide mb-2">
            Time for a break
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            {Msg.text}
          </p>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="font-display text-5xl text-text-primary tabular-nums">
            {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}
            <span className="text-text-muted">:</span>
            {String(secondsLeft % 60).padStart(2, "0")}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-surface-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-text-muted text-xs font-display tracking-widest uppercase">
            Resuming automatically
          </p>
        </div>

        {/* Milestone dots */}
        <div className="flex items-center gap-3">
          {milestones.map((m) => (
            <div key={m.percent} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2 transition-all",
                  m.triggered
                    ? "bg-accent border-accent"
                    : "bg-transparent border-border"
                )}
              />
              <span className="text-text-muted text-xs">{m.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
