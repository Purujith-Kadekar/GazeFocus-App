import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  GazeFocusStore,
  GazeFocusSettings,
  BreakMilestone,
  GazeStatus,
} from "@/types";

// ─── Default Settings ──────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: GazeFocusSettings = {
  gazeEnabled: true,
  gazeBufferSeconds: 1.5,
  inactivityThresholdSeconds: 45,
  breakDurationSeconds: 120,
  searchLeashMinutes: 15,
  searchLeashWarningBeep: true,
  searchLeashCriticalBeep: true,
  searchLeashLockBeep: true,
  onboardingComplete: false,
  theme: "dark",
};

// ─── Milestone Builder ─────────────────────────────────────────────────────────

const buildMilestones = (durationSeconds: number): BreakMilestone[] =>
  [25, 50, 75, 100].map((percent) => ({
    percent,
    triggered: false,
    targetSeconds: Math.floor((percent / 100) * durationSeconds),
  }));

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<GazeFocusStore>()(
  persist(
    (set, get) => ({
      // --- Auth ---
      isAuthenticated: false,

      // --- Player ---
      activeView: "player",
      currentVideo: null,
      currentPlaylistId: null,
      isPlaying: false,
      currentTimeSeconds: 0,
      playlistRefreshTrigger: 0,

      // --- Gaze ---
      gazeStatus: "loading" as GazeStatus,
      gazeAwayStartedAt: null,

      // --- Breaks ---
      milestones: [],
      isOnBreak: false,
      breakEndsAt: null,

      // --- Search leash ---
      searchLeash: {
        active: false,
        startedAt: null,
        remainingSeconds: DEFAULT_SETTINGS.searchLeashMinutes * 60,
        locked: false,
      },

      // --- Inactivity ---
      isTabActive: true,
      tabInactiveAt: null,

      // --- Settings ---
      settings: DEFAULT_SETTINGS,

      // ─── Actions ──────────────────────────────────────────────────────────────

      setActiveView: (view) => set({ activeView: view }),

      setCurrentVideo: (video) => {
        set({ currentVideo: video, currentTimeSeconds: 0 });
        if (video) {
          set({ milestones: buildMilestones(video.durationSeconds) });
        }
      },

      triggerPlaylistRefresh: () => set((s) => ({ playlistRefreshTrigger: s.playlistRefreshTrigger + 1 })),

      setCurrentPlaylistId: (id) => set({ currentPlaylistId: id }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (seconds) => set({ currentTimeSeconds: seconds }),
      setGazeStatus: (status) => set({ gazeStatus: status }),
      setGazeAwayStart: (ts) => set({ gazeAwayStartedAt: ts }),

      triggerBreak: () => {
        const { settings } = get();
        const endsAt = Date.now() + settings.breakDurationSeconds * 1000;
        set({ isOnBreak: true, breakEndsAt: endsAt, isPlaying: false });
      },

      endBreak: () => set({ isOnBreak: false, breakEndsAt: null }),

      updateMilestones: (durationSeconds) =>
        set({ milestones: buildMilestones(durationSeconds) }),

      checkMilestone: (currentSeconds) => {
        const { milestones, currentVideo } = get();
        if (!currentVideo) return false;
        const duration = currentVideo.durationSeconds;
        if (duration <= 0) return false;

        const idx = milestones.findIndex(
          (m) => !m.triggered && currentSeconds >= (m.percent / 100) * duration
        );
        if (idx === -1) return false;

        const updated = milestones.map((m, i) =>
          i === idx ? { ...m, triggered: true } : m
        );
        set({ milestones: updated });
        return true;
      },

      // --- Search Leash ---

      startSearchLeash: () => {
        const { settings } = get();
        set({
          searchLeash: {
            active: true,
            startedAt: Date.now(),
            remainingSeconds: settings.searchLeashMinutes * 60,
            locked: false,
          },
        });
      },

      tickSearchLeash: () => {
        const { searchLeash, settings } = get();
        if (!searchLeash.active || searchLeash.locked) return;
        const newRemaining = Math.max(0, searchLeash.remainingSeconds - 1);
        set({
          searchLeash: {
            ...searchLeash,
            remainingSeconds: newRemaining,
            locked: newRemaining === 0,
          },
        });
      },

      lockSearch: () =>
        set((s) => ({
          searchLeash: { ...s.searchLeash, locked: true, remainingSeconds: 0 },
        })),

      resetSearchLeash: () => {
        const { settings } = get();
        set({
          searchLeash: {
            active: false,
            startedAt: null,
            remainingSeconds: settings.searchLeashMinutes * 60,
            locked: false,
          },
        });
      },

      // --- Inactivity ---
      setTabActive: (active) => {
        set({ isTabActive: active, tabInactiveAt: active ? null : Date.now() });
      },

      // --- Settings ---
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: "gazefocus-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist settings and current playlist — no local watch later anymore
      partialize: (state) => ({
        settings: state.settings,
        currentPlaylistId: state.currentPlaylistId,
      }),
    }
  )
);
