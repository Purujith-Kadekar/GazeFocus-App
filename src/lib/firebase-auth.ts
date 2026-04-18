import type { OAuthProvider } from 'next-auth/providers/oauth'

export const FirebaseOAuth2Provider: OAuthProvider = (options) => {
  return {
    id: 'firebase',
    name: 'Firebase',
    type: 'oauth',
    clientId: process.env.AUTH_FIREBASE_ID!,
    clientSecret: process.env.AUTH_FIREBASE_SECRET!,
    authorization: {
      url: 'https://accounts.google.com/o/oauth2/v2/auth',
      params: {
        scope: 'openid email profile',
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://www.googleapis.com/oauth2/v3/userinfo',
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
    style: {
      logo: '/firebase-logo.png',
      logoDark: '/firebase-logo-dark.png',
      bg: '#fff',
      text: '#000',
      bgDark: '#000',
      textDark: '#fff',
    },
    checks: ['pkce', 'state'],
    ...options,
  }
}

export default FirebaseOAuth2Provider