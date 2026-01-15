/**
 * Realtime Hook
 * 
 * Custom hook para suscribirse a cambios en tiempo real de Supabase.
 * Soporta Postgres changes para incidents, comments y bitácora.
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSupabase } from './use-supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface UseRealtimeSubscriptionOptions {
  /** Tabla a observar */
  table: string
  /** Evento a escuchar */
  event?: DatabaseEvent
  /** Filtro PostgreSQL (ej: "organization_id=eq.{orgId}") */
  filter?: string
  /** Callback cuando hay cambios */
  onUpdate?: (payload: any) => void
  /** Callback cuando hay error */
  onError?: (error: Error) => void
  /** Habilitado por defecto */
  enabled?: boolean
}

export interface UseRealtimeIncidentsOptions
  extends Omit<UseRealtimeSubscriptionOptions, 'table'> {
  organizationId: string
  projectId?: string
}

export interface UseRealtimeCommentsOptions
  extends Omit<UseRealtimeSubscriptionOptions, 'table'> {
  incidentId: string
}

// ============================================================================
// CUSTOM HOOK - GENERIC SUBSCRIPTION
// ============================================================================

export function useRealtimeSubscription(
  options: UseRealtimeSubscriptionOptions
) {
  const client = useSupabase()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const subscribe = useCallback(async () => {
    if (!client || !options.enabled) return

    try {
      // Crear canal único
      const channelName = `${options.table}:${options.filter || '*'}`
      const channel = client.channel(channelName, {
        config: {
          broadcast: {
            self: true,
          },
          presence: {
            key: channelName,
          },
        },
      })

      // Suscribirse a cambios PostgreSQL
      channel.on(
        'postgres_changes' as any,
        {
          event: options.event ?? '*',
          schema: 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload: any) => {
          setError(null)
          options.onUpdate?.(payload)
        }
      )

      // Subscribe y manejar errores
      const subscription = await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR') {
          const err = new Error(`Subscription error on ${options.table}`)
          setError(err)
          options.onError?.(err)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        }
      })

      channelRef.current = channel
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
    }
  }, [client, options])

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [])

  // Cleanup on mount/unmount
  useEffect(() => {
    if (options.enabled !== false) {
      subscribe()
    }

    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe, options.enabled])

  return { isConnected, error }
}

// ============================================================================
// CUSTOM HOOK - INCIDENTS REALTIME
// ============================================================================

export function useRealtimeIncidents(
  options: UseRealtimeIncidentsOptions
) {
  const [incidents, setIncidents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Construir filtro
  const filter = options.projectId
    ? `organization_id=eq.${options.organizationId},project_id=eq.${options.projectId}`
    : `organization_id=eq.${options.organizationId}`

  const { isConnected, error } = useRealtimeSubscription({
    table: 'incidents',
    event: options.event || '*',
    filter,
    onUpdate: (payload) => {
      setIncidents((prev) => {
        // El payload contiene: eventType, new, old
        const { new: newIncident, old: oldIncident, eventType } = payload

        if (eventType === 'INSERT') {
          return [newIncident, ...prev]
        } else if (eventType === 'UPDATE') {
          return prev.map((incident) =>
            incident.id === newIncident.id ? newIncident : incident
          )
        } else if (eventType === 'DELETE') {
          return prev.filter((incident) => incident.id !== oldIncident.id)
        }

        return prev
      })

      options.onUpdate?.(payload)
    },
    onError: options.onError,
    enabled: options.enabled,
  })

  return { incidents, isConnected, isLoading, error }
}

// ============================================================================
// CUSTOM HOOK - COMMENTS REALTIME
// ============================================================================

export function useRealtimeComments(
  options: UseRealtimeCommentsOptions
) {
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const filter = `incident_id=eq.${options.incidentId}`

  const { isConnected, error } = useRealtimeSubscription({
    table: 'comments',
    event: options.event || '*',
    filter,
    onUpdate: (payload) => {
      setComments((prev) => {
        const { new: newComment, old: oldComment, eventType } = payload

        if (eventType === 'INSERT') {
          return [...prev, newComment]
        } else if (eventType === 'UPDATE') {
          return prev.map((comment) =>
            comment.id === newComment.id ? newComment : comment
          )
        } else if (eventType === 'DELETE') {
          return prev.filter((comment) => comment.id !== oldComment.id)
        }

        return prev
      })

      options.onUpdate?.(payload)
    },
    onError: options.onError,
    enabled: options.enabled,
  })

  return { comments, isConnected, isLoading, error }
}

// ============================================================================
// CUSTOM HOOK - BITACORA REALTIME
// ============================================================================

export function useRealtimeBitacora(
  options: Omit<UseRealtimeSubscriptionOptions, 'table'> & {
    projectId: string
  }
) {
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const filter = `project_id=eq.${options.projectId}`

  const { isConnected, error } = useRealtimeSubscription({
    table: 'bitacora_entries',
    event: options.event || 'INSERT',
    filter,
    onUpdate: (payload) => {
      setEntries((prev) => {
        const { new: newEntry, old: oldEntry, eventType } = payload

        if (eventType === 'INSERT') {
          return [newEntry, ...prev]
        } else if (eventType === 'UPDATE') {
          return prev.map((entry) =>
            entry.id === newEntry.id ? newEntry : entry
          )
        } else if (eventType === 'DELETE') {
          return prev.filter((entry) => entry.id !== oldEntry.id)
        }

        return prev
      })

      options.onUpdate?.(payload)
    },
    onError: options.onError,
    enabled: options.enabled,
  })

  return { entries, isConnected, isLoading, error }
}
