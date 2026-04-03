import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/auth/admin/login',
    '/auth/admin/signup',
    '/auth/admin/forget-password',
    '/auth/admin/verify-otp',
    '/api/auth/admin/login',
    '/api/auth/admin/signup',
    '/api/auth/admin/verify',
    '/api/auth/admin/verify-email',
    '/api/auth/user/login',
    '/api/auth/user/register',
    '/api/auth/user/forgot-password',
    '/api/auth/user/reset-password',
    '/api/auth/user/verify-email',
    '/api/auth/user/check-email',
    '/auth',
  ]

  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  )

  const token = request.cookies.get('auth_token')?.value

  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}