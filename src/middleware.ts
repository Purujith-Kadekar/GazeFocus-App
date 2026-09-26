import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { jwtVerify } from "jose"
import { verifyAdminRequest } from "@/lib/admin-auth"
import { createClient as createSupabaseClient } from "@/utils/supabase/middleware"
import { db } from "@/lib/db"

function isLocalAdminHost(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.trim().toLowerCase().split(':')[0]
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

/**
 * Verify a Bearer token from the Authorization header.
 * Used by Chrome Extension and APK to authenticate API requests.
 * Returns the decoded JWT payload or null if invalid.
 */
async function verifyBearerInMiddleware(request: NextRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    if (!payload.id || !payload.email) return null
    return { id: payload.id as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    const supabaseResponse = createSupabaseClient(request)

    // Always allow crawler-critical metadata routes.
    const isCrawlerRoute = pathname === '/sitemap.xml' || pathname === '/robots.txt'
    if (isCrawlerRoute) {
      return supabaseResponse
    }

    const isStaticFile = pathname.includes(".") || pathname.startsWith("/_next")
    const isApiAuth = pathname.startsWith("/api/auth/")

    if (isStaticFile) {
      return supabaseResponse
    }

    // --- Admin routes ---
    // Admin portal is accessible from any origin but requires admin auth.
    // The local-only restriction has been removed to allow remote access.
    // Security is enforced by the admin JWT session (verifyAdminRequest).
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      // Admin login page is always accessible
      if (pathname === "/admin/login") {
        return supabaseResponse
      }

      // All other admin routes require admin session
      const isAdmin = await verifyAdminRequest(request)
      if (!isAdmin) {
        // Redirect to admin login for page routes, return 401 for API routes
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      return supabaseResponse
    }

    // Admin API routes
    if (pathname.startsWith("/api/admin/")) {
      if (pathname.startsWith("/api/admin/auth")) {
        return supabaseResponse
      }
      const isAdmin = await verifyAdminRequest(request)
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return supabaseResponse
    }

    // --- Regular auth ---
    if (isApiAuth) {
      return supabaseResponse
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const bearerUser = await verifyBearerInMiddleware(request)
    const isAuthenticated = !!token || !!bearerUser
    const isAuthPage = pathname.startsWith("/auth/")
    const isApiRoute = pathname.startsWith("/api/")
    const publicPaths = ["/", "/404", "/privacy-policy", "/terms-and-conditions", "/about", "/faq", "/sitemap"]
    const isPublicPage = publicPaths.includes(pathname)

    // For API routes, Bearer token auth is sufficient — let them pass through
    // to the route handler which will verify the token via getCurrentUser().
    if (isApiRoute && bearerUser) {
      return supabaseResponse
    }

    if (isAuthenticated) {
      const tokenId = ((token as typeof token & { id?: string })?.id as string | undefined) || bearerUser?.id
      if (tokenId) {
        const blockedResult = await db
          .from('User')
          .select('isBlocked')
          .eq('id', tokenId)
          .maybeSingle()

        if (blockedResult.data?.isBlocked) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Your account is blocked' }, { status: 403 })
          }

          const blockedUrl = new URL('/auth/login?error=Blocked', request.url)
          const response = NextResponse.redirect(blockedUrl)
          response.cookies.delete('next-auth.session-token')
          response.cookies.delete('__Secure-next-auth.session-token')
          response.cookies.delete('next-auth.csrf-token')
          response.cookies.delete('__Secure-next-auth.callback-url')
          response.cookies.delete('next-auth.callback-url')
          return response
        }
      }
    }

    // Authenticated users are bounced off login/signup pages — EXCEPT the
    // extension OAuth bridge: launchWebAuthFlow shares the browser profile,
    // so users already signed into the webapp still need to pass through
    // here to hand the extension a token.
    if (!isAuthenticated && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    if (isAuthenticated && isAuthPage && pathname !== "/auth/extension-oauth" && pathname !== "/auth/extension-login") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)

    // Try to verify the token without DB access — the JWT check is self-contained
    // and doesn't depend on the database. If the token is valid, we know the user
    // was authenticated and the DB error was likely in the isBlocked check.
    // In that case we should let authenticated users through for page routes.
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const isAuthenticatedOnFallback = !!token
    const isAuthPage = pathname.startsWith('/auth/')
    const publicPaths = ['/', '/404', '/privacy-policy', '/terms-and-conditions', '/about', '/faq', '/sitemap']
    const isPublicPage = publicPaths.includes(pathname)

    // For API routes, return 503 Service Unavailable — API handlers may need DB data
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // For page routes:
    // - If token is valid (DB error was only in isBlocked check), let the user through
    //   rather than forcing a logout. The isBlocked status will be re-checked on the
    //   next successful middleware run.
    // - If token is invalid (we couldn't verify auth at all), redirect to login.
    if (isAuthenticatedOnFallback) {
      // Authenticated user whose DB check failed — allow page access as a grace period
      // but prevent accessing auth pages (they're already logged in), except the
      // extension OAuth bridge (see the non-fallback branch above).
      if (isAuthPage && pathname !== '/auth/extension-oauth' && pathname !== '/auth/extension-login') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return NextResponse.next()
    }

    // Unauthenticated or token verification also failed
    if (isAuthPage || isPublicPage) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
}
