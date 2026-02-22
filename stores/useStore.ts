import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  GazeFocusStore,
  GazeFocusSettings,
  WatchLaterItem,
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
  onboardingComplete: false,
  theme: "dark",
};

// ─── Milestone Definitions ─────────────────────────────────────────────────────

const buildMilestones = (durationSeconds: number): BreakMilestone[] =>
  [25, 50, 75, 100].map((percent) => ({
    percent,
    triggered: false,
    // milestone fires at this second mark
    targetSeconds: Math.floor((percent / 100) * durationSeconds),
  }));

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<GazeFocusStore>()(
  persist(
    (set, get) => ({
      // --- Auth ---
      isAuthenticated: false,

      // --- Player ---
      currentVideo: null,
      currentPlaylistId: null,
      isPlaying: false,
      currentTimeSeconds: 0,

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

      // --- Watch Later ---
      watchLater: [],

      // --- Settings ---
      settings: DEFAULT_SETTINGS,

      // ─── Actions ──────────────────────────────────────────────────────────────

      setCurrentVideo: (video) => {
        set({ currentVideo: video, currentTimeSeconds: 0 });
        // Re-build milestones for the new video
        if (video) {
          set({ milestones: buildMilestones(video.durationSeconds) });
        }
      },

      setCurrentPlaylistId: (id) => set({ currentPlaylistId: id }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      setCurrentTime: (seconds) => set({ currentTimeSeconds: seconds }),

      setGazeStatus: (status) => set({ gazeStatus: status }),

      setGazeAwayStart: (ts) => set({ gazeAwayStartedAt: ts }),

      // Trigger a 2-minute wellness break
      triggerBreak: () => {
        const { settings } = get();
        const endsAt = Date.now() + settings.breakDurationSeconds * 1000;
        set({ isOnBreak: true, breakEndsAt: endsAt, isPlaying: false });
      },

      endBreak: () =>
        set({ isOnBreak: false, breakEndsAt: null }),

      // Build milestones when video loads
      updateMilestones: (durationSeconds) =>
        set({ milestones: buildMilestones(durationSeconds) }),

      /**
       * Check if current playback position has crossed an un-triggered milestone.
       * Returns true if a break should fire (and marks milestone as triggered).
       */
      checkMilestone: (currentSeconds) => {
        const { milestones, currentVideo } = get();
        if (!currentVideo) return false;

        const duration = currentVideo.durationSeconds;
        if (duration <= 0) return false;

        // Find first untriggered milestone whose target has been reached
        const idx = milestones.findIndex(
          (m) =>
            !m.triggered &&
            currentSeconds >= (m.percent / 100) * duration
        );

        if (idx === -1) return false;

        // Mark it triggered
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
        const { searchLeash } = get();
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
        set({
          isTabActive: active,
          tabInactiveAt: active ? null : Date.now(),
        });
      },

      // --- Watch Later ---

      addToWatchLater: (item) => {
        const { watchLater } = get();
        // Prevent duplicates
        if (watchLater.some((w) => w.videoId === item.videoId)) return;
        set({ watchLater: [item, ...watchLater] });
      },

      removeFromWatchLater: (videoId) =>
        set((s) => ({
          watchLater: s.watchLater.filter((w) => w.videoId !== videoId),
        })),

      // --- Settings ---

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: "gazefocus-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist these keys — don't persist transient UI state
      partialize: (state) => ({
        watchLater: state.watchLater,
        settings: state.settings,
        currentPlaylistId: state.currentPlaylistId,
      }),
    }
  )
);
