// ============================================================
// GazeFocus - Shared TypeScript Types
// ============================================================

// --- YouTube API Types ---

export interface YTThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YTPlaylist {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default?: YTThumbnail;
    medium?: YTThumbnail;
    high?: YTThumbnail;
  };
  itemCount: number;
  channelTitle: string;
  privacy: "public" | "private" | "unlisted";
  isSpecial?: boolean; // true for Watch Later, Liked Videos
}

export interface YTVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default?: YTThumbnail;
    medium?: YTThumbnail;
    high?: YTThumbnail;
  };
  channelTitle: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  playlistItemId?: string;
}

export interface SearchResult extends YTVideo {
  isSearchResult: true;
}

// --- Gaze Tracking Types ---

export type GazeStatus =
  | "active"
  | "away"
  | "paused"
  | "disabled"
  | "no-camera"
  | "loading";

// --- Break / Milestone Types ---

export interface BreakMilestone {
  percent: number;
  triggered: boolean;
  breakStartedAt?: number;
}

// --- Search Leash Types ---

export interface SearchLeashState {
  active: boolean;
  startedAt: number | null;
  remainingSeconds: number;
  locked: boolean;
}

// --- Settings Types ---

export interface GazeFocusSettings {
  gazeEnabled: boolean;
  gazeBufferSeconds: number;
  inactivityThresholdSeconds: number;
  breakDurationSeconds: number;
  searchLeashMinutes: number;
  // Search leash alert settings
  searchLeashWarningBeep: boolean;       // beep at 5min warning
  searchLeashCriticalBeep: boolean;      // beep at 1min warning
  searchLeashLockBeep: boolean;          // beep when locked
  onboardingComplete: boolean;
  theme: "dark" | "system";
}

// --- Global Store State ---

export interface GazeFocusStore {
  // Auth
  isAuthenticated: boolean;

  // Current player state
  activeView: "player" | "search" | "settings";
  currentVideo: YTVideo | null;
  currentPlaylistId: string | null;
  activePlaylistVideos: YTVideo[]; // For "Next Video" logic
  isPlaying: boolean;
  currentTimeSeconds: number;
  playlistRefreshTrigger: number;
  sidebarWidth: number;

  // Gaze
  gazeStatus: GazeStatus;
  gazeAwayStartedAt: number | null;

  // Break milestones
  milestones: BreakMilestone[];
  isOnBreak: boolean;
  breakEndsAt: number | null;

  // Search leash
  searchLeash: SearchLeashState;

  // Inactivity
  isTabActive: boolean;
  tabInactiveAt: number | null;

  // Settings
  settings: GazeFocusSettings;

  // Actions
  setActiveView: (view: "player" | "search" | "settings") => void;
  setCurrentVideo: (video: YTVideo | null) => void;
  setActivePlaylistVideos: (videos: YTVideo[]) => void;
  triggerPlaylistRefresh: () => void;
  setCurrentPlaylistId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (seconds: number) => void;
  setGazeStatus: (status: GazeStatus) => void;
  setGazeAwayStart: (ts: number | null) => void;
  triggerBreak: () => void;
  endBreak: () => void;
  updateMilestones: (durationSeconds: number) => void;
  checkMilestone: (currentSeconds: number) => boolean;
  startSearchLeash: () => void;
  tickSearchLeash: () => void;
  lockSearch: () => void;
  resetSearchLeash: () => void;
  setTabActive: (active: boolean) => void;
  setSidebarWidth: (width: number) => void;
  updateSettings: (partial: Partial<GazeFocusSettings>) => void;
}

// --- next-auth session extension ---
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
