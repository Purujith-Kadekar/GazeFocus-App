# 👁️ GazeFocus App

A smart YouTube learning platform that uses **real-time eye tracking** to keep you focused. When you look away from the screen, the video automatically pauses — and resumes the moment you look back.

---

## ✨ Features

### 👁️ Eye Tracking & Smart Pause
- **Real-time gaze detection** using your webcam and MediaPipe Face Landmarker
- **Smart Pause** — video automatically pauses when you look away and resumes when you look back
- **Configurable pause threshold** (1–10 seconds) to control how quickly the video pauses
- **Calibration wizard** to optimize tracking accuracy for your setup
- **Focus state indicator** showing whether you are currently focused or distracted
- **Distraction counter** to track how many times you looked away per session

### 📚 Learning Management
- **Folders** to organize your playlists and learning paths
- **Playlists** imported directly from YouTube — full playlist sync supported
- **Video player** with playback speed control, progress tracking, and completion marking
- **Notes** — timestamped notes attached to specific videos
- **Todo list** to track learning tasks

### 🔄 Playlist Auto-Sync
- Playlists automatically sync new YouTube videos every **30 minutes** using a background scheduler
- Manual sync available via the "Refresh" button on any playlist page
- Requires a `YOUTUBE_API_KEY` to fetch data from YouTube

### 🔐 Authentication & Admin
- Google OAuth and credential-based sign-in via NextAuth.js
- Protected admin portal at `/admin` for managing content

### 🎨 UI & Experience
- Clean, responsive design built with **shadcn/ui** and **Tailwind CSS**
- Dark / light / system theme support
- Onboarding tour for new users

---

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Copy the environment template and fill in your values
cp .env.example .env.local

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ | Secret for signing NextAuth session tokens — generate with `openssl rand -base64 32` |
| `ADMIN_USERNAME` | ✅ | Username for the `/admin` portal |
| `ADMIN_PASSWORD` | ✅ | Password for the `/admin` portal |
| `ADMIN_SECRET` | ✅* | Secret for signing admin session JWTs — generate with `openssl rand -base64 32`. Falls back to `NEXTAUTH_SECRET` if not set. |
| `DATABASE_URL` | ✅ | PostgreSQL connection string for Prisma |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID (required for Google sign-in) |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret (required for Google sign-in) |
| `NEXT_PUBLIC_URL` | Optional | Public base URL of the app (default: `http://localhost:3000`) |
| `YOUTUBE_API_KEY` | Optional | YouTube Data API v3 key for importing and syncing playlists |
| `CRON_SECRET` | Optional | Secret to authenticate internal cron-job endpoints |

> \* At least one of `ADMIN_SECRET` or `NEXTAUTH_SECRET` must be set for the admin portal to work.

> **Admin login:** Navigate to `/admin/login` and sign in with the credentials you configured above.

---

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages & API routes
├── components/          # Reusable React components
│   ├── player/          # Video player, eye tracker, notes panel
│   ├── layout/          # Header, sidebar, navigation
│   └── ui/              # shadcn/ui base components
├── hooks/               # Custom React hooks (useFocusEngine, etc.)
├── lib/
│   └── eye-tracking/    # GazeEngine — MediaPipe face landmark detection
└── store/               # Zustand global state stores
```

---

## 🧠 How Eye Tracking Works

1. **Camera access** is requested when you open a video
2. **MediaPipe Face Landmarker** runs locally in your browser — no data leaves your device
3. The engine analyzes **head pose** (yaw/pitch) and **iris position** every frame
4. If you look away for longer than your configured threshold, the video **pauses automatically**
5. When you look back at the screen, the video **resumes** instantly
6. Use the **Calibration wizard** in Settings → Eye Tracking for best accuracy

> Eye tracking runs entirely on-device using WebAssembly. No video or camera data is ever sent to a server.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Eye Tracking | MediaPipe Tasks Vision (Face Landmarker) |
| State | Zustand |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Google OAuth + Credentials) |
| Video | YouTube IFrame API |
| Data Fetching | TanStack Query + Fetch |

---

## 🔄 Playlist Auto-Sync Details

- On app startup, `/api/cron/init` is called to initialize the background scheduler
- The scheduler runs every 30 minutes and syncs all playlists for new YouTube videos
- An initial sync also runs 2 seconds after startup
- Manual sync is available via the **Refresh** button on each playlist page
- Syncs only run if `YOUTUBE_API_KEY` is configured

---

Built with ❤️ for focused, distraction-free learning.
