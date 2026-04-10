import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.given_name || (profile.email ? profile.email.split('@')[0] : 'User'),
          email: profile.email,
          image: profile.picture,
        }
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
          // Update lastLoginDate when session is created/refreshed
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
          console.log('[Auth Session] Could not fetch user details or update lastLoginDate')
        }
      }

      if (extendedToken.error) extSession.error = extendedToken.error

      return extSession
    },
    async signIn({ user, account, profile }) {
      console.log('[Auth] signIn:', { provider: account?.provider, email: user?.email })
      
      try {
        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase()
          console.log('[Auth] Looking for user with email:', email)
          
          const lookupResult = await db.from('User').select('id, name, image').eq('email', email).maybeSingle()
          const existingUser = lookupResult.data
          const selectError = lookupResult.error
          
          console.log('[Auth] DB query result:', { existingUser, selectError })

          if (selectError) {
            console.error('[Auth] User lookup failed:', selectError)
          }

          if (existingUser && !selectError) {
            const profileUpdates: Record<string, string> = {
              updatedAt: new Date().toISOString(),
            }

            if (user.image && user.image !== existingUser.image) {
              profileUpdates.image = user.image
            }

            if (user.name && user.name !== existingUser.name) {
              profileUpdates.name = user.name
            }

            if (Object.keys(profileUpdates).length > 1) {
              const profileUpdateResult = await db
                .from('User')
                .update(profileUpdates)
                .eq('id', existingUser.id)
              if (profileUpdateResult.error) {
                console.error('[Auth] Failed to sync Google profile:', profileUpdateResult.error)
              }
            }
          }

          if (!existingUser && !selectError) {
            // Check if signups are enabled before creating new user
            const settingsResult = await db.from('SiteSettings').select('signupEnabled').eq('id', 'global').single()
            console.log('[Auth] Settings result:', { signupEnabled: settingsResult.data?.signupEnabled, error: settingsResult.error })
            
            if (settingsResult.data && !settingsResult.data.signupEnabled) {
              console.log('[Auth] Signups are disabled, denying user creation')
              return false
            }

            console.log('[Auth] Creating new user:', email)
            const userId = randomUUID()
            const nowIso = new Date().toISOString()
            const { data: newUser, error: insertError } = await db
              .from('User')
              .insert({
                id: userId,
                email: email,
                name: user.name || email.split('@')[0],
                image: user.image,
                createdAt: nowIso,
                updatedAt: nowIso,
              })
              .select('id')
              .single()
            
            console.log('[Auth] Insert result:', { newUser, insertError })
            
            if (insertError) {
              console.error('[Auth] Failed to insert user - checking if it already exists:', insertError)
              const retryLookup = await db.from('User').select('id').eq('email', email).maybeSingle()
              if (!retryLookup.data) {
                return false
              }
            }

            if (newUser && newUser.id) {
              // Create default user settings
              const settingsNowIso = new Date().toISOString()
              const settingsInsert = await db.from('UserSettings').insert({ 
                id: randomUUID(),
                userId: newUser.id, 
                onboardingCompleted: false,
                updatedAt: settingsNowIso,
                createdAt: settingsNowIso,
              })
              console.log('[Auth] UserSettings insert result:', { error: settingsInsert.error })
            }
          }
        }
      } catch (error) {
        console.error('[Auth] signIn caught error:', error)
        return false
      }
      return true
    },
  },
  events: {},
  debug: process.env.NODE_ENV === 'development',
}
