import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder, Playlist, Video, Note, Todo, Channel, DueReminder } from '@/types'
import type { DashboardStats } from '@/components/dashboard/dashboard-types'

// Settings Store - Persisted for the theme script to work instantly
interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
    }
  )
)

// Auth Store
// IMPORTANT: This store must be populated from the NextAuth session on mount.
// The component that calls the NextAuth session API (e.g., via useSession or
// a /api/auth/session fetch) is responsible for calling setUser() with the
// session user data. Without this, the store will remain in its default
// unauthenticated state even if the user has a valid NextAuth session.
interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
  } | null
  setUser: (user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

// Folder Store
interface FolderState {
  folders: Folder[]
  selectedFolder: Folder | null
  setFolders: (folders: Folder[]) => void
  addFolder: (folder: Folder) => void
  updateFolder: (folder: Folder) => void
  removeFolder: (id: string) => void
  selectFolder: (folder: Folder | null) => void
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  selectedFolder: null,
  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  updateFolder: (folder) => set((state) => ({
    folders: state.folders.map((f) => (f.id === folder.id ? folder : f)),
  })),
  removeFolder: (id) => set((state) => ({
    folders: state.folders.filter((f) => f.id !== id),
  })),
  selectFolder: (folder) => set({ selectedFolder: folder }),
}))

// Playlist Store
interface PlaylistState {
  playlists: Playlist[]
  selectedPlaylist: Playlist | null
  setPlaylists: (playlists: Playlist[]) => void
  addPlaylist: (playlist: Playlist) => void
  updatePlaylist: (playlist: Playlist) => void
  removePlaylist: (id: string) => void
  selectPlaylist: (playlist: Playlist | null) => void
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlists: [],
  selectedPlaylist: null,
  setPlaylists: (playlists) => set({ playlists }),
  addPlaylist: (playlist) => set((state) => ({ playlists: [...state.playlists, playlist] })),
  updatePlaylist: (playlist) => set((state) => ({
    playlists: state.playlists.map((p) => (p.id === playlist.id ? playlist : p)),
  })),
  removePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter((p) => p.id !== id),
  })),
  selectPlaylist: (playlist) => set({ selectedPlaylist: playlist }),
}))

// Video Store
interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  updateVideo: (video: Video) => void
  removeVideo: (id: string) => void
  setCurrentVideo: (video: Video | null) => void
}

export const useVideoStore = create<VideoState>((set) => ({
  videos: [],
  currentVideo: null,
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({ videos: [...state.videos, video] })),
  updateVideo: (video) => set((state) => ({
    videos: state.videos.map((v) => (v.id === video.id ? video : v)),
  })),
  removeVideo: (id) => set((state) => ({
    videos: state.videos.filter((v) => v.id !== id),
  })),
  setCurrentVideo: (video) => set({ currentVideo: video }),
}))

// Notes Store
interface NoteState {
  notes: Note[]
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (note: Note) => void
  removeNote: (id: string) => void
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (note) => set((state) => ({
    notes: state.notes.map((n) => (n.id === note.id ? note : n)),
  })),
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
  })),
}))

// Todo Store
interface TodoState {
  todos: Todo[]
  setTodos: (todos: Todo[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (todo: Todo) => void
  removeTodo: (id: string) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),
  updateTodo: (todo) => set((state) => ({
    todos: state.todos.map((t) => (t.id === todo.id ? todo : t)),
  })),
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id),
  })),
}))

// Player Store
interface PlayerStateStore {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackSpeed: number
  videoQuality: string
  availableQualities: string[]
  isFullscreen: boolean
  isMuted: boolean
  isPausedByEyeTracking: boolean
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setPlaybackSpeed: (speed: number) => void
  setVideoQuality: (quality: string) => void
  setAvailableQualities: (qualities: string[]) => void
  setFullscreen: (fullscreen: boolean) => void
  setMuted: (muted: boolean) => void
  setPausedByEyeTracking: (paused: boolean) => void
  togglePlay: () => void
  toggleMute: () => void
}

export const usePlayerStore = create<PlayerStateStore>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackSpeed: 1,
  videoQuality: 'auto',
  availableQualities: [],
  isFullscreen: false,
  isMuted: false,
  isPausedByEyeTracking: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setVideoQuality: (quality) => set({ videoQuality: quality }),
  setAvailableQualities: (qualities) => set({ availableQualities: qualities }),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setMuted: (muted) => set({ isMuted: muted }),
  setPausedByEyeTracking: (paused) => set({ isPausedByEyeTracking: paused }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))

// Eye Tracking Store
type SensitivityMode = 'strict' | 'moderate' | 'light';

