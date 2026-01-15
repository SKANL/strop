/**
 * Incidents Service
 * 
 * Servicio para gestionar incidencias en proyectos.
 * Incluye operaciones CRUD y cambios de estado.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type {
  Incident,
  Comment,
  Photo,
  TablesInsert,
  TablesUpdate,
  IncidentStatus,
  IncidentType,
  IncidentPriority,
} from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface IncidentWithDetails extends Incident {
  created_by_user: {
    id: string
    full_name: string
    email: string
    profile_picture_url: string | null
  } | null
  assigned_to_user: {
    id: string
    full_name: string
    email: string
    profile_picture_url: string | null
  } | null
  photos: Photo[]
  comments: (Comment & {
    author: {
      id: string
      full_name: string
      profile_picture_url: string | null
    } | null
  })[]
  _count: {
    comments: number
    photos: number
  }
}

export interface IncidentFilters {
  projectId: string
  status?: IncidentStatus
  type?: IncidentType
  priority?: IncidentPriority
  assignedTo?: string
  createdBy?: string
  search?: string
  limit?: number
  offset?: number
}

export interface IncidentStats {
  total: number
  open: number
  assigned: number
  closed: number
  critical: number
}

// ============================================================================
// INCIDENTS SERVICE
// ============================================================================

export class IncidentsService extends BaseService<'incidents'> {
  constructor(client: SupabaseClient) {
    super(client, 'incidents')
  }

  /**
   * Get incidents for a project with filters
   */
  async getIncidents(
    filters: IncidentFilters
  ): Promise<ServiceResult<Incident[]>> {
    try {
      let query = this.client
        .from('incidents')
        .select('*')
        .eq('project_id', filters.projectId)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo)
      }

      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit ?? 20) - 1
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
   * Get all incidents for the current user's organization (via RLS)
   * This works with Row Level Security policies to automatically filter by organization
   */
  async getOrganizationIncidents(
    filters?: {
      status?: IncidentStatus
      priority?: IncidentPriority
      limit?: number
      offset?: number
    }
  ): Promise<ServiceResult<Incident[]>> {
    try {
      let query = this.client
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit ?? 20) - 1
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
   * Get a single incident with full details
   */
  async getIncidentWithDetails(
    incidentId: string
  ): Promise<ServiceResult<IncidentWithDetails>> {
    try {
      const { data, error } = await this.client
        .from('incidents')
        .select(`
          *,
          created_by_user:users!incidents_created_by_fkey (
            id,
            full_name,
            email,
            profile_picture_url
          ),
          assigned_to_user:users!incidents_assigned_to_fkey (
            id,
            full_name,
            email,
            profile_picture_url
          ),
          photos (*),
          comments (
            *,
            author:users!comments_author_id_fkey (
              id,
              full_name,
              profile_picture_url
            )
          )
        `)
        .eq('id', incidentId)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      // Add counts
      const incidentWithDetails = {
        ...data,
        _count: {
          comments: data.comments?.length ?? 0,
          photos: data.photos?.length ?? 0,
        },
      } as IncidentWithDetails

      return { data: incidentWithDetails, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Create a new incident
   */
  async createIncident(
    incident: TablesInsert<'incidents'>
  ): Promise<ServiceResult<Incident>> {
    return this.create<Incident, TablesInsert<'incidents'>>(incident)
  }

  /**
   * Update an incident
   */
  async updateIncident(
    incidentId: string,
    updates: TablesUpdate<'incidents'>
  ): Promise<ServiceResult<Incident>> {
    return this.update<Incident, TablesUpdate<'incidents'>>(incidentId, updates)
  }

  /**
   * Assign an incident to a user
   */
  async assignIncident(
    incidentId: string,
    userId: string
  ): Promise<ServiceResult<Incident>> {
    return this.update<Incident, TablesUpdate<'incidents'>>(incidentId, {
      assigned_to: userId,
      status: 'ASSIGNED',
    })
  }

  /**
   * Close an incident
   */
  async closeIncident(
    incidentId: string,
    closedBy: string,
    notes?: string
  ): Promise<ServiceResult<Incident>> {
    return this.update<Incident, TablesUpdate<'incidents'>>(incidentId, {
      status: 'CLOSED',
      closed_by: closedBy,
      closed_at: new Date().toISOString(),
      closed_notes: notes,
    })
  }

  /**
   * Reopen an incident
   */
  async reopenIncident(incidentId: string): Promise<ServiceResult<Incident>> {
    return this.update<Incident, TablesUpdate<'incidents'>>(incidentId, {
      status: 'OPEN',
      closed_by: null,
      closed_at: null,
      closed_notes: null,
    })
  }

  /**
   * Add a comment to an incident
   */
  async addComment(
    comment: TablesInsert<'comments'>
  ): Promise<ServiceResult<Comment>> {
    try {
      const { data, error } = await this.client
        .from('comments')
        .insert(comment)
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
   * Get comments for an incident
   */
  async getComments(
    incidentId: string
  ): Promise<ServiceResult<(Comment & { author: { id: string; full_name: string; profile_picture_url: string | null } | null })[]>> {
    try {
      const { data, error } = await this.client
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey (
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true })

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as (Comment & { author: { id: string; full_name: string; profile_picture_url: string | null } | null })[], error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get incident stats for a project
   */
  async getProjectStats(
    projectId: string
  ): Promise<ServiceResult<IncidentStats>> {
    try {
      const { data, error } = await this.client
        .from('incidents')
        .select('status, priority')
        .eq('project_id', projectId)

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      const stats: IncidentStats = {
        total: data.length,
        open: data.filter((i) => i.status === 'OPEN').length,
        assigned: data.filter((i) => i.status === 'ASSIGNED').length,
        closed: data.filter((i) => i.status === 'CLOSED').length,
        critical: data.filter((i) => i.priority === 'CRITICAL').length,
      }

      return { data: stats, error: null }
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

export function createIncidentsService(
  client: SupabaseClient
): IncidentsService {
  return new IncidentsService(client)
}
