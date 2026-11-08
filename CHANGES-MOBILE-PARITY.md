# Mobile Parity Changes — GazeFocus Webapp

This pass brings the mobile (and tablet) experience to feature parity
with the desktop mode. The pattern in this codebase is viewport-based
component trees (`Dashboard.tsx` renders `DashboardMobile` /
`DashboardTablet` below 768px / 1024px, and `MainLayout` swaps in
`MobileMainLayout` below 768px). The desktop tree had a dozen features
the mobile tree simply never rendered.

## The reported bug: typing tasks on the home page

**Desktop**: the dashboard renders `QuickAddBar` — a natural-language
task input. Typing *"Physics exam on november 19th"* parses the date
(server-side chrono-node via `/api/agent/parse`), previews the task
("Physics exam", matched "november 19th"), and creates it on the
user's calendar via `/api/agent/reminders`.

**Mobile before**: `DashboardMobile` never rendered `QuickAddBar` (nor
`TodoList`, `AgentBriefingCard`, ...). The calendar page's quick-add
block was inside `hidden md:block`, so phones had no way to type a
task with a parsed date at all.

**Mobile now**: the dashboard has a "Quick add" card with the full
`QuickAddBar` (live parse preview, smart "when?" chips when no date is
typed, conflict warning), and the calendar page's mobile header carries
the same bar. Verified end-to-end at 375px: typing the phrase shows the
parsed preview matched to **November 19, 2026** with the deadline
computed correctly, and Add Task enabled.

## Files changed

### `src/components/dashboard/DashboardMobile.tsx` (rewritten)
Previously stats cards + a static task-count card + lists of
videos/notes. Now renders, in a one-handed stacked layout:
- `AgentBriefingCard` — greeting, overdue/due-today summary, "I'd start
  with…" recommendation with Start-now (focus mode)
- `QuickAddBar` — the NLP task input (the headline fix)
- `TodoList` — full task CRUD: add with reminder picker, edit,
  complete, delete, unified with scheduled videos/playlists
- `ContinueWatching` — progress bars, completion toggle, remove
- Notes section with real actions: mark/unmark important, delete
  (dropdown on each note) — was read-only before
- `PlaylistsSection` and `RecentFolders` — were absent entirely
- Channels card with live badges, ring, per-channel live titles and a
  Live refresh button
- Shortcuts (Add content / Search / Folders / Playlists) — restored
  from the commented-out block

### `src/components/dashboard/DashboardTablet.tsx` (rewritten)
Same parity for the 768–1024px tree, in a tablet two-column layout
(quick-add beside the task list). Previously stats + static task
counts + video/note grids only.

### `src/components/dashboard/Dashboard.tsx`
- Mobile/tablet branches now receive the real data props
  (`completedVideos`, `completedPlaylists`) and behavior props
  (note important/delete, video completion, playlist removal).
- `ReminderDialog` (due-task reminder popup) now renders in the mobile
  and tablet branches too — the early `return` used to skip it, so
  phones never got reminder popups from `useReminderChecker`.
- Removed the now-unused `scheduledTasks`/`pendingTasks` computations.

### `src/app/calendar/CalendarPageClient.tsx`
The NLP quick-add block (previously only in the desktop header via
`hidden md:block`) is now also in `renderMobileHeader()`, in the same
card styling as desktop. Phones can type date-phrases from the
calendar page.

### `src/components/layout/MobileMainLayout.tsx`
- Bottom nav gained **Notes** (desktop sidebar has it; mobile had no
  entry at all). It's now 8 items in two rows of 4 (`grid-cols-4`)
  instead of 7 cramped in one row — larger touch targets, larger text.
- Content bottom padding raised (`pb-24` → `pb-32`) to clear the
  taller two-row nav.
- The `onboarding-mobile-nav-*` id map gained the `notes` entry.

## What was verified
- `next build`: **EXIT 0** — compiles clean and full TypeScript passes
  (no `ignoreBuildErrors` in this project, so this is a real check).
- Build requires the app's env vars (Supabase/NextAuth/Firebase) to be
  present at module-evaluation time; a `.env` with placeholder values
  was used for the build machine only. **It is excluded from the zip —
  use your real env vars as before.**
- Live browser test at 375×812 with a minted session cookie:
  - Mobile dashboard renders briefing, quick-add, task list, nav
    (8 items incl. Notes), no skeleton hang.
  - Typing "Physics exam on november 19th": parse preview shows the
    matched phrase and deadline "in 11 days" (Nov 19 2026 from
    Nov 8 2026), Add Task enabled. `/api/agent/parse` returns
    `{"title":"Physics exam","deadlineAt":"2026-11-19T12:00:00.000Z",
    "matchedText":"november 19th"}`.
  - Mobile calendar page renders the quick-add bar and the mobile
    card layout (Jump to date, November 2026 grid).
  - Screenshots: `screenshots/` in the delivered zip.

## Deliberately unchanged
- All API routes, NLP parsing, agent daemon, stores — the backend
  paths are identical to desktop's (which already works in
  production); the gap was purely that mobile never rendered the UI.
- Desktop and tablet layouts' existing designs (hero/stats cards).
