/**
 * Auth Server Actions
 * 
 * Server actions for authentication operations.
 * These run on the server and can safely access cookies.
 */

'use server'

import { redirect } from 'next/navigation'
import { createServerActionClient } from '@/lib/supabase/server'
import { createAuthService } from '@/lib/services/auth.service'
import { createOrganizationsService } from '@/lib/services/organizations.service'

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult {
  success: boolean
  error?: string
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signInAction(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)

  const { error } = await authService.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: error.message }
  }

  redirect('/dashboard')
}

/**
 * Sign up with email and password
 */
export async function signUpAction(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const inviteToken = formData.get('inviteToken') as string

  if (!email || !password || !fullName) {
    return { success: false, error: 'All fields are required' }
  }

  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)

  // If there is an invitation, we want to redirect back to the invite page after confirmation
  const redirectTo = inviteToken 
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${inviteToken}` 
    : undefined

  const { error } = await authService.signUp({ 
    email, 
    password, 
    fullName,
    redirectTo 
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // User needs to confirm email
  return {
    success: true,
  }
}

/**
 * Sign out the current user
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)

  await authService.signOut()

  redirect('/login')
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmailAction(
  email: string
): Promise<ActionResult> {
  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)

  const { error } = await authService.resendConfirmationEmail(email)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Request password reset
 */
export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)

  const { error } = await authService.resetPasswordForEmail(email)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update password (for authenticated users or after reset)
 */
export async function updatePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { success: false, error: 'Both password fields are required' }
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)

  const { error } = await authService.updatePassword(password)

  if (error) {
    return { success: false, error: error.message }
  }

  redirect('/dashboard')
}

/**
 * Complete onboarding: Create organization and user profile
 */
export async function completeOnboardingAction(
  formData: FormData
): Promise<ActionResult> {
  const organizationName = formData.get('organizationName') as string
  const organizationSlug = formData.get('organizationSlug') as string

  if (!organizationName || !organizationSlug) {
    return { success: false, error: 'Organization name and slug are required' }
  }

  try {
    const supabase = await createServerActionClient()
    const organizationsService = createOrganizationsService(supabase)

    // Create organization using RPC function (plan will default to STARTER in the service)
    const { data: organizationId, error: orgError } = await organizationsService.createOrganization(
      organizationName,
      organizationSlug
    )

    if (orgError || !organizationId) {
      return { 
        success: false, 
        error: orgError?.message ?? 'Failed to create organization' 
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }

  // Redirect to dashboard after successful onboarding (outside try/catch)
  redirect('/dashboard')
}
