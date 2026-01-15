/**
 * Hooks Module Exports
 * 
 * Re-exports all custom hooks for convenient importing.
 */

// Mobile hook
export { useIsMobile } from './use-mobile'

// Supabase hooks
export {
  useSupabase,
  useAuth,
  useUserOrganizations,
} from './use-supabase'

// Realtime hooks
export {
  useRealtimeSubscription,
  useRealtimeIncidents,
  useRealtimeComments,
  useRealtimeBitacora,
} from './use-realtime'
export type {
  UseRealtimeSubscriptionOptions,
  UseRealtimeIncidentsOptions,
  UseRealtimeCommentsOptions,
} from './use-realtime'
