/**
 * Supabase Auth Provider
 * 
 * Provee el contexto de autenticación a toda la aplicación.
 * Maneja el estado de sesión y cambios de autenticación.
 */

'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, Organization, UserRole } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextValue {
  supabase: SupabaseClient
  user: SupabaseUser | null
  profile: User | null
  currentOrganization: Organization | null
  currentRole: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [supabase] = useState(() => createBrowserClient())
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile and organization data
  const fetchUserData = async (authUser: SupabaseUser) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError)
        return
      }

      setProfile(profileData)

      // Get current organization if set
      if (profileData.current_organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.current_organization_id)
          .single()

        if (!orgError && orgData) {
          setCurrentOrganization(orgData)
        }

        // Get user's role in the organization
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', profileData.id)
          .eq('organization_id', profileData.current_organization_id)
          .single()

        if (!memberError && memberData) {
          setCurrentRole(memberData.role)
        }
      }
    } catch (err) {
      console.error('Error in fetchUserData:', err)
    }
  }

  // Refresh session manually
  const refreshSession = async () => {
    const { data: { user: refreshedUser } } = await supabase.auth.getUser()
    
    if (refreshedUser) {
      setUser(refreshedUser)
      await fetchUserData(refreshedUser)
    } else {
      setUser(null)
      setProfile(null)
      setCurrentOrganization(null)
      setCurrentRole(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: initialUser } } = await supabase.auth.getUser()
        
        if (initialUser) {
          setUser(initialUser)
          await fetchUserData(initialUser)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchUserData(session.user)
        } else {
          setUser(null)
          setProfile(null)
          setCurrentOrganization(null)
          setCurrentRole(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // Memoize context value
  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      user,
      profile,
      currentOrganization,
      currentRole,
      isLoading,
      isAuthenticated: !!user,
      refreshSession,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, user, profile, currentOrganization, currentRole, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the auth context.
 * Must be used within an AuthProvider.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, profile, isAuthenticated } = useAuthContext()
 *   
 *   if (!isAuthenticated) {
 *     return <LoginPrompt />
 *   }
 *   
 *   return <div>Welcome, {profile?.full_name}</div>
 * }
 * ```
 */
export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}
