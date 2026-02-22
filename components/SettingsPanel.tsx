"use client";

import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import { Eye, Timer, Bell, RotateCcw } from "lucide-react";

export function SettingsPanel() {
  const { settings, updateSettings } = useStore();

  const reset = () => {
    if (confirm("Reset all settings to defaults?")) {
      updateSettings({
        gazeEnabled: true,
        gazeBufferSeconds: 1.5,
        inactivityThresholdSeconds: 45,
        breakDurationSeconds: 120,
        searchLeashMinutes: 15,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl tracking-wider text-text-primary">
            Settings
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Customize GazeFocus behavior. All changes save instantly.
          </p>
        </div>

        {/* ─── Gaze Tracking ────────────────────────────────────────────── */}
        <SettingsSection icon={Eye} title="Gaze Tracking">
          <SettingsRow
            label="Enable Gaze Tracking"
            description="Pause video when you look away from the screen"
          >
            <Toggle
              checked={settings.gazeEnabled}
              onChange={(v) => updateSettings({ gazeEnabled: v })}
            />
          </SettingsRow>

          <SettingsRow
            label="Look-Away Buffer"
            description={`How long you can look away before pause triggers: ${settings.gazeBufferSeconds}s`}
            disabled={!settings.gazeEnabled}
          >
            <Slider
              min={1}
              max={4}
              step={0.5}
              value={settings.gazeBufferSeconds}
              onChange={(v) => updateSettings({ gazeBufferSeconds: v })}
              disabled={!settings.gazeEnabled}
              formatLabel={(v) => `${v}s`}
            />
          </SettingsRow>
        </SettingsSection>

        {/* ─── Wellness Breaks ──────────────────────────────────────────── */}
        <SettingsSection icon={Timer} title="Wellness Breaks">
          <SettingsRow
            label="Break Duration"
            description={`How long each milestone break lasts: ${Math.floor(settings.breakDurationSeconds / 60)} min ${settings.breakDurationSeconds % 60}s`}
          >
            <Slider
              min={60}
              max={300}
              step={30}
              value={settings.breakDurationSeconds}
              onChange={(v) => updateSettings({ breakDurationSeconds: v })}
              formatLabel={(v) => `${Math.floor(v / 60)}m${v % 60 > 0 ? `${v % 60}s` : ""}`}
            />
          </SettingsRow>

          <SettingsRow
            label="Break Milestones"
            description="Breaks always fire at 25%, 50%, 75%, and 100% of video duration"
          >
            <div className="flex gap-1.5">
              {[25, 50, 75, 100].map((p) => (
                <span
                  key={p}
                  className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-xs font-display rounded"
                >
                  {p}%
                </span>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* ─── Inactivity ────────────────────────────────────────────────── */}
        <SettingsSection icon={Bell} title="Tab Inactivity Alert">
          <SettingsRow
            label="Inactivity Threshold"
            description={`Audio beep + pause after: ${settings.inactivityThresholdSeconds}s`}
          >
            <Slider
              min={30}
              max={120}
              step={5}
              value={settings.inactivityThresholdSeconds}
              onChange={(v) => updateSettings({ inactivityThresholdSeconds: v })}
              formatLabel={(v) => `${v}s`}
            />
          </SettingsRow>
        </SettingsSection>

        {/* ─── Search Leash ──────────────────────────────────────────────── */}
        <SettingsSection icon={Timer} title="Search Leash">
          <SettingsRow
            label="Search Time Limit"
            description={`Lock search after: ${settings.searchLeashMinutes} minutes`}
          >
            <Slider
              min={5}
              max={30}
              step={5}
              value={settings.searchLeashMinutes}
              onChange={(v) => updateSettings({ searchLeashMinutes: v })}
              formatLabel={(v) => `${v}m`}
            />
          </SettingsRow>
        </SettingsSection>

        {/* ─── Reset ────────────────────────────────────────────────────── */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-danger border border-border hover:border-danger/30 text-sm font-display tracking-wider uppercase rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-accent" />
        <h3 className="font-display text-xs tracking-widest uppercase text-text-secondary">
          {title}
        </h3>
      </div>
      <div className="space-y-4 pl-6 border-l border-border">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
  disabled,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-8", disabled && "opacity-40")}>
      <div className="flex-1">
        <p className="text-text-primary text-sm">{label}</p>
        <p className="text-text-muted text-xs mt-0.5">{description}</p>
      </div>
      <div className="shrink-0 mt-0.5">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50",
        checked ? "bg-accent" : "bg-surface-4"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function Slider({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  formatLabel,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  formatLabel?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-accent cursor-pointer"
      />
      {formatLabel && (
        <span className="text-text-secondary text-xs font-display w-10 text-right tabular-nums">
          {formatLabel(value)}
        </span>
      )}
    </div>
  );
}
