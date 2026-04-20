import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { verifyAdminRequest } from "@/lib/admin-auth"
import { createClient as createSupabaseClient } from "@/utils/supabase/middleware"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const db =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

function isLocalAdminHost(request: NextRequest): boolean {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = request.headers.get('host')
  const rawHost = (forwardedHost || hostHeader || request.nextUrl.hostname || '').trim().toLowerCase()
  const hostname = rawHost.split(':')[0]

  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
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
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Admin portal is local-only for security hardening.
      if (!isLocalAdminHost(request)) {
        return NextResponse.redirect(new URL('/404', request.url))
      }

    // Admin login page and admin auth API are always accessible
      if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
        return supabaseResponse
      }
    // All other admin routes require admin session
      const isAdmin = await verifyAdminRequest(request)
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/admin/login", request.url))
      }
      return supabaseResponse
    }

  // Admin API routes
    if (pathname.startsWith("/api/admin/")) {
      if (!isLocalAdminHost(request)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

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
    const isAuthenticated = !!token
    const isAuthPage = pathname.startsWith("/auth/")
    const publicPaths = ["/", "/404", "/privacy-policy", "/terms-and-conditions", "/about", "/faq", "/sitemap"]
    const isPublicPage = publicPaths.includes(pathname)

    if (isAuthenticated && db) {
      const tokenId = (token as any)?.id as string | undefined
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

    if (!isAuthenticated && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    if (isAuthenticated && isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return supabaseResponse
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
}
