/**
 * Photos Server Actions
 * 
 * Server actions para subir y gestionar fotos de incidencias.
 */

'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createStorageService } from '@/lib/services/storage.service'
import { createCommentsService } from '@/lib/services/comments.service'
import { createUsersService } from '@/lib/services/users.service'

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// PHOTO ACTIONS
// ============================================================================

/**
 * Upload a photo for an incident
 */
export async function uploadPhotoAction(
  incidentId: string,
  organizationId: string,
  projectId: string,
  file: File
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const storageService = createStorageService(supabase)

    const { data: photo, error } = await storageService.uploadPhoto({
      incidentId,
      organizationId,
      projectId,
      file,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: photo }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

/**
 * Get signed URL for a photo
 */
export async function getPhotoSignedUrlAction(
  storagePath: string
): Promise<ActionResult<string>> {
  try {
    const supabase = await createServerActionClient()
    const storageService = createStorageService(supabase)

    const { data: signedUrlRaw, error } = await storageService.getSignedUrl(
      storagePath
    )

    // convert `string | null` returned by the service to `string | undefined`
    const signedUrl: string | undefined = signedUrlRaw ?? undefined

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: signedUrl }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

/**
 * Delete a photo
 */
export async function deletePhotoAction(
  photoId: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const storageService = createStorageService(supabase)

    const { error } = await storageService.deletePhoto(photoId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

// ============================================================================
// COMMENT ACTIONS
// ============================================================================

/**
 * Add comment to incident
 */
export async function addCommentAction(
  incidentId: string,
  organizationId: string,
  text: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const commentsService = createCommentsService(supabase)

    const { data: comment, error } = await commentsService.addComment(
      incidentId,
      text,
      organizationId
    )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: comment }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

/**
 * Delete comment
 */
export async function deleteCommentAction(
  commentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const commentsService = createCommentsService(supabase)

    const { error } = await commentsService.deleteComment(commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

// ============================================================================
// USER ACTIONS
// ============================================================================

/**
 * Update user profile
 */
export async function updateUserProfileAction(
  userId: string,
  updates: {
    full_name?: string
    profile_picture_url?: string | null
    theme_mode?: 'light' | 'dark'
  }
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const usersService = createUsersService(supabase)

    const { data: user, error } = await usersService.updateProfile(
      userId,
      updates
    )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: user }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

/**
 * Set current organization
 */
export async function setCurrentOrganizationAction(
  userId: string,
  organizationId: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const usersService = createUsersService(supabase)

    const { data: user, error } = await usersService.setCurrentOrganization(
      userId,
      organizationId
    )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: user }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}

/**
 * Update theme mode
 */
export async function setThemeModeAction(
  userId: string,
  mode: 'light' | 'dark'
): Promise<ActionResult> {
  try {
    const supabase = await createServerActionClient()
    const usersService = createUsersService(supabase)

    const { data: user, error } = await usersService.setThemeMode(userId, mode)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: user }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error }
  }
}
