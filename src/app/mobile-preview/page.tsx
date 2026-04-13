import Link from 'next/link'
import { Bell, CalendarDays, Clock3, Flame, LayoutGrid, PlayCircle, Search } from 'lucide-react'

export default function MobilePreviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f8ff_0%,_#eef2ff_42%,_#ffffff_75%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_40px_-30px_rgba(2,6,23,0.35)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mobile First Concept</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">GazeFocus Mobile Template</h1>
            <p className="mt-2 text-sm text-slate-600">
              A cleaner mobile-first shell for quick learning sessions, daily streak visibility, and one-tap resume.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              Back Home
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Open Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mx-auto max-w-[300px] rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="overflow-hidden rounded-[1.6rem] bg-white">
                <div className="bg-slate-900 px-4 pb-4 pt-5 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs opacity-80">09:41</p>
                    <div className="flex items-center gap-2 text-xs opacity-80">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold">Welcome back</h2>
                  <p className="text-sm text-slate-300">Continue your focus sprint</p>
                </div>

                <div className="space-y-4 p-4">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-xs font-medium text-emerald-700">Today</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-emerald-900">
                        <Flame size={16} />
                        12 day streak
                      </div>
                      <span className="font-semibold text-emerald-800">+48 min</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                      <PlayCircle size={14} />
                      Resume lesson
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-slate-800">
                      Neural Networks Explained Simply for Engineers
                    </p>
                    <button className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                      Continue
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                    <div className="rounded-xl bg-slate-100 px-2 py-3">
                      <CalendarDays size={14} className="mx-auto mb-1" />
                      Plan
                    </div>
                    <div className="rounded-xl bg-slate-100 px-2 py-3">
                      <Search size={14} className="mx-auto mb-1" />
                      Search
                    </div>
                    <div className="rounded-xl bg-slate-100 px-2 py-3">
                      <Bell size={14} className="mx-auto mb-1" />
                      Alerts
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 border-t border-slate-200 px-2 py-2 text-center text-[11px] text-slate-500">
                  <button className="rounded-lg px-2 py-2 text-slate-900">
                    <LayoutGrid size={14} className="mx-auto mb-1" />
                    Home
                  </button>
                  <button className="rounded-lg px-2 py-2">
                    <PlayCircle size={14} className="mx-auto mb-1" />
                    Learn
                  </button>
                  <button className="rounded-lg px-2 py-2">
                    <Clock3 size={14} className="mx-auto mb-1" />
                    Queue
                  </button>
                  <button className="rounded-lg px-2 py-2">
                    <Bell size={14} className="mx-auto mb-1" />
                    Inbox
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold tracking-tight">What Changed In This Mobile Template</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">Mobile-first information hierarchy</p>
                <p className="mt-1 text-sm text-slate-600">Primary action is always visible, secondary actions are compact chips.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">Larger touch targets</p>
                <p className="mt-1 text-sm text-slate-600">Buttons and nav targets are designed for thumb reach and one-handed usage.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">Bottom navigation pattern</p>
                <p className="mt-1 text-sm text-slate-600">Faster access to core actions compared to sidebar-first desktop layout.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">Visual density tuned for small screens</p>
                <p className="mt-1 text-sm text-slate-600">Less crowded cards and clearer spacing at 320-430px widths.</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
