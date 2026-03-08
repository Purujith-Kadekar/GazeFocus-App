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

  const folders = await db.folder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return <FoldersPageClient initialFolders={folders} />
}
