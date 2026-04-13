'use client'

import Link from 'next/link'
import { PlayCircle, Flame, Target, Search, Bell } from 'lucide-react'

export default function LandingPageMobile() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-md px-4 pb-8 pt-8">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mobile Experience</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">Learn faster on the go</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            GazeFocus adapts to mobile with one-thumb navigation, quick resume, and focus-aware learning.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-primary/10 p-3 text-sm">
              <Flame className="mb-2 h-4 w-4 text-primary" />
              12 day streak
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-sm">
              <Target className="mb-2 h-4 w-4 text-primary" />
              Weekly goal 80%
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <Link href="/auth/signup" className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground">
              Get Started
            </Link>
            <Link href="/auth/login" className="rounded-xl border border-border px-4 py-3 text-center text-sm font-medium">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Designed for phones</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <div className="rounded-xl bg-muted p-3">
              <PlayCircle className="mx-auto mb-1 h-4 w-4" />
              Resume
            </div>
            <div className="rounded-xl bg-muted p-3">
              <Search className="mx-auto mb-1 h-4 w-4" />
              Search
            </div>
            <div className="rounded-xl bg-muted p-3">
              <Bell className="mx-auto mb-1 h-4 w-4" />
              Alerts
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
