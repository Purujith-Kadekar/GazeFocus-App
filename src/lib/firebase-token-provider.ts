import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'

async function getFirebaseAuth() {
  const { auth } = await import('./firebase-admin')
  return auth
}

export const firebaseTokenProvider: NextAuthOptions['providers'] = [
  CredentialsProvider({
    id: 'firebase',
    name: 'Firebase',
    credentials: {
      idToken: { label: 'ID Token', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.idToken) {
        console.error('[Firebase Provider] No credentials')
        return null
      }

      const firebaseAuth = await getFirebaseAuth()
      if (!firebaseAuth) {
        console.error('[Firebase Provider] No firebase auth')
        return null
      }

      try {
        const decodedToken = await firebaseAuth.verifyIdToken(credentials.idToken)
        console.log('[Firebase Provider] Decoded token for:', decodedToken.email)
        const email = (decodedToken.email || '').toLowerCase()
        
        const user = {
          id: decodedToken.uid,
          email: email,
          name: decodedToken.displayName || '',
          image: decodedToken.photoURL || '',
        }
        
        return user
      } catch (error) {
        console.error('[Firebase Provider] Token verification failed:', error)
        return null
      }
    },
  }),
]