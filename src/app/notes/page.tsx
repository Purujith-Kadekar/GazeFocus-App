import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import NotesPageClient from './NotesPageClient'

export default async function NotesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: notes } = await db
    .from('Note')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  return <NotesPageClient initialNotes={notes || []} />
}
