import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import FoldersPageClient from './FoldersPageClient'

export default async function FoldersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: folders } = await db
    .from('Folder')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  return <FoldersPageClient initialFolders={folders || []} />
}
