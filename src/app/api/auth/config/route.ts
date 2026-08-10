import { NextResponse } from 'next/server'

/**
 * Auth Configuration API — returns public auth configuration.
 * This endpoint is used by the Chrome Extension and APK to get the
 * Supabase URL, anon key, and Firebase config for client-side auth.
 * Only exposes public/non-sensitive configuration.
 */
export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
    // Firebase config — same as NEXT_PUBLIC_ env vars used by the webapp
    firebaseConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    },
    // Never expose service role key, NEXTAUTH_SECRET, or Firebase Admin credentials
  })
}
