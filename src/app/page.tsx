import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import LandingPageResponsive from '@/components/landing/LandingPageResponsive'
import { SiteFooter } from '@/components/layout/SiteFooter'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <>
      <LandingPageResponsive />
      <SiteFooter />
    </>
  )
}
