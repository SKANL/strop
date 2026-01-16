/**
 * Next.js Middleware for Supabase Authentication
 * 
 * Este middleware:
 * 1. Refresca automáticamente las sesiones expiradas
 * 2. Protege rutas que requieren autenticación
 * 3. Redirige usuarios no autenticados al login
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/',
  '/dashboard',
  '/projects',
  '/bitacora',
  '/incidents',
  '/team',
  '/settings',
  '/organization',
  '/onboarding',
]

// Rutas que deben redirigir a dashboard si ya está autenticado
const AUTH_ROUTES = ['/login', '/register']

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ['/verify-email', '/email-confirmed']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very
  // hard to debug issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if the route is public (doesn't require auth check)
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Allow public routes without authentication
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )

  // Check if the route is an auth route (login/register)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes (login/register)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
