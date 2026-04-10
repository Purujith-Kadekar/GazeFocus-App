'use client'

import Link from 'next/link'

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Root global error:', error)

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center border border-border bg-card/70 p-8 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Critical error</p>
          <h1 className="text-3xl font-bold mb-3">Page not available</h1>
          <p className="text-muted-foreground mb-6">
            A system error occurred while loading this page.
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
      </body>
    </html>
  )
}
