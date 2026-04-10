import Link from 'next/link'

export default function BadRequestPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center border border-border bg-card/70 p-8 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">400</p>
        <h1 className="text-3xl font-bold mb-3">Bad request</h1>
        <p className="text-muted-foreground mb-6">
          The request could not be processed. Please check your input and try again.
        </p>
        <Link href="/" className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-block">
          Go Home
        </Link>
      </div>
    </main>
  )
}
