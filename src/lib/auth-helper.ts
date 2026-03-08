import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
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
