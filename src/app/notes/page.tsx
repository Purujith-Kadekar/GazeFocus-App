import NotesPageClient from './NotesPageClient'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Note } from '@/types'

export default async function NotesPage() {
  let initialNotes: Note[] = []

  try {
    const user = await getCurrentUser()
    if (user) {
      const result = await db
        .from('Note')
        .select('id,content,timestampSeconds,isImportant,youtubeId,createdAt,updatedAt,userId')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })

      initialNotes = (result.data as Note[] | null) || []
    }
  } catch {
    // Fail soft: the client can still fetch /api/notes after mount.
  }

  return <NotesPageClient initialNotes={initialNotes} />
}
