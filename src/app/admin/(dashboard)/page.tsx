'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, Bell, Settings, LogOut, Loader2,
  Ban, CheckCircle, Send, ToggleLeft, ToggleRight,
  Mail, Clock, Trash2, ChevronDown
} from 'lucide-react'

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isBlocked: boolean
  createdAt: string
  lastActiveDate: string | null
  deletionScheduledAt: string | null
  accounts: { provider: string }[]
  _count: { notes: number; playlists: number; videoProgress: number }
}

interface NotificationData {
  id: string
  title: string
  message: string
  global: boolean
  createdAt: string
  user: { email: string; name: string | null } | null
}

type Tab = 'users' | 'notifications' | 'settings'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<UserData[]>([])
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Notification form
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifTarget, setNotifTarget] = useState<string>('all')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [deletingNotif, setDeletingNotif] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersRes, settingsRes, notifsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/notifications'),
      ])

      if (usersRes.status === 401) {
        router.push('/admin/login')
        return
      }

      if (usersRes.ok) setUsers(await usersRes.json())
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setSignupEnabled(s.signupEnabled)
      }
      if (notifsRes.ok) setNotifications(await notifsRes.json())
    } catch {
      // Ignore
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const toggleBlock = async (userId: string, block: boolean) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBlocked: block }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: block } : u))
      }
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  const toggleSignup = async () => {
    const newValue = !signupEnabled
    setActionLoading('signup')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupEnabled: newValue }),
      })
      if (res.ok) setSignupEnabled(newValue)
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifMessage.trim()) return
    setSendingNotif(true)
    try {
      const body: Record<string, string> = { title: notifTitle, message: notifMessage }
      if (notifTarget !== 'all') body.userId = notifTarget
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setNotifTitle('')
        setNotifMessage('')
        setNotifTarget('all')
        // Refresh notifications
        const notifsRes = await fetch('/api/admin/notifications')
        if (notifsRes.ok) setNotifications(await notifsRes.json())
      }
    } catch { /* ignore */ }
    setSendingNotif(false)
  }

  const deleteNotification = async (id: string) => {
    setDeletingNotif(id)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch { /* ignore */ }
    setDeletingNotif(null)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-400" />
            <h1 className="text-lg font-bold">GazeFocus Admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">Active Users</p>
            <p className="text-2xl font-bold">{users.filter(u => !u.isBlocked).length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">Blocked Users</p>
            <p className="text-2xl font-bold text-red-400">{users.filter(u => u.isBlocked).length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">Signups</p>
            <p className={`text-2xl font-bold ${signupEnabled ? 'text-green-400' : 'text-red-400'}`}>
              {signupEnabled ? 'Open' : 'Closed'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">User</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">Provider</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">Stats</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">Joined</th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium">
                            {user.image ? (
                              <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                            ) : (
                              (user.name || user.email || '?')[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.name || 'No name'}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                          {user.accounts[0]?.provider === 'google' ? 'Google' : 'Email'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {user._count.playlists} playlists · {user._count.notes} notes · {user._count.videoProgress} videos
                      </td>
                      <td className="px-4 py-3">
                        {user.isBlocked ? (
                          <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">Blocked</span>
                        ) : user.deletionScheduledAt ? (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">Deleting</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleBlock(user.id, !user.isBlocked)}
                          disabled={actionLoading === user.id}
                          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                            user.isBlocked
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.isBlocked ? (
                            'Unblock'
                          ) : (
                            'Block'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            {/* Send Notification Form */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Send className="h-5 w-5 text-red-400" />
                Push Notification
              </h3>
              <form onSubmit={sendNotification} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={e => setNotifTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      placeholder="Notification title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Target</label>
                    <select
                      value={notifTarget}
                      onChange={e => setNotifTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      <option value="all">All Users</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                  <textarea
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                    placeholder="Notification message..."
                    rows={3}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Notification
                </button>
              </form>
            </div>

            {/* Recent Notifications */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <Bell className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-600">
                          {n.global ? 'All Users' : n.user?.email || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      disabled={deletingNotif === n.id}
                      className="shrink-0 p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete notification"
                    >
                      {deletingNotif === n.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No notifications sent yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-red-400" />
              Site Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="font-medium">New User Signups</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {signupEnabled
                      ? 'New users can create accounts'
                      : 'Signups are currently disabled'}
                  </p>
                </div>
                <button
                  onClick={toggleSignup}
                  disabled={actionLoading === 'signup'}
                  className="flex items-center gap-2"
                >
                  {actionLoading === 'signup' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : signupEnabled ? (
                    <ToggleRight className="h-8 w-8 text-green-400" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
