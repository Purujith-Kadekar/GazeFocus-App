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
      durationSeconds: 1200, // 20 minutes
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
      durationSeconds: 1200, // 20 min → 25% = 300s
    });

    // Not yet at 25%
    expect(store.checkMilestone(299)).toBe(false);

    // At exactly 25%
    const shouldBreak = useStore.getState().checkMilestone(300);
    expect(shouldBreak).toBe(true);

    // First milestone now triggered
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
    const first = useStore.getState().checkMilestone(155); // still past 25%
    expect(first).toBe(false); // already triggered
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
});

// ─── Watch Later ────────────────────────────────────────────────────────────────

describe("Watch later list", () => {
  const item = {
    videoId: "abc123",
    title: "Cool Video",
    channelTitle: "Great Channel",
    thumbnailUrl: "https://example.com/thumb.jpg",
    durationSeconds: 600,
    addedAt: Date.now(),
  };

  it("adds items", () => {
    useStore.getState().addToWatchLater(item);
    expect(useStore.getState().watchLater).toHaveLength(1);
  });

  it("prevents duplicate adds", () => {
    useStore.getState().addToWatchLater(item);
    useStore.getState().addToWatchLater(item);
    expect(useStore.getState().watchLater).toHaveLength(1);
  });

  it("removes items", () => {
    useStore.getState().addToWatchLater(item);
    useStore.getState().removeFromWatchLater("abc123");
    expect(useStore.getState().watchLater).toHaveLength(0);
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
    expect(settings.gazeBufferSeconds).toBe(1.5); // unchanged
  });
});
