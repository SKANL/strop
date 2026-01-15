/**
 * Users Service
 * 
 * Servicio para gestionar perfiles de usuarios y configuración personal.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type { User, TablesUpdate } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile extends User {
  organizations?: Array<{
    id: string
    name: string
    slug: string
    role: string
  }>
}

// ============================================================================
// USERS SERVICE
// ============================================================================

export class UsersService extends BaseService<'users'> {
  constructor(client: SupabaseClient) {
    super(client, 'users')
  }

  /**
   * Get current user's profile with organizations
   */
  async getCurrentUserProfile(): Promise<ServiceResult<UserProfile>> {
    try {
      const { data: authUser } = await this.client.auth.getUser()

      if (!authUser.user) {
        return {
          data: null,
          error: new ServiceError('Not authenticated', 'AUTH_ERROR'),
        }
      }

      // Get user profile
      const { data: userProfile, error: userError } = await this.client
        .from('users')
        .select('*')
        .eq('auth_id', authUser.user.id)
        .single()

      if (userError || !userProfile) {
        return {
          data: null,
          error: new ServiceError(
            'User profile not found',
            'NOT_FOUND'
          ),
        }
      }

      // Get user's organizations
      const { data: memberData } = await this.client
        .from('organization_members')
        .select(`
          role,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userProfile.id)

      const organizations = memberData
        ?.map((m) => ({
          id: (m.organizations as any)?.id ?? '',
          name: (m.organizations as any)?.name ?? '',
          slug: (m.organizations as any)?.slug ?? '',
          role: m.role,
        }))
        .filter((org) => org.id !== '') ?? []

      const profileWithOrgs: UserProfile = {
        ...userProfile,
        organizations,
      }

      return { data: profileWithOrgs, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<ServiceResult<User>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
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
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: {
      full_name?: string
      profile_picture_url?: string | null
      theme_mode?: 'light' | 'dark'
    }
  ): Promise<ServiceResult<User>> {
    try {
      const updateData: TablesUpdate<'users'> = {}

      if (updates.full_name !== undefined) {
        updateData.full_name = updates.full_name
      }

      if (updates.profile_picture_url !== undefined) {
        updateData.profile_picture_url = updates.profile_picture_url
      }

      if (updates.theme_mode !== undefined) {
        updateData.theme_mode = updates.theme_mode
      }

      const { data, error } = await this.client
        .from('users')
        .update(updateData)
        .eq('id', userId)
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
   * Update user's theme preference
   */
  async setThemeMode(
    userId: string,
    mode: 'light' | 'dark'
  ): Promise<ServiceResult<User>> {
    return this.updateProfile(userId, { theme_mode: mode })
  }

  /**
   * Update user's profile picture
   */
  async setProfilePicture(
    userId: string,
    pictureUrl: string | null
  ): Promise<ServiceResult<User>> {
    return this.updateProfile(userId, { profile_picture_url: pictureUrl })
  }

  /**
   * Set user's current organization
   */
  async setCurrentOrganization(
    userId: string,
    organizationId: string
  ): Promise<ServiceResult<User>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .update({ current_organization_id: organizationId })
        .eq('id', userId)
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
   * Soft delete user
   */
  async deleteUser(
    userId: string,
    deletedBy: string
  ): Promise<ServiceResult<User>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          is_active: false,
        })
        .eq('id', userId)
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
   * Get all active users in an organization
   */
  async getOrganizationUsers(
    organizationId: string
  ): Promise<ServiceResult<User[]>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .in(
          'id',
          (
            await this.client
              .from('organization_members')
              .select('user_id')
              .eq('organization_id', organizationId)
          ).data?.map((m) => m.user_id) ?? []
        )
        .eq('is_active', true)
        .order('full_name', { ascending: true })

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
   * Get all active users in a project
   */
  async getProjectUsers(projectId: string): Promise<ServiceResult<User[]>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .in(
          'id',
          (
            await this.client
              .from('project_members')
              .select('user_id')
              .eq('project_id', projectId)
          ).data?.map((m) => m.user_id) ?? []
        )
        .eq('is_active', true)
        .order('full_name', { ascending: true })

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
}

/**
 * Factory function to create UsersService
 */
export function createUsersService(client: SupabaseClient): UsersService {
  return new UsersService(client)
}
