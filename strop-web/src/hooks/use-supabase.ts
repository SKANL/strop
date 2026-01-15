/**
 * Supabase React Hooks
 * 
 * Hooks personalizados para integración con Supabase.
 * Incluye manejo de estado, autenticación y realtime.
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { createAuthService } from '@/lib/services/auth.service'
import type { User as SupabaseUser, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { User, Organization } from '@/types/supabase'

// ============================================================================
// USE SUPABASE CLIENT
// ============================================================================

/**
 * Hook to get the Supabase browser client.
 * Returns a singleton instance.
 */
export function useSupabase() {
  const [client] = useState(() => createBrowserClient())
  return client
}

// ============================================================================
// USE AUTH
// ============================================================================

interface UseAuthReturn {
  user: SupabaseUser | null
  profile: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

/**
 * Hook for authentication state and operations.
 * Automatically subscribes to auth state changes.
 */
export function useAuth(): UseAuthReturn {
  const supabase = useSupabase()
  const authService = createAuthService(supabase)
  
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const session = await authService.getSession()
      setUser(session.user)
      setProfile(session.profile)
      setIsLoading(false)
    }

    getSession()

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profileData } = await authService.getUserProfile()
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await authService.signInWithPassword({ email, password })
      return { error }
    },
    [authService]
  )

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await authService.signUp({ email, password, fullName })
      return { error }
    },
    [authService]
  )

  const signOut = useCallback(async () => {
    const { error } = await authService.signOut()
    return { error }
  }, [authService])

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await authService.resetPasswordForEmail(email)
      return { error }
    },
    [authService]
  )

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}

// ============================================================================
// USE USER ORGANIZATIONS
// ============================================================================

interface UseUserOrganizationsReturn {
  organizations: Organization[]
  currentOrganization: Organization | null
  isLoading: boolean
  error: Error | null
  switchOrganization: (orgId: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook to get the current user's organizations.
 */
export function useUserOrganizations(): UseUserOrganizationsReturn {
  const supabase = useSupabase()
  const { profile } = useAuth()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrganizations = useCallback(async () => {
    if (!profile) {
      setOrganizations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select(`
          organizations (*)
        `)
        .eq('user_id', profile.id)

      if (fetchError) {
        setError(new Error(fetchError.message))
        return
      }

      const orgs = data
        ?.map((m) => m.organizations)
        .filter((org): org is Organization => org !== null) ?? []
      
      setOrganizations(orgs)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, profile])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const currentOrganization = organizations.find(
    (org) => org.id === profile?.current_organization_id
  ) ?? organizations[0] ?? null

  const switchOrganization = useCallback(
    async (orgId: string) => {
      const { error: switchError } = await supabase.rpc('switch_organization', {
        target_org_id: orgId,
      })

      if (switchError) {
        setError(new Error(switchError.message))
        return
      }

      // Refetch to update state
      await fetchOrganizations()
    },
    [supabase, fetchOrganizations]
  )

  return {
    organizations,
    currentOrganization,
    isLoading,
    error,
    switchOrganization,
    refetch: fetchOrganizations,
  }
}

// ============================================================================
// USE REALTIME SUBSCRIPTION
// ============================================================================

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions<T> {
  table: string
  schema?: string
  event?: RealtimeEvent
  filter?: string
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
  onChange?: (payload: { eventType: RealtimeEvent; old: T | null; new: T | null }) => void
}

/**
 * Hook for realtime subscriptions to database changes.
 * 
 * @example
 * ```tsx
 * useRealtime({
 *   table: 'incidents',
 *   filter: `project_id=eq.${projectId}`,
 *   onInsert: (incident) => {
 *     setIncidents((prev) => [incident, ...prev])
 *   },
 *   onUpdate: ({ new: updated }) => {
 *     setIncidents((prev) => 
 *       prev.map((i) => i.id === updated.id ? updated : i)
 *     )
 *   },
 * })
 * ```
 */
export function useRealtime<T extends Record<string, unknown>>(
  options: UseRealtimeOptions<T>
) {
  const supabase = useSupabase()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channelName = `${options.schema ?? 'public'}_${options.table}_changes`
    
    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: options.event ?? '*',
          schema: options.schema ?? 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const eventType = payload.eventType as RealtimeEvent

          // Call specific handlers
          if (eventType === 'INSERT' && options.onInsert && payload.new) {
            options.onInsert(payload.new as T)
          } else if (eventType === 'UPDATE' && options.onUpdate && payload.old && payload.new) {
            options.onUpdate({
              old: payload.old as T,
              new: payload.new as T,
            })
          } else if (eventType === 'DELETE' && options.onDelete && payload.old) {
            options.onDelete(payload.old as T)
          }

          // Call generic handler
          if (options.onChange) {
            options.onChange({
              eventType,
              old: (payload.old as T) ?? null,
              new: (payload.new as T) ?? null,
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supabase,
    options.table,
    options.schema,
    options.event,
    options.filter,
  ])
}

// ============================================================================
// USE REALTIME INCIDENTS
// ============================================================================

interface UseRealtimeIncidentsOptions {
  projectId: string
  onNewIncident?: (incident: Record<string, unknown>) => void
  onUpdatedIncident?: (incident: Record<string, unknown>) => void
}

/**
 * Hook for realtime incident updates.
 * Automatically subscribes to INSERT and UPDATE events for a project's incidents.
 */
export function useRealtimeIncidents(options: UseRealtimeIncidentsOptions) {
  useRealtime({
    table: 'incidents',
    filter: `project_id=eq.${options.projectId}`,
    onInsert: options.onNewIncident,
    onUpdate: ({ new: updated }) => {
      if (options.onUpdatedIncident) {
        options.onUpdatedIncident(updated)
      }
    },
  })
}

// ============================================================================
// USE REALTIME COMMENTS
// ============================================================================

interface UseRealtimeCommentsOptions {
  incidentId: string
  onNewComment?: (comment: Record<string, unknown>) => void
}

/**
 * Hook for realtime comment updates on an incident.
 */
export function useRealtimeComments(options: UseRealtimeCommentsOptions) {
  useRealtime({
    table: 'comments',
    filter: `incident_id=eq.${options.incidentId}`,
    onInsert: options.onNewComment,
  })
}

// ============================================================================
// USE REALTIME BITACORA
// ============================================================================

interface UseRealtimeBitacoraOptions {
  projectId: string
  onNewEntry?: (entry: Record<string, unknown>) => void
  onUpdatedEntry?: (entry: Record<string, unknown>) => void
}

/**
 * Hook for realtime bitacora entry updates.
 */
export function useRealtimeBitacora(options: UseRealtimeBitacoraOptions) {
  useRealtime({
    table: 'bitacora_entries',
    filter: `project_id=eq.${options.projectId}`,
    onInsert: options.onNewEntry,
    onUpdate: ({ new: updated }) => {
      if (options.onUpdatedEntry) {
        options.onUpdatedEntry(updated)
      }
    },
  })
}
