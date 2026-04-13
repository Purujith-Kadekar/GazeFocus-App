'use client'

import Link from 'next/link'
import { BarChart3, FolderOpen, PlayCircle, Sparkles } from 'lucide-react'

export default function LandingPageTablet() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 pb-10 pt-10">
        <div className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-[1.2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tablet Experience</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight">Focus-first learning for medium screens</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              A balanced layout between desktop power and mobile simplicity, optimized for tablets and compact laptops.
            </p>
            <div className="mt-5 flex gap-3">
              <Link href="/auth/signup" className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                Start Free
              </Link>
              <Link href="/auth/login" className="rounded-xl border border-border px-5 py-3 text-sm font-medium">
                Sign In
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-muted p-4">
              <PlayCircle className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Resume in one tap</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <FolderOpen className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Organized playlist folders</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <BarChart3 className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Real-time progress analytics</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <Sparkles className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Theme-aware UI (light and dark)</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
