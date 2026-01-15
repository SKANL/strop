/**
 * Organizations Service
 * 
 * Servicio para gestionar organizaciones y miembros.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type {
  Organization,
  OrganizationMember,
  TablesInsert,
  TablesUpdate,
  UserRole,
} from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface OrganizationWithMembers extends Organization {
  organization_members: (OrganizationMember & {
    users: {
      id: string
      full_name: string
      email: string
      profile_picture_url: string | null
    }
  })[]
}

export interface OrganizationStats {
  totalMembers: number
  totalProjects: number
  activeProjects: number
  storageUsedMb: number
}

// ============================================================================
// ORGANIZATIONS SERVICE
// ============================================================================

export class OrganizationsService extends BaseService<'organizations'> {
  constructor(client: SupabaseClient) {
    super(client, 'organizations')
  }

  /**
   * Get all organizations for the current user
   */
  async getUserOrganizations(): Promise<ServiceResult<Organization[]>> {
    try {
      const { data: authUser } = await this.client.auth.getUser()

      if (!authUser.user) {
        return {
          data: null,
          error: new ServiceError('Not authenticated', 'AUTH_ERROR'),
        }
      }

      // Get user profile
      const { data: userProfile } = await this.client
        .from('users')
        .select('id')
        .eq('auth_id', authUser.user.id)
        .single()

      if (!userProfile) {
        return {
          data: null,
          error: new ServiceError('User profile not found', 'NOT_FOUND'),
        }
      }

      // Get organizations where user is a member
      const { data, error } = await this.client
        .from('organization_members')
        .select(`
          organizations (*)
        `)
        .eq('user_id', userProfile.id)

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      const organizations = data
        ?.map((m) => m.organizations)
        .filter((org): org is Organization => org !== null) ?? []

      return { data: organizations, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get organization by ID with members
   */
  async getOrganizationWithMembers(
    organizationId: string
  ): Promise<ServiceResult<OrganizationWithMembers>> {
    try {
      const { data, error } = await this.client
        .from('organizations')
        .select(`
          *,
          organization_members (
            *,
            users!organization_members_user_id_fkey (
              id,
              full_name,
              email,
              profile_picture_url
            )
          )
        `)
        .eq('id', organizationId)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as unknown as OrganizationWithMembers, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get organization by slug
   */
  async getBySlug(slug: string): Promise<ServiceResult<Organization>> {
    try {
      const { data, error } = await this.client
        .from('organizations')
        .select('*')
        .eq('slug', slug)
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
   * Create a new organization using the RPC function
   */
  async createOrganization(
    name: string,
    slug: string,
    plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ): Promise<ServiceResult<string>> {
    try {
      const { data, error } = await this.client.rpc(
        'create_organization_for_new_owner',
        {
          org_name: name,
          org_slug: slug,
          org_plan: plan ?? 'STARTER',
        }
      )

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as string, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Update organization details
   */
  async updateOrganization(
    id: string,
    updates: TablesUpdate<'organizations'>
  ): Promise<ServiceResult<Organization>> {
    return this.update<Organization, TablesUpdate<'organizations'>>(id, updates)
  }

  /**
   * Switch the current user's active organization
   */
  async switchOrganization(
    targetOrgId: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await this.client.rpc('switch_organization', {
        target_org_id: targetOrgId,
      })

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as boolean, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get the current user's role in an organization
   */
  async getUserRole(
    organizationId: string,
    userId: string
  ): Promise<ServiceResult<UserRole | null>> {
    try {
      const { data, error } = await this.client
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: null }
        }
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data.role, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Add a member to an organization
   */
  async addMember(
    member: TablesInsert<'organization_members'>
  ): Promise<ServiceResult<OrganizationMember>> {
    try {
      const { data, error } = await this.client
        .from('organization_members')
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
   * Update a member's role
   */
  async updateMemberRole(
    memberId: string,
    role: UserRole
  ): Promise<ServiceResult<OrganizationMember>> {
    try {
      const { data, error } = await this.client
        .from('organization_members')
        .update({ role })
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
   * Remove a member from an organization
   */
  async removeMember(memberId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.client
        .from('organization_members')
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
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createOrganizationsService(
  client: SupabaseClient
): OrganizationsService {
  return new OrganizationsService(client)
}
