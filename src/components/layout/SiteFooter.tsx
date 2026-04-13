import Link from 'next/link'
import { CircleHelp, FileText, Info, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border/60 bg-background py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center">
        <div className="flex items-center justify-center gap-3">
          
          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center gap-2">
              <Logo size={28} />
              <span className="text-base font-semibold text-foreground">GazeFocus</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Copyright {new Date().getFullYear()} GazeFocus. All rights reserved.
            </p>
          </div>
        </div>

        <nav
          aria-label="Footer links"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
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
          <Link href="/sitemap" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <FileText size={14} />
            Sitemap
          </Link>
        </nav>
      </div>
    </footer>
  )
}
