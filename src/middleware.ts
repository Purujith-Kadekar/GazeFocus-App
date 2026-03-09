import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { verifyAdminRequest } from "@/lib/admin-auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isStaticFile = pathname.includes(".") || pathname.startsWith("/_next")
  const isApiAuth = pathname.startsWith("/api/auth/")

  if (isStaticFile) {
    return NextResponse.next()
  }

  // --- Admin routes ---
  if (pathname.startsWith("/admin")) {
    // Admin login page and admin auth API are always accessible
    if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
      return NextResponse.next()
    }
    // All other admin routes require admin session
    const isAdmin = await verifyAdminRequest(request)
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
    return NextResponse.next()
  }

  // Admin API routes
  if (pathname.startsWith("/api/admin/")) {
    if (pathname.startsWith("/api/admin/auth")) {
      return NextResponse.next()
    }
    const isAdmin = await verifyAdminRequest(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // --- Regular auth ---
  if (isApiAuth) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token
  const isAuthPage = pathname.startsWith("/auth/")
  const isPublicPage = pathname === "/"

  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
}
