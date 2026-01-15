/**
 * Invitations Service
 * 
 * Servicio para gestionar invitaciones a organizaciones.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type {
  Invitation,
  TablesInsert,
  UserRole,
} from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface InvitationWithDetails extends Invitation {
  organization: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
  invited_by_user: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface CreateInvitationParams {
  organizationId: string
  email: string
  role: UserRole
  invitedBy: string
}

// ============================================================================
// INVITATIONS SERVICE
// ============================================================================

export class InvitationsService extends BaseService<'invitations'> {
  constructor(client: SupabaseClient) {
    super(client, 'invitations')
  }

  /**
   * Get pending invitations for an organization
   */
  async getOrganizationInvitations(
    organizationId: string
  ): Promise<ServiceResult<Invitation[]>> {
    try {
      const { data, error } = await this.client
        .from('invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

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
   * Get invitation by token
   */
  async getByToken(
    token: string
  ): Promise<ServiceResult<InvitationWithDetails>> {
    try {
      const { data, error } = await this.client
        .from('invitations')
        .select(`
          *,
          organization:organizations (
            id,
            name,
            slug,
            logo_url
          ),
          invited_by_user:users!invitations_invited_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('invitation_token', token)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as InvitationWithDetails, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Create a new invitation
   */
  async createInvitation(
    params: CreateInvitationParams
  ): Promise<ServiceResult<Invitation>> {
    // Check if invitation already exists
    const { data: existing } = await this.client
      .from('invitations')
      .select('id')
      .eq('organization_id', params.organizationId)
      .eq('email', params.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) {
      return {
        data: null,
        error: new ServiceError(
          'An active invitation already exists for this email',
          'INVITATION_EXISTS'
        ),
      }
    }

    const invitation: TablesInsert<'invitations'> = {
      organization_id: params.organizationId,
      email: params.email,
      role: params.role,
      invited_by: params.invitedBy,
    }

    return this.create<Invitation, TablesInsert<'invitations'>>(invitation)
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      // Get the invitation
      const { data: invitation, error: fetchError } = await this.client
        .from('invitations')
        .select('*')
        .eq('invitation_token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (fetchError || !invitation) {
        return {
          data: null,
          error: new ServiceError(
            'Invalid or expired invitation',
            'INVALID_INVITATION'
          ),
        }
      }

      // Add user to organization
      const { error: memberError } = await this.client
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          invited_by: invitation.invited_by,
        })

      if (memberError) {
        return {
          data: null,
          error: new ServiceError(memberError.message, memberError.code),
        }
      }

      // Mark invitation as accepted
      const { error: updateError } = await this.client
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (updateError) {
        return {
          data: null,
          error: new ServiceError(updateError.message, updateError.code),
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
   * Resend an invitation (creates a new token)
   */
  async resendInvitation(
    invitationId: string
  ): Promise<ServiceResult<Invitation>> {
    try {
      // Delete the old invitation and create a new one
      const { data: old, error: fetchError } = await this.client
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (fetchError || !old) {
        return {
          data: null,
          error: new ServiceError('Invitation not found', 'NOT_FOUND'),
        }
      }

      // Delete old invitation
      await this.client.from('invitations').delete().eq('id', invitationId)

      // Create new invitation
      return this.createInvitation({
        organizationId: old.organization_id,
        email: old.email,
        role: old.role,
        invitedBy: old.invited_by!,
      })
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Cancel/delete an invitation
   */
  async cancelInvitation(invitationId: string): Promise<ServiceResult<void>> {
    return this.deleteById(invitationId)
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createInvitationsService(
  client: SupabaseClient
): InvitationsService {
  return new InvitationsService(client)
}
