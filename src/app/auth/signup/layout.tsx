import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a free GazeFocus account to start tracking focus, managing your video library, and building better learning habits.',
  alternates: {
    canonical: '/auth/signup',
  },
  openGraph: {
    title: 'Join GazeFocus – Create Your Account',
    description: 'Sign up for GazeFocus and take control of your focus and learning with a free account.',
    url: 'https://gaze-focus.vercel.app/auth/signup',
    type: 'website',
  },
}

export default function SignupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
