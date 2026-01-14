/**
 * Comments Service
 * 
 * Servicio para gestionar comentarios en incidencias.
 * Facilita la comunicación entre D/A y campo en tiempo real.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type { Comment, TablesInsert, TablesUpdate } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface CommentWithAuthor extends Comment {
  author?: {
    id: string
    full_name: string
    email: string
    profile_picture_url: string | null
  } | null
}

export interface CommentFilters {
  incidentId: string
  limit?: number
  offset?: number
}

// ============================================================================
// COMMENTS SERVICE
// ============================================================================

export class CommentsService extends BaseService<'comments'> {
  constructor(client: SupabaseClient) {
    super(client, 'comments')
  }

  /**
   * Get all comments for an incident
   */
  async getIncidentComments(
    filters: CommentFilters
  ): Promise<ServiceResult<CommentWithAuthor[]>> {
    try {
      let query = this.client
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey (
            id,
            full_name,
            email,
            profile_picture_url
          )
        `)
        .eq('incident_id', filters.incidentId)
        .order('created_at', { ascending: true })

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

      return { data: data as CommentWithAuthor[], error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Create a new comment on an incident
   */
  async addComment(
    incidentId: string,
    text: string,
    organizationId: string
  ): Promise<ServiceResult<CommentWithAuthor>> {
    try {
      // Get current user
      const { data: authUser } = await this.client.auth.getUser()
      const { data: userProfile } = await this.client
        .from('users')
        .select('id')
        .eq('auth_id', authUser.user?.id ?? '')
        .single()

      const commentData: TablesInsert<'comments'> = {
        incident_id: incidentId,
        organization_id: organizationId,
        text,
        author_id: userProfile?.id,
      }

      const { data: comment, error } = await this.client
        .from('comments')
        .insert([commentData])
        .select(`
          *,
          author:users!comments_author_id_fkey (
            id,
            full_name,
            email,
            profile_picture_url
          )
        `)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: comment as CommentWithAuthor, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.client
        .from('comments')
        .delete()
        .eq('id', commentId)

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
   * Count comments for an incident
   */
  async countComments(incidentId: string): Promise<ServiceResult<number>> {
    try {
      const { count, error } = await this.client
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('incident_id', incidentId)

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: count ?? 0, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }
}

/**
 * Factory function to create CommentsService
 */
export function createCommentsService(client: SupabaseClient): CommentsService {
  return new CommentsService(client)
}
