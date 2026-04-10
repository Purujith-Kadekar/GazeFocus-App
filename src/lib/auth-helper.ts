import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from './db'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  try {
    const blockedResult = await db
      .from('User')
      .select('isBlocked')
      .eq('id', session.user.id)
      .maybeSingle()

    if (blockedResult.data?.isBlocked) {
      return null
    }
  } catch {
    // If the block check fails, keep existing behavior instead of hard-failing all requests.
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
