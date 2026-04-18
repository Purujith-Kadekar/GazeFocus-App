import Link from 'next/link'
import { CircleHelp, FileText, Info, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export function MobileFooter() {
  return (
    <footer className="mt-4 border-t border-border/60 bg-background py-4">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Logo size={20} />
          <span className="text-sm font-semibold text-foreground">GazeFocus</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Copyright {new Date().getFullYear()} GazeFocus
        </p>

        <nav
          aria-label="Footer links"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
        >
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/fyq" className="hover:text-foreground transition-colors">
            FYQ
          </Link>
        </nav>
      </div>
    </footer>
  )
}