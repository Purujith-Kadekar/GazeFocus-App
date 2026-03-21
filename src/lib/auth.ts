import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { db } from './db'
import bcrypt from 'bcryptjs'

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

async function updateUserStreak(userId: string) {
  try {
    const { data: user } = await db.from('User').select('*').eq('id', userId).single() as any
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate)
      lastLogin.setHours(0, 0, 0, 0)
      const daysSinceLastLogin = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastLogin === 0) {
        return {
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          lastLoginDate: user.lastLoginDate,
          lastActiveDate: user.lastActiveDate,
        }
      }
    }

    const lastReferenceDate = user.lastActiveDate
      ? new Date(user.lastActiveDate)
      : user.lastLoginDate
        ? new Date(user.lastLoginDate)
        : null

    let newStreak = 1

    if (lastReferenceDate) {
      const lastActive = new Date(lastReferenceDate)
      lastActive.setHours(0, 0, 0, 0)
      const daysSinceLastActive = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActive === 0) {
        newStreak = user.currentStreak || 1
      } else if (daysSinceLastActive === 1) {
        newStreak = (user.currentStreak || 0) + 1
      } else {
        newStreak = 1
      }
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak)

    const { data: updatedUser } = await db.from('User').update({
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastLoginDate: today.toISOString(),
      lastActiveDate: today.toISOString(),
    }).eq('id', userId).select('currentStreak, longestStreak, lastLoginDate, lastActiveDate').single() as any

    return updatedUser
  } catch (error) {
    console.error('Error updating streak:', error)
    return null
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const authOptions: NextAuthOptions = {
  adapter: isBuildTime ? undefined : SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as any,
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
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
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
    async jwt({ token, account, user, trigger }) {
      const extendedToken = token as any

      if (user) {
        extendedToken.id = user.id
      }

      if (account && account.provider === "google") {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        }
      }

      if (trigger === 'signIn' || extendedToken.currentStreak === undefined) {
        const streakData = await updateUserStreak(extendedToken.id as string)
        if (streakData) {
          extendedToken.currentStreak = streakData.currentStreak ?? 0
          extendedToken.longestStreak = streakData.longestStreak ?? 0
        }
      }

      if (!extendedToken.accessToken || !extendedToken.expiresAt) return extendedToken

      const expiresAt = extendedToken.expiresAt as number
      if (Date.now() / 1000 < expiresAt - 60) return extendedToken

      return refreshAccessToken(extendedToken)
    },
    async session({ session, token }) {
      const extendedToken = token as any
      const extSession = session as any

      if (extSession.user && extendedToken.id) {
        extSession.user.id = extendedToken.id
        if (extendedToken.picture) extSession.user.image = extendedToken.picture
        if (extendedToken.name) extSession.user.name = extendedToken.name
      }

      if (extendedToken.currentStreak !== undefined) {
        extSession.user.currentStreak = extendedToken.currentStreak ?? 0
        extSession.user.longestStreak = extendedToken.longestStreak ?? 0
      } else if (extendedToken.id) {
        try {
          const { data: userData } = await db.from('User').select('currentStreak, longestStreak').eq('id', extendedToken.id as string).single() as any
          if (userData) {
            extSession.user.currentStreak = userData.currentStreak
            extSession.user.longestStreak = userData.longestStreak
          }
        } catch {}
      }

      if (extendedToken.accessToken) extSession.accessToken = extendedToken.accessToken
      if (extendedToken.error) extSession.error = extendedToken.error

      return extSession
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          const { data: existingUser } = await db.from('User').select('*').eq('email', user.email).single() as any

          if (existingUser?.isBlocked) return false

          if (!existingUser) {
            const { data: settings } = await db.from('SiteSettings').select('*').eq('id', 'global').single() as any
            if (settings && !settings.signupEnabled) return false
          }

          if (existingUser) {
            const { data: userSettings } = await db.from('UserSettings').select('*').eq('userId', existingUser.id).single() as any

            if (!existingUser.name || !existingUser.image) {
              await db.from('User').update({
                name: existingUser.name || user.name || user.email?.split('@')[0],
                image: existingUser.image || user.image,
              }).eq('id', existingUser.id)
            }

            if (!userSettings) {
              await db.from('UserSettings').insert({ userId: existingUser.id })
            }
          }
        }
      } catch (error) {
        console.error('Error in signIn callback:', error)
      }
      return true
    },
  },
  events: {
    async createUser({ user }) {
      try {
        if (user.id) {
          await db.from('UserSettings').insert({ userId: user.id })
        }
      } catch (error) {
        console.error('Error creating user settings:', error)
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
