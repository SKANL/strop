/**
 * Supabase Server Utilities
 * 
 * Funciones helper para crear clientes Supabase en diferentes contextos del servidor:
 * - Server Components (read-only)
 * - Route Handlers (with mutations)
 * - Server Actions (with mutations)
 */

import { cookies } from 'next/headers'
import { createServerClient } from './client'

/**
 * Creates a Supabase client for Server Components.
 * 
 * Note: Server Components are read-only by nature. If you need to
 * perform auth mutations (signIn, signOut, etc.), use Route Handlers
 * or Server Actions instead.
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * import { createServerComponentClient } from '@/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createServerComponentClient()
 *   const { data: projects } = await supabase.from('projects').select('*')
 *   return <ProjectList projects={projects} />
 * }
 * ```
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()

  return createServerClient({
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // In Server Components, we can't set cookies.
          // This is expected and can be safely ignored if you're only reading.
          // Session refresh should happen in middleware.
        }
      },
    },
  })
}

/**
 * Creates a Supabase client for Route Handlers.
 * Supports both reading and writing cookies.
 * 
 * @example
 * ```ts
 * // In a Route Handler (app/api/example/route.ts)
 * import { createRouteHandlerClient } from '@/lib/supabase/server'
 * 
 * export async function POST(request: Request) {
 *   const supabase = await createRouteHandlerClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   return Response.json({ user })
 * }
 * ```
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient({
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}

/**
 * Creates a Supabase client for Server Actions.
 * Supports both reading and writing cookies.
 * 
 * @example
 * ```ts
 * // In a Server Action
 * 'use server'
 * import { createServerActionClient } from '@/lib/supabase/server'
 * 
 * export async function createProject(formData: FormData) {
 *   const supabase = await createServerActionClient()
 *   const { data, error } = await supabase.from('projects').insert({...})
 *   return { data, error }
 * }
 * ```
 */
export async function createServerActionClient() {
  const cookieStore = await cookies()

  return createServerClient({
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}
