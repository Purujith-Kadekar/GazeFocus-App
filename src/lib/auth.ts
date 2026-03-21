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

      if (user && user.email) {
        console.log('[Auth JWT] New user from OAuth:', user.email, 'OAuth ID:', user.id)
        
        try {
          const dbUser = await db.from('User').select('id').eq('email', user.email.toLowerCase()).single()
          console.log('[Auth JWT] DB user:', dbUser.data)
          
          if (dbUser.data) {
            extendedToken.id = dbUser.data.id
          } else {
            extendedToken.id = user.id
          }
        } catch (e) {
          console.log('[Auth JWT] Using OAuth ID as fallback')
          extendedToken.id = user.id
        }
      }

      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as any
      const extSession = session as any

      if (extSession.user && extendedToken.id) {
        extSession.user.id = extendedToken.id
        
        try {
          const dbUser = await db.from('User').select('name, image').eq('id', extendedToken.id).single()
          if (dbUser.data) {
            if (dbUser.data.name) extSession.user.name = dbUser.data.name
            if (dbUser.data.image) extSession.user.image = dbUser.data.image
          }
        } catch (e) {
          console.log('[Auth Session] Could not fetch user details')
        }
      }

      if (extendedToken.error) extSession.error = extendedToken.error

      return extSession
    },
    async signIn({ user, account, profile }) {
      console.log('[Auth] signIn:', { provider: account?.provider, email: user?.email })
      
      if (account?.provider === 'google' && user?.email) {
        try {
          const email = user.email.toLowerCase()
          console.log('[Auth] Looking for user with email:', email)
          
          let existingUser = null
          let selectError = null
          
          try {
            const result = await db.from('User').select('id').eq('email', email).single()
            existingUser = result.data
            selectError = result.error
          } catch (e: any) {
            if (e.code === 'PGRST116') {
              existingUser = null
            } else {
              selectError = e
            }
          }
          
          console.log('[Auth] DB query result:', { existingUser, selectError })

          if (!existingUser) {
            console.log('[Auth] Creating new user:', email)
            const { data: newUser, error: insertError } = await db
              .from('User')
              .insert({
                email: email,
                name: user.name || email.split('@')[0],
                image: user.image,
              })
              .select('id')
              .single()
            
            console.log('[Auth] Insert result:', { newUser, insertError })
          }
        } catch (error) {
          console.error('[Auth] Error:', error)
        }
      }
      return true
    },
  },
  events: {},
  debug: process.env.NODE_ENV === 'development',
}
