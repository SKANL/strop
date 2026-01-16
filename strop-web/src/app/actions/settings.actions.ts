'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createAuthService } from '@/lib/services/auth.service'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getProfileAction(): Promise<ActionResult<{ id: string; full_name: string; email: string; avatar_url: string | null }>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error } = await authService.getUserProfile()
    if (error || !profile) return { success: false, error: 'Usuario no autenticado' }

    return {
      success: true,
      data: {
        id: profile.id,
        full_name: profile.full_name ?? '',
        email: profile.email,
        avatar_url: profile.profile_picture_url ?? null,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getProfileAction error:', err)
    return { success: false, error: message }
  }
}

export async function getOrganizationAction(): Promise<ActionResult<{ id: string; name: string; slug: string; billing_email?: string | null; logo_url?: string | null }>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, slug, billing_email, logo_url')
      .eq('id', profile.current_organization_id)
      .single()

    if (error || !org) return { success: false, error: 'Organización no encontrada' }

    return { success: true, data: org }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getOrganizationAction error:', err)
    return { success: false, error: message }
  }
}

export async function getNotificationSettingsAction(): Promise<ActionResult<any[]>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }

    // Obtener configuraciones desde user_settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', profile.id)
      .eq('key', 'notification_preferences')
      .single()

    // Si no existen configuraciones, devolver las predeterminadas
    if (error || !settings) {
      const defaultSettings = [
        { id: 'incidents', label: 'Nuevas incidencias', description: 'Cuando se crea una incidencia', email: true, push: true },
        { id: 'incident_assigned', label: 'Incidencia asignada', description: 'Cuando te asignan una incidencia', email: true, push: true },
        { id: 'incident_closed', label: 'Incidencia cerrada', description: 'Cuando se cierra una incidencia', email: false, push: true },
        { id: 'bitacora', label: 'Entradas de bitácora', description: 'Nueva entrada en la bitácora', email: false, push: false },
        { id: 'team', label: 'Cambios en el equipo', description: 'Cuando se agrega o elimina un miembro', email: true, push: false },
        { id: 'projects', label: 'Actualizaciones de proyectos', description: 'Cuando cambia el estado de un proyecto', email: true, push: true },
      ]
      return { success: true, data: defaultSettings }
    }

    return { success: true, data: settings.value as any[] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getNotificationSettingsAction error:', err)
    return { success: false, error: message }
  }
}

export async function saveNotificationSettingsAction(settings: any[]): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }

    const payload = Array.isArray(settings) ? settings : []

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { 
          user_id: profile.id, 
          key: 'notification_preferences', 
          value: payload 
        },
        { onConflict: 'user_id,key' }
      )

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('saveNotificationSettingsAction error:', err)
    return { success: false, error: message }
  }
}

export async function updatePasswordAction(newPassword: string): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('updatePasswordAction error:', err)
    return { success: false, error: message }
  }
}

export async function signOutAllAction(): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    await supabase.auth.signOut({ scope: 'global' })
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('signOutAllAction error:', err)
    return { success: false, error: message }
  }
}
