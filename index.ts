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
  duration: string;      // ISO 8601 duration e.g. "PT25M30S"
  durationSeconds: number;
  playlistItemId?: string; // for playlist item operations
}

export interface SearchResult extends YTVideo {
  isSearchResult: true;
}

// --- Gaze Tracking Types ---

export type GazeStatus =
  | "active"      // looking at screen
  | "away"        // looking away
  | "paused"      // gaze-triggered pause
  | "disabled"    // user disabled tracking
  | "no-camera"   // no webcam available
  | "loading";    // model loading

// --- Break / Milestone Types ---

export interface BreakMilestone {
  percent: number;       // 25, 50, 75, 100
  triggered: boolean;
  breakStartedAt?: number;
}

// --- Search Leash Types ---

export interface SearchLeashState {
  active: boolean;
  startedAt: number | null;   // timestamp
  remainingSeconds: number;
  locked: boolean;
}

// --- Watch Later Types ---

export interface WatchLaterItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  addedAt: number;
}

// --- Settings Types ---

export interface GazeFocusSettings {
  gazeEnabled: boolean;
  gazeBufferSeconds: number;       // 1-4 seconds before pause
  inactivityThresholdSeconds: number; // 30-60 seconds
  breakDurationSeconds: number;    // default 120 (2 min)
  searchLeashMinutes: number;      // default 15
  onboardingComplete: boolean;
  theme: "dark" | "system";
}

// --- Global Store State ---

export interface GazeFocusStore {
  // Auth
  isAuthenticated: boolean;

  // Current player state
  currentVideo: YTVideo | null;
  currentPlaylistId: string | null;
  isPlaying: boolean;
  currentTimeSeconds: number;

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

  // Watch Later
  watchLater: WatchLaterItem[];

  // Settings
  settings: GazeFocusSettings;

  // Actions
  setCurrentVideo: (video: YTVideo | null) => void;
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
  addToWatchLater: (item: WatchLaterItem) => void;
  removeFromWatchLater: (videoId: string) => void;
  updateSettings: (partial: Partial<GazeFocusSettings>) => void;
}

// --- next-auth session extension ---
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
