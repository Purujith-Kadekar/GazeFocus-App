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
      if (!credentials?.idToken) return null

      const firebaseAuth = await getFirebaseAuth()
      if (!firebaseAuth) return null

      try {
        const decodedToken = await firebaseAuth.verifyIdToken(credentials.idToken)
        const email = (decodedToken.email || '').toLowerCase()
        
        const user = {
          id: decodedToken.uid,
          email: email,
          name: decodedToken.displayName || '',
          image: decodedToken.photoURL || '',
        }
        
        return user
      } catch (error) {
        // Silent fail
        return null
      }
    },
  }),
]