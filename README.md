# 🎯 GazeFocus

> Privacy-first, distraction-free YouTube learning environment with AI gaze tracking.

Everything runs **on your device**. No backend, no database, no data uploads.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔒 Google OAuth | Read-only access to your YouTube playlists (own + saved) |
| 👁️ AI Gaze Tracking | MediaPipe WASM — pauses video if you look away |
| ⏱️ Wellness Breaks | 2-min breaks at 25%, 50%, 75%, 100% of video |
| 🔍 Search Leash | 15-min countdown anti-doomscroll timer |
| 🔔 Inactivity Alerts | Audio beep + pause when you switch tabs |
| 📋 Watch Later | Save search results to local list |
| ⚙️ Settings | Customize all thresholds, gaze buffer, break duration |

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/gazefocus.git
cd gazefocus
npm install
```

### 2. Set up Google Cloud

**Enable APIs:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **YouTube Data API v3**
4. Enable **Google OAuth 2.0**

**Create OAuth Credentials:**
1. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
2. Application type: **Web application**
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
4. Copy **Client ID** and **Client Secret**

**Add YouTube scopes in OAuth consent screen:**
- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/youtube` (for adding to playlists)

**Create API Key:**
1. APIs & Services → Credentials → Create Credentials → API Key
2. Restrict to YouTube Data API v3

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
AUTH_GOOGLE_ID=your_client_id
AUTH_GOOGLE_SECRET=your_client_secret
AUTH_SECRET=<run: openssl rand -base64 32>
YOUTUBE_API_KEY=your_api_key
AUTH_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architecture

```
gazefocus/
├── app/                     # Next.js App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Auth.js v5 handler
│   │   └── youtube/
│   │       ├── playlists/       # GET user playlists
│   │       ├── playlist-items/  # GET videos in playlist
│   │       ├── search/          # GET search results
│   │       └── add-to-playlist/ # POST add video
│   ├── app/page.tsx         # Protected main app
│   └── page.tsx             # Login page
│
├── components/
│   ├── AppShell.tsx         # IDE-like layout
│   ├── Sidebar.tsx          # Playlist + Watch Later sidebar
│   ├── VideoPlayer.tsx      # YouTube player + gaze + break overlay
│   ├── SearchPanel.tsx      # Restricted search with leash
│   ├── SettingsPanel.tsx    # All settings
│   ├── BreakOverlay.tsx     # Wellness break fullscreen overlay
│   ├── InactivityAlert.tsx  # Tab switch alert overlay
│   ├── GazeIndicator.tsx    # Gaze status indicator
│   ├── LoginScreen.tsx      # Login page UI
│   └── OnboardingModal.tsx  # First-run onboarding
│
├── hooks/
│   ├── useGazeDetection.ts  # MediaPipe gaze tracking
│   ├── useInactivityAlert.ts # Page Visibility API + beep
│   └── useSearchLeash.ts    # 15-min countdown
│
├── stores/
│   └── useStore.ts          # Zustand global state + localStorage
│
├── lib/
│   ├── youtube.ts           # YouTube API client wrappers
│   └── utils.ts             # cn(), formatTime(), beep generator
│
├── types/
│   └── index.ts             # All TypeScript interfaces
│
└── __tests__/
    └── store.test.ts        # Vitest unit tests
```

---

## 🧪 Tests

```bash
npm run test          # Run all tests
npm run test:ui       # Open Vitest UI
```

Tests cover:
- Milestone trigger logic (25/50/75/100%)
- Search leash countdown and locking
- Watch later add/remove/deduplicate
- Break trigger and end
- Settings persistence

---

## 🌐 Deploy to Vercel

### Option A: CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Then add environment variables:

```bash
vercel env add AUTH_GOOGLE_ID
vercel env add AUTH_GOOGLE_SECRET
vercel env add AUTH_SECRET
vercel env add YOUTUBE_API_KEY
vercel env add AUTH_URL
```

### Option B: GitHub Integration

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Add environment variables in project settings
4. Deploy

**Important:** After getting your Vercel URL, update:
- `AUTH_URL` env var to your Vercel URL
- Google OAuth authorized redirect URIs to include `https://your-app.vercel.app/api/auth/callback/google`

---

## 🔐 Privacy Notes

- **Camera**: Only processed locally via WebAssembly. Never sent anywhere.
- **OAuth token**: Stored in encrypted Auth.js JWT cookie. Used only for YouTube API calls via our API routes.
- **User data**: Zero backend. Everything in `localStorage` via Zustand persist.
- **YouTube API**: Only your playlists are fetched. No watch history, no recommendations.

---

## ⚙️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Auth.js v5 (PKCE + HttpOnly cookies)
- **State**: Zustand + LocalStorage
- **AI Vision**: MediaPipe Face Landmarker (WASM)
- **Styling**: Tailwind CSS + custom design tokens
- **Testing**: Vitest + Testing Library

---

## 📝 License

MIT — fork freely, contribute back!