interface EyeTrackingStateStore {
  isEnabled: boolean
  isCalibrated: boolean
  isTracking: boolean
  isLookingAtScreen: boolean
  lastPosition: { x: number; y: number } | null
  calibrationProgress: number
  distractionCount: number
  thresholdSeconds: number
  noFaceDetectedTime: number
  isFaceDetected: boolean
  isFaceFront: boolean
  cameraStream: MediaStream | null
  sensitivityMode: SensitivityMode
  setEnabled: (enabled: boolean) => void
  setCalibrated: (calibrated: boolean) => void
  setTracking: (tracking: boolean) => void
  setLookingAtScreen: (looking: boolean) => void
  setLastPosition: (pos: { x: number; y: number } | null) => void
  setCalibrationProgress: (progress: number) => void
  incrementDistractionCount: () => void
  resetDistractionCount: () => void
  setThresholdSeconds: (seconds: number) => void
  setNoFaceDetectedTime: (time: number) => void
  setIsFaceDetected: (detected: boolean) => void
  setIsFaceFront: (front: boolean) => void
  setCameraStream: (stream: MediaStream | null) => void
  setSensitivityMode: (mode: SensitivityMode) => void
}

export const useEyeTrackingStore = create<EyeTrackingStateStore>((set, get) => ({
  isEnabled: true,
  isCalibrated: false,
  isTracking: false,
  // Default is false — before tracking starts, the system should not assume
  // the user is looking at the screen. Only set to true once the eye-tracking
  // engine confirms gaze presence.
  isLookingAtScreen: false,
  lastPosition: null,
  calibrationProgress: 0,
  distractionCount: 0,
  thresholdSeconds: 3,
  noFaceDetectedTime: 0,
  isFaceDetected: false,
  isFaceFront: false,
  cameraStream: null,
  sensitivityMode: 'moderate',
  setEnabled: (enabled) => {
    if (!enabled) {
      const stream = get().cameraStream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      set({
        isEnabled: false,
        isTracking: false,
        isLookingAtScreen: false,
        isFaceDetected: false,
        cameraStream: null,
      })
      return
    }
    set({ isEnabled: true })
  },
  setCalibrated: (calibrated) => set({ isCalibrated: calibrated }),
  setTracking: (tracking) => set({ isTracking: tracking }),
  setLookingAtScreen: (looking) => set({ isLookingAtScreen: looking }),
  setLastPosition: (pos) => set({ lastPosition: pos }),
  setCalibrationProgress: (progress) => set({ calibrationProgress: progress }),
  incrementDistractionCount: () => set((state) => ({ distractionCount: state.distractionCount + 1 })),
  resetDistractionCount: () => set({ distractionCount: 0 }),
  setThresholdSeconds: (seconds) => set({ thresholdSeconds: seconds }),
  setNoFaceDetectedTime: (time) => set({ noFaceDetectedTime: time }),
  setIsFaceDetected: (detected) => set({ isFaceDetected: detected }),
  setIsFaceFront: (front) => set({ isFaceFront: front }),
  setCameraStream: (stream) => {
    const previousStream = get().cameraStream
    if (previousStream && previousStream !== stream) {
      previousStream.getTracks().forEach((track) => track.stop())
    }
    set({ cameraStream: stream })
  },
  setSensitivityMode: (mode) => set({ sensitivityMode: mode }),
}))

// Inactivity Store
interface InactivityStateStore {
  isActive: boolean
  lastActivityTime: number
  timeUntilAlert: number
  isAlerting: boolean
  timeoutSeconds: number
  setActive: (active: boolean) => void
  setLastActivityTime: (time: number) => void
  setTimeUntilAlert: (time: number) => void
  setAlerting: (alerting: boolean) => void
  setTimeoutSeconds: (seconds: number) => void
}

export const useInactivityStore = create<InactivityStateStore>((set) => ({
  isActive: true,
  lastActivityTime: Date.now(),
  timeUntilAlert: 30,
  isAlerting: false,
  timeoutSeconds: 30,
  setActive: (active) => set({ isActive: active }),
  setLastActivityTime: (time) => set({ lastActivityTime: time }),
  setTimeUntilAlert: (time) => set({ timeUntilAlert: time }),
  setAlerting: (alerting) => set({ isAlerting: alerting }),
  setTimeoutSeconds: (seconds) => set({ timeoutSeconds: seconds }),
}))

