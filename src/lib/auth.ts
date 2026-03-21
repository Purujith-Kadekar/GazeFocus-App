import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { db } from './db'
import { compare } from 'bcryptjs'
import '@/types' // Import types for module augmentation

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// Helper to update user streak on sign-in using activity-based date
async function updateUserStreak(userId: string) {
  try {
    const { data: user } = await db.from('User').select('*').eq('id', userId).single()
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already updated today
    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate)
      lastLogin.setHours(0, 0, 0, 0)
      const daysSinceLastLogin = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

      // Already updated today, return current streak
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
        // Same day activity/sign-in - keep current streak
        newStreak = user.currentStreak || 1
      } else if (daysSinceLastActive === 1) {
        // Consecutive day - increment streak
        newStreak = (user.currentStreak || 0) + 1
      } else {
        // Streak broken - reset to 1
        newStreak = 1
      }
    }

    // Update longest streak if needed
    const longestStreak = Math.max(user.longestStreak || 0, newStreak)

    const { data: updatedUser } = await db.from('User').update({
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastLoginDate: today.toISOString(),
      lastActiveDate: today.toISOString(),
    }).eq('id', userId).select('currentStreak, longestStreak, lastLoginDate, lastActiveDate').single()

    return updatedUser
  } catch (error) {
    console.error('Error updating streak:', error)
    return null
  }
}

// Helper to hash passwords (for dummy user creation)
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

// Helper to verify passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hashedPassword)
}

export const authOptions: NextAuthOptions = {
  adapter: isBuildTime ? undefined : SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/signup',
    error: '/auth/login',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Email/Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { data: user } = await db.from('User').select('*').eq('email', credentials.email).single()

          if (!user || !user.passwordHash) {
            return null
          }

          const isValid = await verifyPassword(credentials.password, user.passwordHash)

          if (!isValid) {
            return null
          }

          if (user.isBlocked) {
            return null
          }

          return {
            id: user.id,
            email: user.email as string,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl })
      // Always redirect to /dashboard after sign in
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`
      }
      // If the URL contains the callback path, make sure it goes to dashboard
      if (url.includes('callback') || url === baseUrl + '/') {
        return `${baseUrl}/dashboard`
      }
      return url
    },
    async jwt({ token, user, account, profile, trigger }) {
      const extendedToken = token as any

      if (user) {
        extendedToken.id = user.id
        // For Google users, also store the image
        if (account?.provider === 'google' && profile) {
          const googleProfile = profile as { picture?: string; name?: string }
          extendedToken.picture = googleProfile.picture
          extendedToken.name = googleProfile.name
        }
      }

      // Update streak on sign in or if token doesn't have streak yet
      if (trigger === 'signIn' || extendedToken.currentStreak === undefined) {
        const streakData = await updateUserStreak(extendedToken.id as string)
        if (streakData) {
          extendedToken.currentStreak = streakData.currentStreak ?? 0
          extendedToken.longestStreak = streakData.longestStreak ?? 0
        }
      }

      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as any

      if (session.user && extendedToken.id) {
        session.user.id = extendedToken.id
        // Add image from token if available
        if (extendedToken.picture) {
          session.user.image = extendedToken.picture
        }
        if (extendedToken.name) {
          session.user.name = extendedToken.name
        }

        // Use streak from token if available, otherwise fetch from DB
        if (extendedToken.currentStreak !== undefined) {
          session.user.currentStreak = extendedToken.currentStreak ?? 0
          session.user.longestStreak = extendedToken.longestStreak ?? 0
        } else {
          // Fallback: fetch from DB
          try {
            const { data: user } = await db.from('User').select('currentStreak, longestStreak').eq('id', extendedToken.id as string).single()

            if (user) {
              session.user.currentStreak = user.currentStreak
              session.user.longestStreak = user.longestStreak
            }
          } catch (error) {
            console.error('Failed to fetch user streak data:', error)
          }
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Note: Streak is now updated in JWT callback with trigger === 'signIn'

      // For Google sign in, ensure user settings are created and update profile
      try {
        if (account?.provider === 'google' && user.email) {
          const { data: existingUser } = await db.from('User').select('*').eq('email', user.email).single()

          // Block login for blocked users
          if (existingUser?.isBlocked) {
            return false
          }

          // Block new Google signups if signups are disabled
          if (!existingUser) {
            const { data: settings } = await db.from('SiteSettings').select('*').eq('id', 'global').single()
            if (settings && !settings.signupEnabled) {
              return false
            }
          }

          if (existingUser) {
            // Get user settings separately
            const { data: settings } = await db.from('UserSettings').select('*').eq('userId', existingUser.id).single()

            // Update user profile with Google info if not already set
            if (!existingUser.name || !existingUser.image) {
              await db.from('User').update({
                name: existingUser.name || user.name || user.email?.split('@')[0],
                image: existingUser.image || user.image,
              }).eq('id', existingUser.id)
            }

            if (!settings) {
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
      // Create default settings for new users
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
