"use client";

import { AlertCircle } from "lucide-react";

interface InactivityAlertProps {
  onDismiss: () => void;
}

export function InactivityAlert({ onDismiss }: InactivityAlertProps) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-label="Inactivity detected"
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 backdrop-blur-md bg-surface/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm text-center px-8 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-warn/10 border border-warn/30 flex items-center justify-center">
          <AlertCircle size={28} className="text-warn" />
        </div>

        <div>
          <h3 className="font-display text-xl text-text-primary mb-2">
            Still there?
          </h3>
          <p className="text-text-secondary text-sm">
            Video paused — you switched away or went inactive.
          </p>
        </div>

        <button
          onClick={onDismiss}
          autoFocus
          className="px-6 py-2.5 bg-accent text-surface font-display text-sm tracking-wider uppercase rounded-lg hover:bg-accent-dim transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          Resume
        </button>
      </div>
    </div>
  );
}
