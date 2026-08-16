# GazeFocus Agent — Desktop Companion (Electron)

A thin Windows companion for the GazeFocus web app. The cloud stays the source
of truth; this shell adds what a browser tab can't give you:

- **System tray, always running.** Closing the window hides it to the tray —
  the 30-second agent poll keeps going.
- **Priority Windows toasts with action buttons.** "Do it now" / "Snooze"
  (deadlines) and "Completed" / "Keep working" (focus audits) act directly on
  the cloud API from the notification.
- **Start-with-Windows** toggle in the tray menu.
- **Cloud fetch**: reminders are read with `?peek=1` (non-claiming), so the
  web app's AgentInbox remains the fallback dialog for anything you don't act
  on from the toast. Email reminders fire **always**, regardless of what the
  desktop app displayed — covering you when you're away from this machine.

Auth reuses the site's extension login (`/api/auth/extension-login`,
email + password → 7-day JWT, stored encrypted with `safeStorage`). No
database credentials ship inside the app.

## Run in development

```bash
cd desktop
npm install
GAZEFOCUS_URL=http://localhost:3000 npm start
```

`GAZEFOCUS_URL` defaults to `http://localhost:3000`. Point it at your deployed
instance to run against production.

## Package a Windows installer

1. Set the production URL as the default in `main.js` (or export
   `GAZEFOCUS_URL` when building — note env vars are baked at your own risk;
   editing the constant is the reliable path).
2. Build:

```bash
npm run dist          # NSIS installer (dist/gazefocus-desktop Setup.exe)
npm run dist:portable # standalone portable .exe
```

3. Install, enable **Start with Windows** from the tray menu once, and sign in.

## Icons

The tray uses an embedded 16×16 brand-orange icon. For a polished release,
drop `build/icon.ico` (256×256 multi-size) into `desktop/build/` and
electron-builder will use it for the installer, desktop shortcut, and
taskbar automatically — the embedded tray PNG stays as-is.

## Notes & limits

- Windows toast buttons come from Electron's `Notification.actions`
  (supported on Windows 10/11). Toasts respect the OS Focus Assist rules;
  for guaranteed delivery the email channel is the backstop — that's by
  design, see the main `AGENT_SETUP.md`.
- The app intentionally does **not** bundle any Supabase credentials. If the
  JWT expires (7 days), the login window reappears.
- GitHub's scheduled workflow (reminder emails) is independent of this app —
  it runs in the cloud whether or not your PC is on.
