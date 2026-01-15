/**
 * Supabase Module Exports
 * 
 * Re-exports all Supabase utilities for convenient importing.
 */

// Client utilities
export { createBrowserClient, createServerClient } from './client'
export type { SupabaseClient, SupabaseServerClient } from './client'

// Server utilities
export {
  createServerComponentClient,
  createRouteHandlerClient,
  createServerActionClient,
} from './server'

// Types
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from '@/types/supabase'
