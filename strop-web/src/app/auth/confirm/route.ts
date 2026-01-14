/**
 * Auth Confirm Route Handler
 * 
 * Handles email confirmation links from Supabase Auth.
 * Verifies the token and redirects the user appropriately.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createRouteHandlerClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'email' | 'recovery' | 'invite' | 'email_change',
      token_hash,
    })

    if (error) {
      console.error('Auth confirm error:', error.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // For password recovery, redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reset-password', requestUrl.origin))
    }
  }

  // Redirect to the requested page or dashboard
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
