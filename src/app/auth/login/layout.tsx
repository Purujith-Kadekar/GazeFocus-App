import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your GazeFocus account to access your videos, playlists, notes, and focus tracking tools.',
  alternates: {
    canonical: '/auth/login',
  },
  openGraph: {
    title: 'Sign In to GazeFocus',
    description: 'Log in to your GazeFocus account and continue your focused learning journey.',
    url: 'https://gaze-focus.vercel.app/auth/login',
    type: 'website',
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
