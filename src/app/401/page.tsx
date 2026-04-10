import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center border border-border bg-card/70 p-8 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">401</p>
        <h1 className="text-3xl font-bold mb-3">Unauthorized</h1>
        <p className="text-muted-foreground mb-6">
          You are not authorized to view this page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/auth/login" className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Sign In
          </Link>
          <Link href="/" className="px-4 py-2 rounded border border-border hover:bg-muted transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
