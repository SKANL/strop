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
  const next = requestUrl.searchParams.get('next')

  if (token_hash && type) {
    const supabase = await createRouteHandlerClient()

    // Map incoming type to Supabase OTP type
    // Supabase Auth uses 'email' for signup confirmations, not 'signup'
    const otpType = type === 'signup' ? 'email' : type as 'email' | 'recovery' | 'invite' | 'email_change'

    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
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

    // For email confirmation (signup), redirect to success page
    if (type === 'email' || type === 'signup') {
      return NextResponse.redirect(new URL('/email-confirmed', requestUrl.origin))
    }
  }

  // Redirect to the requested page or onboarding for new users
  const redirectUrl = next ?? '/onboarding'
  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
}
