import Link from 'next/link'
import { CircleHelp, FileText, Info, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export function MobileFooter() {
  return (
    <footer className="mt-8 border-t border-border/60 bg-background pt-6 pb-0">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-1 px-4 text-center">
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
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  )
}