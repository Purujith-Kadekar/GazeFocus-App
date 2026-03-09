import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await getAdminSession()

  // Don't redirect on login page
  const isLoginPage = false // layout applies to all admin pages except login has its own

  if (!isAdmin) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
