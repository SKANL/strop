/**
 * Auth Service
 * 
 * Servicio desacoplado para operaciones de autenticación.
 * Maneja sign in, sign up, sign out, password recovery, etc.
 */

import type { SupabaseClient } from '@/lib/supabase'
import type { User as SupabaseUser, AuthError } from '@supabase/supabase-js'
import type { User } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthResult<T = unknown> {
  data: T | null
  error: AuthError | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName: string
}

export interface AuthSession {
  user: SupabaseUser | null
  profile: User | null
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export class AuthService {
  constructor(private client: SupabaseClient) {}

  /**
   * Sign in with email and password
   */
  async signInWithPassword(
    credentials: SignInCredentials
  ): Promise<AuthResult<{ user: SupabaseUser }>> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return { data: null, error }
    }

    return { data: { user: data.user }, error: null }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    credentials: SignUpCredentials
  ): Promise<AuthResult<{ user: SupabaseUser | null }>> {
    const { data, error } = await this.client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
        },
      },
    })

    if (error) {
      return { data: null, error }
    }

    return { data: { user: data.user }, error: null }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResult<void>> {
    const { error } = await this.client.auth.signOut()
    return { data: undefined, error }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<AuthSession> {
    const {
      data: { user },
    } = await this.client.auth.getUser()

    if (!user) {
      return { user: null, profile: null }
    }

    // Fetch the user profile from public.users
    const { data: profile } = await this.client
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    return { user, profile }
  }

  /**
   * Get the current authenticated user (Supabase Auth user)
   */
  async getUser(): Promise<AuthResult<SupabaseUser>> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser()

    if (error) {
      return { data: null, error }
    }

    return { data: user, error: null }
  }

  /**
   * Get the current user's profile from public.users
   */
  async getUserProfile(): Promise<{ data: User | null; error: Error | null }> {
    const { data: authUser } = await this.getUser()

    if (!authUser) {
      return { data: null, error: new Error('Not authenticated') }
    }

    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  }

  /**
   * Send password reset email
   */
  async resetPasswordForEmail(
    email: string
  ): Promise<AuthResult<void>> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    return { data: undefined, error }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<AuthResult<SupabaseUser>> {
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { data: null, error }
    }

    return { data: data.user, error: null }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: { user: SupabaseUser | null } | null) => void
  ) {
    return this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session ? { user: session.user } : null)
    })
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAuthService(client: SupabaseClient): AuthService {
  return new AuthService(client)
}
