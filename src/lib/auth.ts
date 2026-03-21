import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import bcrypt from 'bcryptjs'

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
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
          ].join(" "),
        },
      },
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: user } = await db.from('User').select('*').eq('email', String(credentials.email).toLowerCase()).single() as any

        if (!user?.passwordHash) return null

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
    async jwt({ token, account, user }) {
      const extendedToken = token as any

      if (user) {
        extendedToken.id = user.id
      }

      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as any
      const extSession = session as any

      if (extSession.user && extendedToken.id) {
        extSession.user.id = extendedToken.id
      }

      if (extendedToken.error) extSession.error = extendedToken.error

      return extSession
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const { data: existingUser } = await db.from('User').select('id').eq('email', user.email).single().catch(() => ({ data: null }))

          if (!existingUser) {
            await db.from('User').insert({
              email: user.email,
              name: user.name || user.email?.split('@')[0],
              image: user.image,
            })
          }
        } catch (error) {
          console.error('Error in signIn:', error)
        }
      }
      return true
    },
  },
  events: {},
  debug: process.env.NODE_ENV === 'development',
}
