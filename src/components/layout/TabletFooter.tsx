import Link from 'next/link'
import { CircleHelp, FileText, Info, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export function TabletFooter() {
  return (
    <footer className="mt-6 border-t border-border/60 bg-background py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center gap-2">
              <Logo size={24} />
              <span className="text-sm font-semibold text-foreground">GazeFocus</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Copyright {new Date().getFullYear()} GazeFocus
            </p>
          </div>
        </div>

        <nav
          aria-label="Footer links"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
        >
          <Link href="/privacy-policy" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <Lock size={12} />
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <FileText size={12} />
            Terms
          </Link>
          <Link href="/about" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <Info size={12} />
            About
          </Link>
          <Link href="/fyq" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <CircleHelp size={12} />
            FYQ
          </Link>
        </nav>
      </div>
    </footer>
  )
}