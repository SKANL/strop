/**
 * Projects Service
 * 
 * Servicio para gestionar proyectos de construcción y sus miembros.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type {
  Project,
  ProjectMember,
  TablesInsert,
  TablesUpdate,
  ProjectRole,
} from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectWithMembers extends Project {
  project_members: (ProjectMember & {
    users: {
      id: string
      full_name: string
      email: string
      profile_picture_url: string | null
    }
  })[]
  owner: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface ProjectWithStats extends Project {
  _count: {
    incidents: number
    bitacora_entries: number
    project_members: number
  }
}

export interface ProjectFilters {
  organizationId: string
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  search?: string
}

// ============================================================================
// PROJECTS SERVICE
// ============================================================================

export class ProjectsService extends BaseService<'projects'> {
  constructor(client: SupabaseClient) {
    super(client, 'projects')
  }

  /**
   * Get all projects for an organization
   */
  async getProjectsByOrganization(
    filters: ProjectFilters
  ): Promise<ServiceResult<Project[]>> {
    try {
      let query = this.client
        .from('projects')
        .select('*')
        .eq('organization_id', filters.organizationId)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get a project by ID with members
   */
  async getProjectWithMembers(
    projectId: string
  ): Promise<ServiceResult<ProjectWithMembers>> {
    try {
      const { data, error } = await this.client
        .from('projects')
        .select(`
          *,
          owner:users!projects_owner_id_fkey (
            id,
            full_name,
            email
          ),
          project_members (
            *,
            users (
              id,
              full_name,
              email,
              profile_picture_url
            )
          )
        `)
        .eq('id', projectId)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as unknown as ProjectWithMembers, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<ServiceResult<Project>> {
    return this.getById<Project>(projectId)
  }

  /**
   * Create a new project
   */
  async createProject(
    project: TablesInsert<'projects'>
  ): Promise<ServiceResult<Project>> {
    return this.create<Project, TablesInsert<'projects'>>(project)
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    updates: TablesUpdate<'projects'>
  ): Promise<ServiceResult<Project>> {
    return this.update<Project, TablesUpdate<'projects'>>(projectId, updates)
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<ServiceResult<void>> {
    return this.deleteById(projectId)
  }

  /**
   * Add a member to a project
   */
  async addMember(
    member: TablesInsert<'project_members'>
  ): Promise<ServiceResult<ProjectMember>> {
    try {
      const { data, error } = await this.client
        .from('project_members')
        .insert(member)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Update a member's role in a project
   */
  async updateMemberRole(
    memberId: string,
    role: ProjectRole
  ): Promise<ServiceResult<ProjectMember>> {
    try {
      const { data, error } = await this.client
        .from('project_members')
        .update({ assigned_role: role })
        .eq('id', memberId)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Remove a member from a project
   */
  async removeMember(memberId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.client
        .from('project_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: undefined, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get projects where the user is a member
   */
  async getUserProjects(userId: string): Promise<ServiceResult<Project[]>> {
    try {
      const { data, error } = await this.client
        .from('project_members')
        .select(`
          projects (*)
        `)
        .eq('user_id', userId)

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      const projects = data
        ?.map((m) => m.projects)
        .filter((p): p is Project => p !== null) ?? []

      return { data: projects, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createProjectsService(client: SupabaseClient): ProjectsService {
  return new ProjectsService(client)
}
