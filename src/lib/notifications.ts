// ============================================
// GazeFocus — browser notification permission
// ============================================
// Client-side helper for the web-app-only reminder channel
// (spec §5.1): browser Notifications are the sole delivery
// surface for reminders, and permission should be requested
// only when the user actually creates a reminder/task with a
// due time — never on page load for every visitor.

/**
 * Ask the browser for Notification permission at a moment when
 * the user has just expressed clear intent to receive reminders
 * (e.g. creating a task with a due date/time). No-op when the
 * Notification API is unavailable or permission was already
 * granted/denied.
 */
export function requestReminderNotificationPermission(): void {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (typeof Notification.requestPermission !== 'function') return
  if (Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}
