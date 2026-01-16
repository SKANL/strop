'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createAuthService } from '@/lib/services/auth.service'
import type { UserRole } from '@/types'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  projects: number
  isActive: boolean
}

/**
 * Get organization projects for selection lists
 */
export async function getOrganizationProjectsAction(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', profile.current_organization_id)
      .eq('status', 'ACTIVE')
      .order('name')

    if (error) return { success: false, error: error.message }

    return { success: true, data: projects ?? [] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getOrganizationProjectsAction error:', err)
    return { success: false, error: message }
  }
}

export async function inviteMemberAction(
  rawEmail: string,
  role: string,
  project_id?: string
): Promise<ActionResult<{ invitation_token: string }>> {
  const email = rawEmail.toLowerCase();
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    // Get organization name for the email
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.current_organization_id)
      .single()

    const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const payload: any = {
      organization_id: profile.current_organization_id,
      email,
      role,
      invited_by: profile.id,
      invitation_token: token,
      expires_at: expiresAt,
    }

    if (project_id) payload.project_id = project_id

    const { data, error } = await supabase.from('invitations').insert(payload).select().single()

    if (error || !data) return { success: false, error: error?.message || 'Error creating invitation' }

    // Send invitation email via Edge Function
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${data.invitation_token}`
    const { error: fnError } = await supabase.functions.invoke('send-invitation', {
      body: {
        to: email,
        inviterName: profile.full_name || 'Tu equipo',
        orgName: org?.name || 'la organización',
        role: role,
        inviteUrl: inviteUrl,
      },
    })

    if (fnError) {
      console.error('Error sending invitation email:', fnError)
      // Rollback: delete the invitation so it can be retried
      await supabase.from('invitations').delete().eq('invitation_token', data.invitation_token)
      return { success: false, error: `Error enviando correo: ${fnError.message || JSON.stringify(fnError)}` }
    }

    return { success: true, data: { invitation_token: data.invitation_token } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('inviteMemberAction error:', err)
    return { success: false, error: message }
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all team members for the organization
 */
export async function getTeamMembersAction(): Promise<ActionResult<TeamMember[]>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    // Get current user
    const { data: profile, error: profileError } = await authService.getUserProfile()

    if (profileError || !profile) {
      return { success: false, error: 'Usuario no autenticado', data: [] }
    }

    if (!profile.current_organization_id) {
      return { success: false, error: 'No hay organización seleccionada', data: [] }
    }

    // Get organization members with user details
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', profile.current_organization_id)

    if (error) {
      console.error('Error fetching team members:', error)
      return { success: false, error: error.message, data: [] }
    }

    // Get user details and project counts for each member
    const teamMembers = await Promise.all(
      (members || []).map(async (member: any) => {
        // Get user details
        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name, is_active')
          .eq('id', member.user_id)
          .single()

        // Get project count
        const { count } = await supabase
          .from('project_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', member.user_id)

        return {
          id: member.user_id,
          name: user?.full_name || 'Usuario',
          email: user?.email || '',
          role: member.role as UserRole,
          projects: count ?? 0,
          isActive: user?.is_active ?? true,
        }
      })
    )

    // Sort by role priority
    const rolePriority = { OWNER: 0, SUPERINTENDENT: 1, RESIDENT: 2, CABO: 3 }
    teamMembers.sort((a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99))

    return { success: true, data: teamMembers }
  } catch (error) {
    console.error('Unexpected error in getTeamMembersAction:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: `Error inesperado: ${message}`, data: [] }
  }
}

/**
 * Get single team member by id
 */
export async function getTeamMemberAction(id: string): Promise<ActionResult<any>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, profile_picture_url, is_active, current_organization_id, created_at, updated_at')
      .eq('id', id)
      .single()

    if (!user) return { success: false, error: 'Usuario no encontrado' }

    // Ensure same organization membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', id)
      .eq('organization_id', profile.current_organization_id)
      .single()
    
    if (!member) return { success: false, error: 'Usuario no pertenece a esta organización' }

    const { data: projectsData } = await supabase
      .from('project_members')
      .select('projects!project_members_project_id_fkey (id, name)')
      .eq('user_id', id)
      .eq('organization_id', profile.current_organization_id)

    const projects = (projectsData ?? [])
      .map((p: any) => p.projects)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id, name: p.name }))

    return {
      success: true,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.profile_picture_url ?? null,
        role: (member?.role ?? 'CABO'),
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        projects,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getTeamMemberAction error:', err)
    return { success: false, error: message }
  }
}

/**
 * Update team member (profile fields, role, active state)
 */
export async function updateTeamMemberAction(
  userId: string,
  updates: {
    full_name?: string
    phone?: string
    role?: UserRole
    is_active?: boolean
  }
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    // Update users table fields
    const userUpdates: any = {}
    if (typeof updates.full_name !== 'undefined') userUpdates.full_name = updates.full_name
    if (typeof updates.phone !== 'undefined') userUpdates.phone = updates.phone
    if (typeof updates.is_active !== 'undefined') userUpdates.is_active = updates.is_active

    if (Object.keys(userUpdates).length > 0) {
      const { error } = await supabase.from('users').update(userUpdates).eq('id', userId)
      if (error) return { success: false, error: error.message }
    }

    // Update role in organization_members
    if (typeof updates.role !== 'undefined') {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: updates.role })
        .match({ user_id: userId, organization_id: profile.current_organization_id })

      if (error) return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('updateTeamMemberAction error:', err)
    return { success: false, error: message }
  }
}

export async function deactivateTeamMemberAction(userId: string): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const { error } = await supabase.from('users').update({ is_active: false }).eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('deactivateTeamMemberAction error:', err)
    return { success: false, error: message }
  }
}

export async function resetUserPasswordAction(email: string): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('resetUserPasswordAction error:', err)
    return { success: false, error: message }
  }
}

/**
 * Get user recent activity (incidents, bitacora entries)
 */
export async function getUserRecentActivityAction(userId: string): Promise<ActionResult<Array<{
  action: string
  time: string
  type: 'incident' | 'bitacora'
}>>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    const activities: Array<{ action: string; time: string; type: 'incident' | 'bitacora'; created_at: Date }> = []

    // Get recent incidents created or closed by user
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, title, status, created_at, closed_at, created_by, closed_by')
      .eq('organization_id', profile.current_organization_id)
      .or(`created_by.eq.${userId},closed_by.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (incidents) {
      for (const incident of incidents) {
        if (incident.created_by === userId && incident.created_at) {
          activities.push({
            action: 'Reportó una incidencia',
            time: incident.created_at,
            type: 'incident',
            created_at: new Date(incident.created_at)
          })
        }
        if (incident.closed_by === userId && incident.closed_at) {
          activities.push({
            action: 'Cerró una incidencia',
            time: incident.closed_at,
            type: 'incident',
            created_at: new Date(incident.closed_at)
          })
        }
      }
    }

    // Get recent bitacora entries
    const { data: entries } = await supabase
      .from('bitacora_entries')
      .select('id, title, created_at, source')
      .eq('organization_id', profile.current_organization_id)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (entries) {
      for (const entry of entries) {
        if (entry.created_at) {
          activities.push({
            action: 'Agregó entrada a bitácora',
            time: entry.created_at,
            type: 'bitacora',
            created_at: new Date(entry.created_at)
          })
        }
      }
    }

    // Sort by date descending and take top 5
    activities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    const recentActivities = activities.slice(0, 5).map(({ action, time, type }) => ({ action, time, type }))

    return { success: true, data: recentActivities }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getUserRecentActivityAction error:', err)
    return { success: false, error: message }
  }
}

/**
 * Get user statistics (incidents, bitacora entries counts)
 */
export async function getUserStatsAction(userId: string): Promise<ActionResult<{
  incidentsReported: number
  incidentsClosed: number
  bitacoraEntries: number
}>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    // Count incidents reported
    const { count: reported } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.current_organization_id)
      .eq('created_by', userId)

    // Count incidents closed
    const { count: closed } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.current_organization_id)
      .eq('closed_by', userId)

    // Count bitacora entries
    const { count: entries } = await supabase
      .from('bitacora_entries')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.current_organization_id)
      .eq('created_by', userId)

    return {
      success: true,
      data: {
        incidentsReported: reported ?? 0,
        incidentsClosed: closed ?? 0,
        bitacoraEntries: entries ?? 0,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getUserStatsAction error:', err)
    return { success: false, error: message }
  }
}
