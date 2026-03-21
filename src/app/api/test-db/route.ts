import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('[Test DB] Testing database connection...');
    
    const { data, error } = await db.from('User').select('count').limit(1);
    
    console.log('[Test DB] Result:', { data, error });
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (error: any) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
