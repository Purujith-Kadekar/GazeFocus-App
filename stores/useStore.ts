import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  GazeFocusStore,
  GazeFocusSettings,
  BreakMilestone,
  GazeStatus,
  YTPlaylist,
  Folder,
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

      // --- Library (Hierarchical) ---
      libraryFolders: {},
      libraryPlaylists: {},
      rootItems: [],

      // --- Player ---
      activeView: "player",
      currentVideo: null,
      currentPlaylistId: null,
      activePlaylistVideos: [],
      isPlaying: false,
      currentTimeSeconds: 0,
      durationSeconds: 0,
      volume: 100,
      isMuted: false,
      playlistRefreshTrigger: 0,
      sidebarWidth: 320,

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

      setActivePlaylistVideos: (videos) => set({ activePlaylistVideos: videos }),

      triggerPlaylistRefresh: () => set((s) => ({ playlistRefreshTrigger: s.playlistRefreshTrigger + 1 })),

      setCurrentPlaylistId: (id) => set({ currentPlaylistId: id }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (seconds) => set({ currentTimeSeconds: seconds }),
      setDuration: (seconds) => set({ durationSeconds: seconds }),
      setVolume: (volume) => set({ volume }),
      setIsMuted: (muted) => set({ isMuted: muted }),
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
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      // --- Library Actions ---

      createFolder: (title, parentId) => {
        const id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        set((state) => {
          const effectiveParentId = (parentId && state.libraryFolders[parentId]) ? parentId : null;

          const newFolder: Folder = {
            id,
            title,
            parentId: effectiveParentId,
            itemIds: [],
          };

          const updatedFolders = { ...state.libraryFolders, [id]: newFolder };
          let updatedRoot = [...state.rootItems];
          
          if (effectiveParentId) {
            updatedFolders[effectiveParentId] = {
              ...state.libraryFolders[effectiveParentId],
              itemIds: [...state.libraryFolders[effectiveParentId].itemIds, id],
            };
          } else {
            updatedRoot = [...state.rootItems, id];
          }
          
          return { libraryFolders: updatedFolders, rootItems: updatedRoot };
        });
      },

      moveItem: (itemId, targetFolderId) => {
        set((state) => {
          const updatedFolders = { ...state.libraryFolders };
          let updatedRoot = [...state.rootItems];
          
          // 1. Remove from current location
          if (state.rootItems.includes(itemId)) {
             updatedRoot = updatedRoot.filter(id => id !== itemId);
          } else {
             // Look in folders
             for (const fid in updatedFolders) {
               if (updatedFolders[fid].itemIds.includes(itemId)) {
                 updatedFolders[fid] = {
                   ...updatedFolders[fid],
                   itemIds: updatedFolders[fid].itemIds.filter(id => id !== itemId),
                 };
                 break;
               }
             }
          }
          
          // 2. Add to target location
          const effectiveTargetId = (targetFolderId && updatedFolders[targetFolderId]) ? targetFolderId : null;

          if (effectiveTargetId) {
            updatedFolders[effectiveTargetId] = {
              ...updatedFolders[effectiveTargetId],
              itemIds: [...updatedFolders[effectiveTargetId].itemIds, itemId],
            };
          } else {
            updatedRoot = [...updatedRoot, itemId];
          }

          // 3. Update parentId if it's a folder
          if (updatedFolders[itemId]) {
            updatedFolders[itemId] = {
              ...updatedFolders[itemId],
              parentId: effectiveTargetId,
            };
          }
          
          return { libraryFolders: updatedFolders, rootItems: updatedRoot };
        });
      },

      deleteFolder: (folderId) => {
        set((state) => {
          const updatedFolders = { ...state.libraryFolders };
          let updatedRoot = state.rootItems.filter(id => id !== folderId);
          
          const folder = updatedFolders[folderId];
          if (!folder) return state;

          const parentId = folder.parentId;

          // If it has a parent, remove from parent's itemIds
          if (parentId && updatedFolders[parentId]) {
            updatedFolders[parentId] = {
              ...updatedFolders[parentId],
              itemIds: updatedFolders[parentId].itemIds.filter(id => id !== folderId),
            };
          }
          
          // Move all children to parent or root before deleting
          if (folder.itemIds.length > 0) {
            if (parentId && updatedFolders[parentId]) {
               updatedFolders[parentId].itemIds = [
                 ...updatedFolders[parentId].itemIds,
                 ...folder.itemIds
               ];
            } else {
               updatedRoot = [...updatedRoot, ...folder.itemIds];
            }

            // Update children's parentId
            folder.itemIds.forEach(childId => {
              if (updatedFolders[childId]) {
                updatedFolders[childId] = {
                  ...updatedFolders[childId],
                  parentId: parentId && updatedFolders[parentId] ? parentId : null
                };
              }
            });
          }
          
          delete updatedFolders[folderId];
          return { libraryFolders: updatedFolders, rootItems: updatedRoot };
        });
      },

      setLibraryItems: (playlists: YTPlaylist[]) => {
        set((state) => {
          const updatedPlaylists = { ...state.libraryPlaylists };
          playlists.forEach(pl => {
            updatedPlaylists[pl.id] = pl;
          });

          // Sync playlists into the rootItems if they are not already in the library
          const currentItemIds = new Set<string>();
          Object.values(state.libraryFolders).forEach(f => f.itemIds.forEach(id => currentItemIds.add(id)));
          state.rootItems.forEach(id => currentItemIds.add(id));
          
          const newRootItems = [...state.rootItems];
          playlists.forEach(pl => {
            if (!currentItemIds.has(pl.id)) {
              newRootItems.push(pl.id);
            }
          });
          
          return { rootItems: newRootItems, libraryPlaylists: updatedPlaylists };
        });
      }
    }),
    {
      name: "gazefocus-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        currentPlaylistId: state.currentPlaylistId,
        sidebarWidth: state.sidebarWidth,
        volume: state.volume,
        isMuted: state.isMuted,
        libraryFolders: state.libraryFolders,
        libraryPlaylists: state.libraryPlaylists,
        rootItems: state.rootItems,
      }),
    }
  )
);
