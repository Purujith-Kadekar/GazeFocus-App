'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center border border-border bg-card/70 p-8 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Error</p>
        <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          This page is temporarily unavailable. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link href="/" className="px-4 py-2 rounded border border-border hover:bg-muted transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
