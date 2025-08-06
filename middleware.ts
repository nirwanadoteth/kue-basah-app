// Temporarily disabled to fix navigation issues with custom auth
// The Supabase middleware conflicts with the custom localStorage-based auth system

import { NextResponse } from 'next/server'

export async function middleware() {
  // For now, just pass through all requests
  // TODO: Implement proper middleware that works with custom auth or migrate to Supabase auth
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
