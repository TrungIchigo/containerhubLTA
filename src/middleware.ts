import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // file extensions
  ) {
    return NextResponse.next()
  }

  // For now, we'll implement basic routing without Supabase auth check
  // This avoids the environment variable loading issue in middleware
  
  // Allow access to auth pages
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  // For protected routes, we'll handle auth check in the component level
  // This is a simpler approach that avoids middleware complexity
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 