import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // If the user is trying to access the login page, let them through.
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: headers(),
  })

  // If there's no session, redirect to the login page.
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If the user is authenticated, continue to the requested page.
  return NextResponse.next()
}

export const config = {
  // The runtime must be 'nodejs' to use the auth.api in middleware.
  runtime: 'nodejs',
  /*
   * Match all request paths except for:
   * - API routes (including our auth and migration routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - Image files
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
