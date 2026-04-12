import Link from 'next/link'
import { CircleHelp, FileText, Info, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border/60 bg-background py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">GazeFocus</span>
            <p className="text-xs text-muted-foreground">
              Copyright {new Date().getFullYear()} GazeFocus. All rights reserved.
            </p>
          </div>
        </div>

        <nav
          aria-label="Footer links"
          className="flex flex-wrap items-center justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground md:justify-end"
        >
          <Link href="/privacy-policy" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <Lock size={14} />
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <FileText size={14} />
            Terms
          </Link>
          <Link href="/about" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <Info size={14} />
            About
          </Link>
          <Link href="/fyq" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <CircleHelp size={14} />
            FYQ
          </Link>
        </nav>
      </div>
    </footer>
  )
}
