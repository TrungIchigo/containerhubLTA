import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { can, Permission, type UserWithProfile } from '@/lib/authorization'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './navigation'

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['vi', 'en'],
  defaultLocale: 'vi'
})

export async function middleware(request: NextRequest) {
  // First, handle internationalization routing
  const intlResponse = intlMiddleware(request)
  
  // If intl middleware redirects (locale not in path), handle that first
  if (intlResponse && intlResponse.status === 302) {
    return intlResponse
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Handle dashboard redirect to avoid routing conflict (support locale)
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/vi/reports', request.url))
  }
  if (request.nextUrl.pathname.match(/^\/(vi|en)\/dashboard$/)) {
    const locale = request.nextUrl.pathname.match(/^\/(vi|en)/)?.[1] || 'vi'
    return NextResponse.redirect(new URL(`/${locale}/reports`, request.url))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the response to supabaseResponse:
  //    return myNewResponse
  // Refreshing the auth token
  await supabase.auth.getUser()

  // Get current path
  const path = request.nextUrl.pathname

  // Extract locale from path (e.g. /vi/login -> /login)
  const pathWithoutLocale = path.replace(/^\/(vi|en)/, '') || '/'

  // Public routes that don't require authentication (without locale prefix)
  const publicRoutes = [
    '/',
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/privacy-policy',
    '/terms-of-service'
  ]

  // Admin routes
  const adminRoutes = ['/admin']
  
  // Check if the current path is public (use path without locale)
  const isPublicRoute = publicRoutes.includes(pathWithoutLocale)
  const isAdminRoute = adminRoutes.some(route => pathWithoutLocale.startsWith(route))

  // Auth callback route - always allow
  if (path.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // API routes - let them handle their own authentication
  if (path.startsWith('/api/')) {
    return supabaseResponse
  }

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    // Extract locale for proper redirect
    const locale = path.match(/^\/(vi|en)/)?.[1] || 'vi'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  // If user is authenticated but trying to access auth pages, redirect to appropriate dashboard
  if (user && (pathWithoutLocale === '/login' || pathWithoutLocale === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    const userWithProfile: UserWithProfile = { ...user, profile }

    // Extract locale for proper redirect
    const locale = path.match(/^\/(vi|en)/)?.[1] || 'vi'
    
    if (can(userWithProfile, Permission.VIEW_ADMIN_DASHBOARD)) {
      return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, request.url))
    } else {
      return NextResponse.redirect(new URL(`/${locale}/reports`, request.url))
    }
  }

  // Handle admin routes
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    const userWithProfile: UserWithProfile = { ...user, profile }

    if (!can(userWithProfile, Permission.VIEW_ADMIN_DASHBOARD)) {
      // Extract locale for proper redirect
      const locale = path.match(/^\/(vi|en)/)?.[1] || 'vi'
      return NextResponse.redirect(new URL(`/${locale}/reports`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 