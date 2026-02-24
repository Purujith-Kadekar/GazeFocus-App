/**
 * GazeFocus - Store Unit Tests
 * Run with: npm run test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/stores/useStore";

// Reset store before each test
beforeEach(() => {
  const store = useStore.getState();
  store.updateSettings({
    gazeEnabled: true,
    gazeBufferSeconds: 1.5,
    inactivityThresholdSeconds: 45,
    breakDurationSeconds: 120,
    searchLeashMinutes: 15,
    searchLeashWarningBeep: true,
    searchLeashCriticalBeep: true,
    searchLeashLockBeep: true,
    onboardingComplete: false,
  });
  store.setCurrentVideo(null);
  store.resetSearchLeash();
  store.endBreak();
});

// ─── Video & Milestones ────────────────────────────────────────────────────────

describe("Video milestone logic", () => {
  it("builds 4 milestones on setCurrentVideo", () => {
    const { setCurrentVideo, milestones: initialMilestones } = useStore.getState();
    expect(initialMilestones).toHaveLength(0);

    setCurrentVideo({
      id: "test1",
      title: "Test Video",
      channelTitle: "Channel",
      description: "",
      thumbnails: {},
      publishedAt: "",
      duration: "",
      durationSeconds: 1200,
    });

    const { milestones } = useStore.getState();
    expect(milestones).toHaveLength(4);
    expect(milestones.map((m) => m.percent)).toEqual([25, 50, 75, 100]);
    expect(milestones.every((m) => !m.triggered)).toBe(true);
  });

  it("checkMilestone triggers at 25% of video", () => {
    const store = useStore.getState();
    store.setCurrentVideo({
      id: "t2",
      title: "Test",
      channelTitle: "",
      description: "",
      thumbnails: {},
      publishedAt: "",
      duration: "",
      durationSeconds: 1200, // 25% = 300s
    });

    expect(store.checkMilestone(299)).toBe(false);

    const shouldBreak = useStore.getState().checkMilestone(300);
    expect(shouldBreak).toBe(true);

    const { milestones } = useStore.getState();
    expect(milestones[0].triggered).toBe(true);
    expect(milestones[1].triggered).toBe(false);
  });

  it("does not double-trigger same milestone", () => {
    const store = useStore.getState();
    store.setCurrentVideo({
      id: "t3",
      title: "Test",
      channelTitle: "",
      description: "",
      thumbnails: {},
      publishedAt: "",
      duration: "",
      durationSeconds: 600,
    });

    store.checkMilestone(150); // 25%
    const second = useStore.getState().checkMilestone(155);
    expect(second).toBe(false);
  });
});

// ─── Search Leash ──────────────────────────────────────────────────────────────

describe("Search leash", () => {
  it("starts inactive", () => {
    const { searchLeash } = useStore.getState();
    expect(searchLeash.active).toBe(false);
    expect(searchLeash.locked).toBe(false);
  });

  it("activates on startSearchLeash", () => {
    useStore.getState().startSearchLeash();
    const { searchLeash } = useStore.getState();
    expect(searchLeash.active).toBe(true);
    expect(searchLeash.remainingSeconds).toBe(15 * 60);
  });

  it("ticks down correctly", () => {
    useStore.getState().startSearchLeash();
    useStore.getState().tickSearchLeash();
    useStore.getState().tickSearchLeash();
    const { searchLeash } = useStore.getState();
    expect(searchLeash.remainingSeconds).toBe(15 * 60 - 2);
  });

  it("locks at 0 remaining", () => {
    useStore.getState().startSearchLeash();
    useStore.getState().lockSearch();
    const { searchLeash } = useStore.getState();
    expect(searchLeash.locked).toBe(true);
    expect(searchLeash.remainingSeconds).toBe(0);
  });

  it("resets cleanly", () => {
    useStore.getState().startSearchLeash();
    useStore.getState().lockSearch();
    useStore.getState().resetSearchLeash();
    const { searchLeash } = useStore.getState();
    expect(searchLeash.active).toBe(false);
    expect(searchLeash.locked).toBe(false);
    expect(searchLeash.remainingSeconds).toBe(15 * 60);
  });

  it("respects custom searchLeashMinutes setting", () => {
    useStore.getState().updateSettings({ searchLeashMinutes: 10 });
    useStore.getState().startSearchLeash();
    const { searchLeash } = useStore.getState();
    expect(searchLeash.remainingSeconds).toBe(10 * 60);
  });

  it("does not tick when locked", () => {
    useStore.getState().startSearchLeash();
    useStore.getState().lockSearch();
    useStore.getState().tickSearchLeash();
    const { searchLeash } = useStore.getState();
    expect(searchLeash.remainingSeconds).toBe(0); // unchanged
  });
});

// ─── Break Logic ───────────────────────────────────────────────────────────────

describe("Break logic", () => {
  it("triggers break and sets timer", () => {
    useStore.getState().triggerBreak();
    const { isOnBreak, breakEndsAt } = useStore.getState();
    expect(isOnBreak).toBe(true);
    expect(breakEndsAt).toBeGreaterThan(Date.now());
  });

  it("break ends at correct time based on breakDurationSeconds", () => {
    useStore.getState().updateSettings({ breakDurationSeconds: 120 });
    const before = Date.now();
    useStore.getState().triggerBreak();
    const { breakEndsAt } = useStore.getState();
    expect(breakEndsAt).toBeGreaterThanOrEqual(before + 120_000);
  });

  it("ends break cleanly", () => {
    useStore.getState().triggerBreak();
    useStore.getState().endBreak();
    const { isOnBreak, breakEndsAt } = useStore.getState();
    expect(isOnBreak).toBe(false);
    expect(breakEndsAt).toBeNull();
  });
});

// ─── Settings ──────────────────────────────────────────────────────────────────

describe("Settings", () => {
  it("updates individual setting", () => {
    useStore.getState().updateSettings({ gazeBufferSeconds: 3 });
    expect(useStore.getState().settings.gazeBufferSeconds).toBe(3);
  });

  it("partial update preserves other settings", () => {
    useStore.getState().updateSettings({ gazeEnabled: false });
    const { settings } = useStore.getState();
    expect(settings.gazeEnabled).toBe(false);
    expect(settings.gazeBufferSeconds).toBe(1.5);
  });

  it("search leash beep settings default to true", () => {
    const { settings } = useStore.getState();
    expect(settings.searchLeashWarningBeep).toBe(true);
    expect(settings.searchLeashCriticalBeep).toBe(true);
    expect(settings.searchLeashLockBeep).toBe(true);
  });

  it("can disable individual beeps", () => {
    useStore.getState().updateSettings({ searchLeashWarningBeep: false });
    const { settings } = useStore.getState();
    expect(settings.searchLeashWarningBeep).toBe(false);
    expect(settings.searchLeashCriticalBeep).toBe(true); // unchanged
    expect(settings.searchLeashLockBeep).toBe(true);    // unchanged
  });
});

// ─── Library & Folders ─────────────────────────────────────────────────────────

describe("Library & Folders", () => {
  beforeEach(() => {
    // Clear library for each test
    const store = useStore.getState();
    // @ts-ignore
    useStore.setState({ libraryFolders: {}, rootItems: [], libraryPlaylists: {} });
  });

  it("creates a folder at root", () => {
    const store = useStore.getState();
    store.createFolder("Test Folder", null);

    const { libraryFolders, rootItems } = useStore.getState();
    const folderIds = Object.keys(libraryFolders);
    expect(folderIds).toHaveLength(1);
    expect(rootItems).toContain(folderIds[0]);
    expect(libraryFolders[folderIds[0]].title).toBe("Test Folder");
    expect(libraryFolders[folderIds[0]].parentId).toBeNull();
  });

  it("creates a nested folder", () => {
    const store = useStore.getState();
    store.createFolder("Parent", null);
    const parentId = Object.keys(useStore.getState().libraryFolders)[0];

    store.createFolder("Child", parentId);
    const { libraryFolders, rootItems } = useStore.getState();
    const childId = Object.keys(libraryFolders).find(id => id !== parentId)!;

    expect(libraryFolders[parentId].itemIds).toContain(childId);
    expect(libraryFolders[childId].parentId).toBe(parentId);
    expect(rootItems).not.toContain(childId);
  });

  it("moves a folder to another folder", () => {
    const store = useStore.getState();
    store.createFolder("F1", null);
    store.createFolder("F2", null);
    const ids = Object.keys(useStore.getState().libraryFolders);
    const f1Id = ids.find(id => useStore.getState().libraryFolders[id].title === "F1")!;
    const f2Id = ids.find(id => useStore.getState().libraryFolders[id].title === "F2")!;

    store.moveItem(f1Id, f2Id);

    const { libraryFolders, rootItems } = useStore.getState();
    expect(rootItems).not.toContain(f1Id);
    expect(libraryFolders[f2Id].itemIds).toContain(f1Id);
    expect(libraryFolders[f1Id].parentId).toBe(f2Id);
  });

  it("updates parentId of children when folder is deleted", () => {
    const store = useStore.getState();
    store.createFolder("Parent", null);
    const parentId = Object.keys(useStore.getState().libraryFolders)[0];
    store.createFolder("Child", parentId);
    const childId = Object.keys(useStore.getState().libraryFolders).find(id => id !== parentId)!;

    store.deleteFolder(parentId);

    const { libraryFolders, rootItems } = useStore.getState();
    expect(libraryFolders[parentId]).toBeUndefined();
    expect(rootItems).toContain(childId);
    expect(libraryFolders[childId].parentId).toBeNull();
  });

  it("populates libraryPlaylists on setLibraryItems", () => {
    const store = useStore.getState();
    const mockPlaylist = { id: "pl1", title: "My Playlist" } as any;
    store.setLibraryItems([mockPlaylist]);

    const { libraryPlaylists, rootItems } = useStore.getState();
    expect(libraryPlaylists["pl1"]).toBeDefined();
    expect(libraryPlaylists["pl1"].title).toBe("My Playlist");
    expect(rootItems).toContain("pl1");
  });
});
