import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  const isAuthenticated = !!token
  const isAuthPage = pathname.startsWith("/auth/")
  const isApiAuth = pathname.startsWith("/api/auth/")
  const isStaticFile = pathname.includes(".") || pathname.startsWith("/_next")

  if (isStaticFile || isApiAuth) {
    return NextResponse.next()
  }

  if (!isAuthenticated && !isAuthPage) {
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
