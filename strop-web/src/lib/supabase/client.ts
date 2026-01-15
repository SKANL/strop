/**
 * Supabase Client Configuration
 * 
 * Este módulo proporciona las funciones factory para crear clientes Supabase
 * tanto para el servidor (SSR) como para el navegador (Client).
 * 
 * Arquitectura desacoplada:
 * - createBrowserClient: Para componentes cliente
 * - createServerClient: Para Server Components, Route Handlers y Middleware
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { CookieOptions } from '@supabase/ssr'

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// ============================================================================
// BROWSER CLIENT (Singleton)
// ============================================================================

let browserClient: ReturnType<typeof createSupabaseBrowserClient<Database>> | null = null

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses singleton pattern to ensure consistent session state.
 */
export function createBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createSupabaseBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  )

  return browserClient
}

// ============================================================================
// SERVER CLIENT FACTORY
// ============================================================================

interface ServerClientOptions {
  cookies: {
    getAll: () => { name: string; value: string }[]
    setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void
  }
}

/**
 * Creates a Supabase client for use in Server Components, Route Handlers, and Middleware.
 * 
 * @param options - Cookie handlers for reading and writing cookies
 * @returns Supabase client with proper cookie handling
 */
export function createServerClient(options: ServerClientOptions) {
  return createSupabaseServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return options.cookies.getAll()
        },
        setAll(cookiesToSet) {
          options.cookies.setAll(cookiesToSet)
        },
      },
    }
  )
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SupabaseClient = ReturnType<typeof createBrowserClient>
export type SupabaseServerClient = ReturnType<typeof createServerClient>
