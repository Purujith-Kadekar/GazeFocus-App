# 👁 GazeFocus

> A YouTube learning platform that pauses your video when you stop looking at it.

No extensions. No installs. Just open it, paste a YouTube link, and let it watch you back.

**[Live App](https://gaze-focus.vercel.app)** · Built with Next.js, MediaPipe, PostgreSQL

---

## The idea

I kept catching myself watching lectures while actually staring at my phone. The video would be 10 minutes ahead of where my brain was. GazeFocus fixes that one specific problem — it uses your webcam to track where you're looking, and pauses the video the moment you drift. No nudges, no timers, no gamification. Just a hard stop.

---

## What it does

### Eye tracking

The core feature. Your webcam runs [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) locally in the browser — head pose and iris position are analysed every frame. When you look away for longer than your chosen threshold, the video pauses. When you look back, it resumes.

Everything runs in WebAssembly. No video frames, no gaze coordinates, nothing leaves your browser tab.

**Three focus modes** to match how your session is going:
- `Light` — generous grace period, good for casual watching or note-taking
- `Moderate` — balanced, works well for most study sessions
- `Strict` — pauses fast, for when you genuinely need to be locked in

**Distraction counter** tracks how many times you looked away per session.

### Video player

Wraps the YouTube IFrame API in a distraction-free shell — no recommendations sidebar, no comments, no autoplay queue. Controls for playback speed and progress tracking. Videos are marked complete when you finish them.

### Timestamped notes

Take notes while a video is playing. Each note is attached to the exact timestamp. Click any note later and the video jumps straight to that moment. Works well for reviewing long lectures.

### Folders & playlists

Organise your learning into folders. Import entire YouTube playlists by pasting a URL — the app pulls all videos via the YouTube Data API and keeps them in sync.

**Auto-sync**: a background cron job runs every 30 minutes and checks your playlists for new uploads. Manual sync is available via the Refresh button on any playlist page.

Drag-and-drop reordering for folders and videos (powered by dnd-kit).

### Todo list

A per-session task list attached to your learning. Tick off concepts as you cover them.

### Progress tracking

Watch time, session streaks, completion status per video. Nothing fancy — just the numbers that matter.

---

## Auth

Google OAuth and email/password via NextAuth.js. Protected admin portal at `/admin/login` for content management.

---

## Running it

```bash
# clone and install
git clone https://github.com/Purujith-Kadekar/GazeFocus-App
cd GazeFocus-App
bun install

# set up environment
cp .env .env.local
# fill in the values (see below)

# push the schema and run
bun run db:push
bun run dev
```

Open `http://localhost:3000`.

### Environment variables

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Session signing key — `openssl rand -base64 32` |
| `ADMIN_USERNAME` | ✅ | Admin portal username |
| `ADMIN_PASSWORD` | ✅ | Admin portal password |
| `ADMIN_SECRET` | ✅ | Admin JWT signing key — falls back to `NEXTAUTH_SECRET` |
| `AUTH_GOOGLE_ID` | optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | optional | Google OAuth client secret |
| `YOUTUBE_API_KEY` | optional | Required for playlist import and auto-sync |
| `NEXT_PUBLIC_URL` | optional | Public base URL (default: `http://localhost:3000`) |
| `CRON_SECRET` | optional | Authenticates internal cron endpoints |

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Eye tracking | MediaPipe Tasks Vision (Face Landmarker) via WebAssembly |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Google OAuth + credentials) |
| State | Zustand |
| Data fetching | TanStack Query |
| Drag and drop | dnd-kit |
| Video | YouTube IFrame API |
| Background jobs | node-cron |
| Desktop | Electron |

---

## Project structure

```
src/
├── app/                  Next.js App Router — pages and API routes
│   └── api/
│       ├── auth/         NextAuth endpoints
│       ├── cron/         Background sync scheduler
│       └── youtube/      Playlist import and sync
├── components/
│   ├── player/           Video player, eye tracker, notes panel
│   ├── layout/           Sidebar, header, nav
│   └── ui/               shadcn/ui base components
├── hooks/
│   └── useFocusEngine    Core gaze detection and pause logic
├── lib/
│   └── eye-tracking/     GazeEngine — MediaPipe integration
└── store/                Zustand stores
```

---

## How the eye tracking actually works

1. Camera access is requested when you open a video
2. MediaPipe processes each frame locally — head yaw, pitch, and iris position
3. The focus engine compares gaze direction against your chosen mode's threshold
4. Below threshold for longer than the grace period → video pauses
5. Gaze returns to screen → video resumes immediately

The engine exposes a live focus state (`focused` / `distracted`) and a running distraction count for the current session.

---

## Caveats

- YouTube API key is optional but without it, playlist import won't work — you'd need to add videos individually
- Eye tracking accuracy varies with lighting. A well-lit face pointing at the screen works best
- Mobile browsers don't support the MediaPipe WebAssembly build reliably — this is a desktop-first app
- The auto-sync cron only runs while the server is active (not serverless-friendly out of the box)

---

## License

MIT — do whatever you want with it.

---

Built by [Purujith Kadekar](https://github.com/Purujith-Kadekar)
