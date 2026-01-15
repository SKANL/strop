/**
 * Incident Server Actions
 * 
 * Server actions for incident CRUD operations.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase/server'
import { createIncidentsService } from '@/lib/services/incidents.service'
import { createAuthService } from '@/lib/services/auth.service'
import type { TablesInsert, TablesUpdate, IncidentType, IncidentPriority, IncidentStatus } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Create a new incident
 */
export async function createIncidentAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; organization_id: string }>> {
  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)
  const incidentsService = createIncidentsService(supabase)

  const { data: profile, error: profileError } = await authService.getUserProfile()

  if (profileError || !profile) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!profile.current_organization_id) {
    return { success: false, error: 'No organization selected' }
  }

  const incidentData: TablesInsert<'incidents'> = {
    organization_id: profile.current_organization_id,
    project_id: projectId,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as IncidentType,
    priority: (formData.get('priority') as IncidentPriority) ?? 'NORMAL',
    location: formData.get('location') as string | null,
    created_by: profile.id,
  }

  const { data, error } = await incidentsService.createIncident(incidentData)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}/incidents`)

  return { success: true, data: { id: data!.id, organization_id: incidentData.organization_id } }
}

/**
 * Update an incident
 */
export async function updateIncidentAction(
  incidentId: string,
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const incidentsService = createIncidentsService(supabase)

  const updates: TablesUpdate<'incidents'> = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as IncidentType,
    priority: formData.get('priority') as IncidentPriority,
    location: formData.get('location') as string | null,
  }

  const { error } = await incidentsService.updateIncident(incidentId, updates)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}/incidents/${incidentId}`)
  revalidatePath(`/projects/${projectId}/incidents`)

  return { success: true }
}

/**
 * Assign an incident to a user
 */
export async function assignIncidentAction(
  incidentId: string,
  userId: string,
  projectId?: string
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const incidentsService = createIncidentsService(supabase)

  const { error } = await incidentsService.assignIncident(incidentId, userId)

  if (error) {
    return { success: false, error: error.message }
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}/incidents/${incidentId}`)
    revalidatePath(`/projects/${projectId}/incidents`)
  }

  return { success: true }
}

/**
 * Close an incident
 */
export async function closeIncidentAction(
  incidentId: string,
  projectId?: string,
  notes?: string
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)
  const incidentsService = createIncidentsService(supabase)

  const { data: profile } = await authService.getUserProfile()

  if (!profile) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await incidentsService.closeIncident(
    incidentId,
    profile.id,
    notes
  )

  if (error) {
    return { success: false, error: error.message }
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}/incidents/${incidentId}`)
    revalidatePath(`/projects/${projectId}/incidents`)
  }

  return { success: true }
}

/**
 * Reopen an incident
 */
export async function reopenIncidentAction(
  incidentId: string,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const incidentsService = createIncidentsService(supabase)

  const { error } = await incidentsService.reopenIncident(incidentId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}/incidents/${incidentId}`)
  revalidatePath(`/projects/${projectId}/incidents`)

  return { success: true }
}

/**
 * Add a comment to an incident
 */
export async function addCommentAction(
  incidentId: string,
  projectId: string,
  text: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)
  const incidentsService = createIncidentsService(supabase)

  const { data: profile } = await authService.getUserProfile()

  if (!profile?.current_organization_id) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await incidentsService.addComment({
    organization_id: profile.current_organization_id,
    incident_id: incidentId,
    author_id: profile.id,
    text,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}/incidents/${incidentId}`)

  return { success: true, data: { id: data!.id } }
}

/**
 * Get all incidents for the organization
 */
export async function getIncidentsAction(): Promise<
  ActionResult<{
    id: string
    title: string
    type: string
    priority: IncidentPriority
    status: IncidentStatus
    project: string
    assignee: string | null
    createdAt: string
  }[]>
> {
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

    // Use incidents service to fetch all incidents for organization (RLS will filter)
    const incidentsService = createIncidentsService(supabase)
    const { data: incidents, error } = await incidentsService.getOrganizationIncidents({
      limit: 100,
    })

    if (error || !incidents) {
      console.error('Error fetching incidents:', error)
      return { success: false, error: error?.message || 'Error al obtener incidencias', data: [] }
    }

    // Get additional data (project names, assignee names)
    const incidentsWithDetails = await Promise.all(
      incidents.map(async (incident) => {
        const [projectResult, assigneeResult] = await Promise.all([
          supabase
            .from('projects')
            .select('name')
            .eq('id', incident.project_id)
            .single(),
          incident.assigned_to
            ? supabase
                .from('users')
                .select('full_name')
                .eq('id', incident.assigned_to)
                .single()
            : Promise.resolve({ data: null }),
        ])

        return {
          id: incident.id,
          title: incident.title,
          type: incident.type,
          priority: incident.priority as IncidentPriority,
          status: incident.status as IncidentStatus,
          project: projectResult.data?.name ?? 'Proyecto desconocido',
          assignee: assigneeResult.data?.full_name ?? null,
          createdAt: incident.created_at?.split('T')[0] ?? '',
        }
      })
    )

    return { success: true, data: incidentsWithDetails }
  } catch (error) {
    console.error('Unexpected error in getIncidentsAction:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: `Error inesperado: ${message}`, data: [] }
  }
}
