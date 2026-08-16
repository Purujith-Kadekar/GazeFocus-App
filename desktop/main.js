// ============================================
// GazeFocus Agent — Electron companion
// ============================================
// Thin desktop client for the GazeFocus proactive
// scheduling agent. The web app (and its Supabase
// backend) stays the source of truth; this shell adds:
//
//   • System-tray presence that survives window close
//   • A 30s background poll of the agent API (cloud fetch)
//   • Native Windows toast notifications WITH action
//     buttons ("Do it now" / "Snooze") even when the
//     window is closed
//   • Autostart with Windows
//
// Auth reuses the extension login endpoint (email +
// password -> 7-day JWT), stored encrypted via
// safeStorage. No Supabase credentials ever ship here.
// ============================================

const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, dialog, safeStorage } = require('electron')
const path = require('path')
const fs = require('fs')

// Where the GazeFocus web app lives. Override with the
// GAZEFOCUS_URL env var (or edit the default before
// packaging — see README).
const SITE_URL = (process.env.GAZEFOCUS_URL || 'http://localhost:3000').replace(/\/$/, '')
const POLL_INTERVAL_MS = 30_000
const APP_ID = 'com.gazefocus.desktop'

// 16x16 brand-orange tray icon (embedded PNG).
const TRAY_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVR4nGNgoAa40s71nxw8CA0gFmA1gFQwHA0gNiCJikZiNNM+IRGynfYGkOQFSgAAhHdUL3thii4AAAAASUVORK5CYII='

// ─── Single instance ─────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => showMainWindow())
}

// Required for Windows toast notifications to display.
app.setAppUserModelId(APP_ID)

let mainWindow = null
let loginWindow = null
let tray = null
let pollTimer = null
let authToken = null
let sessionStartedAtMs = Date.now()
let autoStart = false

// Reminder ids already toasted this install (persisted so a
// restart doesn't re-notify old reminders).
let notifiedIds = new Set()

// ─── Token + state persistence ───────────────────────────
const userDataDir = () => app.getPath('userData')
const tokenPath = () => path.join(userDataDir(), 'token.bin')
const statePath = () => path.join(userDataDir(), 'state.json')

function saveToken(token) {
  try {
    const data = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(token)
      : Buffer.from(token, 'utf8')
    fs.writeFileSync(tokenPath(), data)
  } catch (err) {
    console.error('[GazeFocus] Failed to persist token:', err)
  }
}

function loadToken() {
  try {
    if (!fs.existsSync(tokenPath())) return null
    const raw = fs.readFileSync(tokenPath())
    return safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf8')
  } catch {
    return null
  }
}

function clearToken() {
  try {
    fs.rmSync(tokenPath(), { force: true })
  } catch {}
  authToken = null
}

function saveState() {
  try {
    // Keep only the last 200 notified ids.
    const ids = [...notifiedIds].slice(-200)
    fs.writeFileSync(statePath(), JSON.stringify({ notifiedIds: ids, autoStart }))
  } catch {}
}

function loadState() {
  try {
    if (!fs.existsSync(statePath())) return
    const s = JSON.parse(fs.readFileSync(statePath(), 'utf8'))
    notifiedIds = new Set(s.notifiedIds || [])
    autoStart = Boolean(s.autoStart)
  } catch {}
}

// ─── API helpers (cloud fetch) ───────────────────────────
async function api(pathname, options = {}) {
  const res = await fetch(`${SITE_URL}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  })
  return res
}

async function agentAction(pathname, body) {
  try {
    const res = await api(pathname, { method: body ? 'POST' : 'PATCH', body: body ? JSON.stringify(body) : undefined })
    if (res.status === 401) {
      clearToken()
      showLoginWindow()
    }
  } catch (err) {
    console.error('[GazeFocus] Agent action failed:', err)
  }
}

// ─── Windows / Tray ──────────────────────────────────────
function showMainWindow() {
  if (!mainWindow) return createMainWindow()
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d10',
    title: 'GazeFocus',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(SITE_URL)

  // Closing hides to tray — the companion keeps watching.
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      new Notification({
        title: 'GazeFocus Agent is still running',
        body: 'Deadline watch continues in the background. Right-click the tray icon to quit.',
      }).show()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-fail-load', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'GazeFocus',
      message: `Could not reach ${SITE_URL}`,
      detail: 'Check your internet connection, or set GAZEFOCUS_URL to your deployed GazeFocus instance.',
    })
  })
}

function createTray() {
  const icon = nativeImage.createFromBuffer(Buffer.from(TRAY_ICON_BASE64, 'base64'))
  tray = new Tray(icon)
  tray.setToolTip('GazeFocus Agent — watching your deadlines')

  const rebuildMenu = () => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Open GazeFocus', click: () => showMainWindow() },
        { label: 'Check reminders now', click: () => pollReminders(true) },
        { type: 'separator' },
        {
          label: 'Start with Windows',
          type: 'checkbox',
          checked: autoStart,
          click: (item) => {
            autoStart = item.checked
            app.setLoginItemSettings({ openAtLogin: autoStart })
            saveState()
          },
        },
        {
          label: 'Log out',
          click: () => {
            clearToken()
            notifiedIds.clear()
            saveState()
            showLoginWindow()
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            app.isQuitting = true
            app.quit()
          },
        },
      ])
    )
  }
  rebuildMenu()

  tray.on('click', () => showMainWindow())
  return { rebuildMenu }
}

// ─── Login ───────────────────────────────────────────────
function showLoginWindow() {
  if (loginWindow) {
    loginWindow.show()
    loginWindow.focus()
    return
  }

  loginWindow = new BrowserWindow({
    width: 420,
    height: 480,
    resizable: false,
    autoHideMenuBar: true,
    title: 'Sign in to GazeFocus',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  loginWindow.loadFile(path.join(__dirname, 'login.html'))
  loginWindow.on('closed', () => {
    loginWindow = null
    if (!authToken && !mainWindow) {
      // No way to authenticate — nothing to do but quit.
      app.isQuitting = true
      app.quit()
    }
  })
}

ipcMain.handle('agent:login', async (_event, { email, password }) => {
  try {
    const res = await fetch(`${SITE_URL}/api/auth/extension-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data.error === 'EmailNotVerified' ? 'email-not-verified' : data.message || data.error || 'Login failed' }
    }
    authToken = data.token
    saveToken(authToken)
    sessionStartedAtMs = Date.now()

    // Swap the login window for the full app + start watching.
    if (loginWindow) {
      const win = loginWindow
      loginWindow = null
      win.destroy()
    }
    if (!mainWindow) createMainWindow()
    startPolling()

    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, error: 'network' }
  }
})

