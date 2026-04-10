import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center border border-border bg-card/70 p-8 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">404</p>
        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-6">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Go Home
          </Link>
          <Link href="/dashboard" className="px-4 py-2 rounded border border-border hover:bg-muted transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
