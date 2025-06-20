import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { can, Permission, type UserWithProfile } from '@/lib/authorization'

export async function middleware(request: NextRequest) {
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

  // Handle dashboard redirect to avoid routing conflict
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/reports', request.url))
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

  // Public routes that don't require authentication
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
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.includes(path)
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

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
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated but trying to access auth pages, redirect to appropriate dashboard
  if (user && (path === '/login' || path === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    const userWithProfile: UserWithProfile = { ...user, profile }

    if (can(userWithProfile, Permission.VIEW_ADMIN_DASHBOARD)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/reports', request.url))
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
      return NextResponse.redirect(new URL('/reports', request.url))
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