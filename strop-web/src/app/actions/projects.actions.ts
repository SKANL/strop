/**
 * Project Server Actions
 * 
 * Server actions for project CRUD operations.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase/server'
import { createProjectsService } from '@/lib/services/projects.service'
import { createAuthService } from '@/lib/services/auth.service'
import type { TablesInsert, TablesUpdate, ProjectRole } from '@/types/supabase'

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
 * Create a new project
 */
export async function createProjectAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)
    const projectsService = createProjectsService(supabase)

    // Get current user
    const { data: profile, error: profileError } = await authService.getUserProfile()

    if (profileError || !profile) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    if (!profile.current_organization_id) {
      return { success: false, error: 'No hay organización seleccionada' }
    }

    // Extract form data
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const description = formData.get('description') as string;
    const status = (formData.get('status') as string) || 'ACTIVE';

    // Validate required fields
    if (!name?.trim()) {
      return { success: false, error: 'El nombre del proyecto es requerido' }
    }

    if (!location?.trim()) {
      return { success: false, error: 'La ubicación es requerida' }
    }

    if (!start_date) {
      return { success: false, error: 'La fecha de inicio es requerida' }
    }

    if (!end_date) {
      return { success: false, error: 'La fecha de fin es requerida' }
    }

    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');

    const projectData: TablesInsert<'projects'> = {
      organization_id: profile.current_organization_id,
      name: name.trim(),
      location: location.trim(),
      latitude: latitude ? parseFloat(latitude.toString()) : null,
      longitude: longitude ? parseFloat(longitude.toString()) : null,
      start_date,
      end_date,
      status: status as 'ACTIVE' | 'PAUSED' | 'COMPLETED',
      created_by: profile.id,
      owner_id: profile.id,
    }

    const { data, error } = await projectsService.createProject(projectData)

    if (error) {
      console.error('Error creating project:', error);
      return { success: false, error: error.message || 'Error al crear el proyecto' }
    }

    if (!data?.id) {
      return { success: false, error: 'Error: El proyecto no fue creado correctamente' }
    }

    revalidatePath('/projects')

    return { success: true, data: { id: data.id } }
  } catch (error) {
    console.error('Unexpected error in createProjectAction:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: `Error inesperado: ${message}` }
  }
}

/**
 * Update an existing project
 */
export async function updateProjectAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const projectsService = createProjectsService(supabase)

    if (!projectId) {
      return { success: false, error: 'ID del proyecto es requerido' }
    }

    // Extract form data
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const status = (formData.get('status') as string) || 'ACTIVE';

    // Validate required fields
    if (!name?.trim()) {
      return { success: false, error: 'El nombre del proyecto es requerido' }
    }

    if (!location?.trim()) {
      return { success: false, error: 'La ubicación es requerida' }
    }

    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');

    const updates: TablesUpdate<'projects'> = {
      name: name.trim(),
      location: location.trim(),
      latitude: latitude ? parseFloat(latitude.toString()) : null,
      longitude: longitude ? parseFloat(longitude.toString()) : null,
      start_date,
      end_date,
      status: status as 'ACTIVE' | 'PAUSED' | 'COMPLETED',
    }

    const { error } = await projectsService.updateProject(projectId, updates)

    if (error) {
      console.error('Error updating project:', error);
      return { success: false, error: error.message || 'Error al actualizar el proyecto' }
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/projects')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateProjectAction:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: `Error inesperado: ${message}` }
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const projectsService = createProjectsService(supabase)

  const { error } = await projectsService.deleteProject(projectId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/projects')

  return { success: true }
}

/**
 * Add a member to a project
 */
export async function addProjectMemberAction(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const authService = createAuthService(supabase)
  const projectsService = createProjectsService(supabase)

  const { data: profile } = await authService.getUserProfile()

  if (!profile?.current_organization_id) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await projectsService.addMember({
    organization_id: profile.current_organization_id,
    project_id: projectId,
    user_id: userId,
    assigned_role: role,
    assigned_by: profile.id,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)

  return { success: true }
}

/**
 * Update a project member's role
 */
export async function updateProjectMemberRoleAction(
  memberId: string,
  role: ProjectRole,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const projectsService = createProjectsService(supabase)

  const { error } = await projectsService.updateMemberRole(memberId, role)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)

  return { success: true }
}

/**
 * Remove a member from a project
 */
export async function removeProjectMemberAction(
  memberId: string,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createServerActionClient()
  const projectsService = createProjectsService(supabase)

  const { error } = await projectsService.removeMember(memberId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)

  return { success: true }
}

/**
 * Get all projects for the current organization
 */
export async function getProjectsAction(): Promise<ActionResult<any[]>> {
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

    const projectsService = createProjectsService(supabase)
    const { data: projects, error } = await projectsService.getProjectsByOrganization({
      organizationId: profile.current_organization_id
    })

    if (error) {
      console.error('Error fetching projects:', error);
      return { success: false, error: error.message || 'Error al obtener proyectos', data: [] }
    }

    // Enrich projects with stats
    const projectsWithStats = await Promise.all(
      (projects ?? []).map(async (project) => {
        const [membersResult, incidentsResult] = await Promise.all([
          supabase
            .from('project_members')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id),
          supabase
            .from('incidents')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .neq('status', 'CLOSED'),
        ]);
        
        return {
          id: project.id,
          name: project.name,
          location: project.location,
          status: project.status,
          members: membersResult.count ?? 0,
          incidents: incidentsResult.count ?? 0,
        };
      })
    );

    return { success: true, data: projectsWithStats }
  } catch (error) {
    console.error('Unexpected error in getProjectsAction:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: `Error inesperado: ${message}`, data: [] }
  }
}

/**
 * Get project details for a single project
 */
export async function getProjectDetailAction(projectId: string): Promise<ActionResult<any>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    const projectsService = createProjectsService(supabase)
    const { data: project, error } = await projectsService.getProject(projectId)
    if (error || !project) return { success: false, error: 'Proyecto no encontrado' }

    // Ensure project belongs to organization
    if (project.organization_id !== profile.current_organization_id) {
      return { success: false, error: 'Acceso denegado' }
    }

    const [membersResult, incidentsResult] = await Promise.all([
      supabase
        .from('project_members')
        .select('user_id, assigned_role, users!inner(id, full_name, email)')
        .eq('project_id', projectId),
      supabase
        .from('incidents')
        .select('*')
        .eq('project_id', projectId),
    ])

    // Transform members to User format
    const members = (membersResult.data || []).map((m: any) => ({
      id: m.users.id,
      full_name: m.users.full_name,
      email: m.users.email,
      role: m.assigned_role,
    }))

    // Normalize property name: DB uses `end_date` but UI expects `expected_end_date`.
    const projectWithExpected = {
      ...project,
      expected_end_date: (project as any).end_date ?? null,
    }

    return {
      success: true,
      data: {
        project: projectWithExpected,
        members,
        incidents: incidentsResult.data || [],
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getProjectDetailAction error:', err)
    return { success: false, error: message }
  }
}