// ─── Reminder polling + toasts ───────────────────────────
function remainingText(deadlineAt) {
  if (!deadlineAt) return ''
  const ms = Date.parse(deadlineAt) - Date.now()
  if (ms < 0) return 'OVERDUE'
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `in ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} h`
  return `in ${Math.round(hours / 24)} d`
}

function toastReminder(reminder) {
  const isAudit = reminder.kind === 'AUDIT'
  const remaining = remainingText(reminder.deadlineAt)

  const notif = new Notification({
    title: isAudit
      ? 'Are you done yet?'
      : reminder.missed
        ? `Missed deadline — ${remaining}`
        : `Deadline ${remaining}`,
    body: isAudit
      ? `"${reminder.title}" — tap Completed when finished.`
      : `"${reminder.title}"${reminder.deadlineAt ? ` (due ${new Date(reminder.deadlineAt).toLocaleString()})` : ''}`,
    urgency: 'critical',
    timeoutType: 'never',
    // Windows supports up to a few action buttons.
    actions: isAudit
      ? [{ type: 'button', text: 'Completed' }, { type: 'button', text: 'Keep working' }]
      : [{ type: 'button', text: 'Do it now' }, { type: 'button', text: 'Snooze' }],
  })

  notif.on('action', (_e, index) => {
    if (isAudit) {
      if (index === 0) agentAction('/api/agent/focus', { todoId: reminder.todoId, action: 'complete' })
      else agentAction('/api/agent/focus', { todoId: reminder.todoId, action: 'continue' })
    } else {
      if (index === 0) agentAction('/api/agent/focus', { todoId: reminder.todoId, action: 'start' })
      else agentAction('/api/agent/reminders', { reminderId: reminder.id, action: 'defer' })
    }
  })

  // Clicking the toast body opens the app — the web AgentInbox
  // will claim the reminder and show the interactive dialog.
  notif.on('click', () => showMainWindow())

  notif.show()
}

async function pollReminders(manual = false) {
  if (!authToken) return
  try {
    const res = await api(
      `/api/agent/reminders?peek=1&sessionStart=${sessionStartedAtMs}`
    )
    if (res.status === 401) {
      clearToken()
      showLoginWindow()
      return
    }
    if (!res.ok) return

    const data = await res.json()
    const due = Array.isArray(data.due) ? data.due : []

    for (const reminder of due) {
      if (notifiedIds.has(reminder.id)) continue
      notifiedIds.add(reminder.id)
      toastReminder(reminder)
    }

    if (notifiedIds.size > 0) saveState()
    if (manual && due.length === 0) {
      new Notification({ title: 'All clear', body: 'No reminders are due right now.' }).show()
    }
  } catch (err) {
    // Offline / server asleep — retry on the next tick.
    console.warn('[GazeFocus] Poll failed:', err.message)
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  sessionStartedAtMs = Date.now()
  pollReminders()
  pollTimer = setInterval(pollReminders, POLL_INTERVAL_MS)
}

// ─── Lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  loadState()
  authToken = loadToken()

  createTray()
  app.setLoginItemSettings({ openAtLogin: autoStart })

  if (authToken) {
    createMainWindow()
    startPolling()
  } else {
    showLoginWindow()
  }

  app.on('activate', () => showMainWindow())
})

app.on('before-quit', () => {
  if (pollTimer) clearInterval(pollTimer)
  saveState()
})

app.on('window-all-closed', () => {
  // Stay alive in the tray on all platforms — this is a
  // background companion, not a regular app.
})