// UI Store
interface UIState {
  isSidebarOpen: boolean
  isDashboardBootLoading: boolean
  isGlobalLoading: boolean
  isSearchModalOpen: boolean
  isAddModalOpen: boolean
  isSettingsOpen: boolean
  isCalibrationModalOpen: boolean
  currentView: 'dashboard' | 'folder' | 'playlist' | 'video' | 'settings' | 'search'
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setGlobalLoading: (loading: boolean) => void
  setSearchModalOpen: (open: boolean) => void
  setAddModalOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setCalibrationModalOpen: (open: boolean) => void
  setDashboardBootLoading: (loading: boolean) => void
  setCurrentView: (view: UIState['currentView']) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isDashboardBootLoading: false,
      isGlobalLoading: false,
      isSearchModalOpen: false,
      isAddModalOpen: false,
      isSettingsOpen: false,
      isCalibrationModalOpen: false,
      currentView: 'dashboard',
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
      setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
      setAddModalOpen: (open) => set({ isAddModalOpen: open }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setCalibrationModalOpen: (open) => set({ isCalibrationModalOpen: open }),
      setDashboardBootLoading: (loading) => set({ isDashboardBootLoading: loading }),
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)

// Dashboard Store
// Use the shared DashboardStats type from dashboard-types.ts
type DashboardStatsData = DashboardStats

interface DashboardState {
  stats: DashboardStatsData | null
  recentVideos: Video[]
  recentFolders: Folder[]
  importantNotes: Note[]
  setStats: (stats: DashboardStatsData) => void
  setRecentVideos: (videos: Video[]) => void
  setRecentFolders: (folders: Folder[]) => void
  setImportantNotes: (notes: Note[]) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  recentVideos: [],
  recentFolders: [],
  importantNotes: [],
  setStats: (stats) => set({ stats }),
  setRecentVideos: (videos) => set({ recentVideos: videos }),
  setRecentFolders: (folders) => set({ recentFolders: folders }),
  setImportantNotes: (notes) => set({ importantNotes: notes }),
}))

// Watch Break Store
interface WatchBreakStateStore {
  isEnabled: boolean
  breakMinutes: number
  breakDurationMinutes: number
  setEnabled: (enabled: boolean) => void
  setBreakMinutes: (minutes: number) => void
  setBreakDurationMinutes: (minutes: number) => void
}

export const useWatchBreakStore = create<WatchBreakStateStore>((set) => ({
  isEnabled: true,
  breakMinutes: 45,
  breakDurationMinutes: 1,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setBreakMinutes: (minutes) => set({ breakMinutes: minutes }),
  setBreakDurationMinutes: (minutes) => set({ breakDurationMinutes: minutes }),
}))

// Channel Store
interface ChannelState {
  channels: Channel[]
  selectedChannel: Channel | null
  setChannels: (channels: Channel[]) => void
  addChannel: (channel: Channel) => void
  updateChannel: (channel: Channel) => void
  removeChannel: (id: string) => void
  selectChannel: (channel: Channel | null) => void
  setChannelLiveStatus: (id: string, isLive: boolean, liveVideoId?: string | null, liveTitle?: string | null) => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  selectedChannel: null,
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  updateChannel: (channel) => set((state) => ({
    channels: state.channels.map((c) => (c.id === channel.id ? channel : c)),
  })),
  removeChannel: (id) => set((state) => ({
    channels: state.channels.filter((c) => c.id !== id),
  })),
  selectChannel: (channel) => set({ selectedChannel: channel }),
  setChannelLiveStatus: (id, isLive, liveVideoId = null, liveTitle = null) => set((state) => ({
    channels: state.channels.map((c) =>
      c.id === id ? { ...c, isLive, liveVideoId, liveTitle } : c
    ),
  })),
}))

// Agent Store — tracks the daemon loop state and due reminders
interface AgentState {
  daemonActive: boolean
  dueReminders: DueReminder[]
  upcomingReminders: { id: string; todoId: string; kind: string; fireAt: string; title: string; deadlineAt: string | null }[]
  focusTodoId: string | null
  lastPollAt: number | null
  sessionStartedAtMs: number

  setDaemonActive: (active: boolean) => void
  setDueReminders: (reminders: DueReminder[]) => void
  addDueReminder: (reminder: DueReminder) => void
  removeDueReminder: (id: string) => void
  clearDueReminders: () => void
  setUpcomingReminders: (reminders: AgentState['upcomingReminders']) => void
  setFocusTodoId: (todoId: string | null) => void
  setLastPollAt: (ts: number) => void
  initSessionStart: () => void
}

export const useAgentStore = create<AgentState>((set) => ({
  daemonActive: false,
  dueReminders: [],
  upcomingReminders: [],
  focusTodoId: null,
  lastPollAt: null,
  sessionStartedAtMs: Date.now(),

  setDaemonActive: (active) => set({ daemonActive: active }),
  setDueReminders: (reminders) => set({ dueReminders: reminders }),
  addDueReminder: (reminder) => set((state) => ({
    dueReminders: [...state.dueReminders, reminder],
  })),
  removeDueReminder: (id) => set((state) => ({
    dueReminders: state.dueReminders.filter((r) => r.id !== id),
  })),
  clearDueReminders: () => set({ dueReminders: [] }),
  setUpcomingReminders: (reminders) => set({ upcomingReminders: reminders }),
  setFocusTodoId: (todoId) => set({ focusTodoId: todoId }),
  setLastPollAt: (ts) => set({ lastPollAt: ts }),
  initSessionStart: () => set({ sessionStartedAtMs: Date.now() }),
}))
