/**
 * Services Module Exports
 * 
 * Re-exports all services for convenient importing.
 * 
 * @example
 * ```ts
 * import { createAuthService, createProjectsService } from '@/lib/services'
 * 
 * const authService = createAuthService(supabaseClient)
 * const projectsService = createProjectsService(supabaseClient)
 * ```
 */

// Base service utilities
export { BaseService, ServiceError } from './base.service'
export type { ServiceResult } from './base.service'

// Auth service
export { AuthService, createAuthService } from './auth.service'
export type {
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  AuthSession,
} from './auth.service'

// Organizations service
export { OrganizationsService, createOrganizationsService } from './organizations.service'
export type {
  OrganizationWithMembers,
  OrganizationStats,
} from './organizations.service'

// Projects service
export { ProjectsService, createProjectsService } from './projects.service'
export type {
  ProjectWithMembers,
  ProjectWithStats,
  ProjectFilters,
} from './projects.service'

// Incidents service
export { IncidentsService, createIncidentsService } from './incidents.service'
export type {
  IncidentWithDetails,
  IncidentFilters,
  IncidentStats,
} from './incidents.service'

// Bitacora service
export { BitacoraService, createBitacoraService } from './bitacora.service'
export type {
  BitacoraEntryWithDetails,
  BitacoraTimelineEntry,
  BitacoraFilters,
} from './bitacora.service'

// Invitations service
export { InvitationsService, createInvitationsService } from './invitations.service'
export type {
  InvitationWithDetails,
  CreateInvitationParams,
} from './invitations.service'
// Storage service
export { StorageService, createStorageService } from './storage.service'
export type {
  PhotoUploadOptions,
  PhotoDownloadOptions,
  UploadedPhoto,
} from './storage.service'

// Comments service
export { CommentsService, createCommentsService } from './comments.service'
export type {
  CommentWithAuthor,
  CommentFilters,
} from './comments.service'

// Users service
export { UsersService, createUsersService } from './users.service'
export type {
  UserProfile,
} from './users.service'