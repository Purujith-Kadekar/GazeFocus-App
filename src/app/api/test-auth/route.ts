import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    console.log('[Test Auth] Testing auth...');
    
    const session = await getServerSession(authOptions);
    
    console.log('[Test Auth] Session:', session);
    
    return NextResponse.json({ 
      hasSession: !!session,
      session: session ? {
        user: session.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        } : null
      } : null,
      env: {
        hasNexTauthUrl: !!process.env.NEXTAUTH_URL,
        hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        nextauthUrl: process.env.NEXTAUTH_URL
      }
    });
  } catch (error: any) {
    console.error('[Test Auth] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
