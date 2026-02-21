import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js v5 configuration
 * - Google OAuth with PKCE (enabled by default in Auth.js v5)
 * - Requests YouTube readonly scope to fetch playlists
 * - Stores access token in JWT for API calls (never sent to our backend)
 * - HttpOnly secure cookies by default
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            // YouTube readonly — fetch playlists & playlist items
            "https://www.googleapis.com/auth/youtube.readonly",
          ].join(" "),
          // Force consent screen to always show (ensures refresh token)
          access_type: "offline",
          prompt: "consent",
          // PKCE is automatic in Auth.js v5
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    /**
     * Persist access token and refresh token into the JWT
     * so we can call YouTube API from client via our API route
     */
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    /**
     * Expose minimal session data to client
     * We intentionally expose accessToken so client can call YouTube API
     * (This is standard OAuth pattern — token is scoped to YouTube readonly only)
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  // Trust Vercel's proxy headers
  trustHost: true,
});
