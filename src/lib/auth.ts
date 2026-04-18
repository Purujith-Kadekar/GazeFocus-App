import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { firebaseTokenProvider } from './firebase-token-provider'
import { db } from './db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sendWelcomeEmail } from './email'
import { normalizeEmail } from './email-verification'

const DEFAULT_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days
const DEFAULT_SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60 // 24 hours

const SESSION_MAX_AGE_SECONDS = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS || DEFAULT_SESSION_MAX_AGE_SECONDS)
const SESSION_UPDATE_AGE_SECONDS = Number(process.env.AUTH_SESSION_UPDATE_AGE_SECONDS || DEFAULT_SESSION_UPDATE_AGE_SECONDS)

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    ...firebaseTokenProvider,
    CredentialsProvider({
      id: 'email-password',
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const normalizedEmail = normalizeEmail(credentials.email)
        const { data: user } = await db
          .from('User')
          .select('id,name,email,image,passwordHash,emailVerified')
          .eq('email', normalizedEmail)
          .single() as any

        if (!user?.passwordHash) return null

        if (!user.emailVerified) {
          throw new Error('EmailNotVerified')
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const extendedToken = token as any

      console.log('[Auth JWT] user:', user?.email, 'token exists:', !!token)

      if (user && user.email) {
        try {
          const normalizedEmail = user.email.toLowerCase()
          const existingUser = await db.from('User').select('id').eq('email', normalizedEmail).single()
          
          if (existingUser.data) {
            console.log('[Auth JWT] Found existing user:', existingUser.data.id)
            extendedToken.id = existingUser.data.id
          } else {
            console.log('[Auth JWT] Creating new user for:', normalizedEmail)
            const newUserId = randomUUID()
            const now = new Date().toISOString()
            await db.from('User').insert({
              id: newUserId,
              email: normalizedEmail,
              name: user.name || normalizedEmail.split('@')[0],
              image: user.image || null,
              authProvider: 'firebase',
              emailVerified: now,
              createdAt: now,
              updatedAt: now,
            })
            extendedToken.id = newUserId
          }
        } catch (e) {
          console.error('[Auth JWT] Error:', e)
          extendedToken.id = user.id
        }
      }

      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as any
      const extSession = session as any

      console.log('[Auth Session] token.id:', extendedToken.id, 'user exists:', !!extSession.user)

      if (extSession.user && extendedToken.id) {
        extSession.user.id = extendedToken.id
        
        try {
          await db
            .from('User')
            .update({ lastLoginDate: new Date().toISOString() })
            .eq('id', extendedToken.id)

          const dbUser = await db.from('User').select('name, image').eq('id', extendedToken.id).single()
          if (dbUser.data) {
            if (dbUser.data.name) extSession.user.name = dbUser.data.name
            if (dbUser.data.image) extSession.user.image = dbUser.data.image
          }
        } catch (e) {
          console.error('[Auth Session] Error updating:', e)
        }
      }

      return extSession
    },
    async signIn() {
      return true
    },
  },
  events: {},
  debug: process.env.NODE_ENV === 'development',
}
