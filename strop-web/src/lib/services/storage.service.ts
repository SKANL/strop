/**
 * Storage Service
 * 
 * Servicio para gestionar almacenamiento de fotos de incidencias.
 * Soporta upload, download y URLs firmadas para acceso temporal.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type { Photo, TablesInsert } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface PhotoUploadOptions {
  incidentId: string
  organizationId: string
  projectId: string
  file: File
  uploadedBy?: string
}

export interface PhotoDownloadOptions {
  storagePath: string
  expirationSeconds?: number
}

export interface UploadedPhoto extends Photo {
  signedUrl?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_BUCKET = 'incident-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const SIGNED_URL_EXPIRATION = 24 * 60 * 60 // 24 hours in seconds

// ============================================================================
// STORAGE SERVICE
// ============================================================================

export class StorageService extends BaseService<'photos'> {
  constructor(client: SupabaseClient) {
    super(client, 'photos')
  }

  /**
   * Upload a photo for an incident
   * 
   * Validaciones:
   * - Archivo < 5MB
   * - Formato jpg|jpeg|png|webp
   * - Estructura path: {org_id}/{project_id}/{incident_id}/{uuid}.{ext}
   */
  async uploadPhoto(
    options: PhotoUploadOptions
  ): Promise<ServiceResult<UploadedPhoto>> {
    try {
      // 1. Validate file
      const validationError = this.validateFile(options.file)
      if (validationError) {
        return {
          data: null,
          error: new ServiceError(validationError, 'INVALID_FILE'),
        }
      }

      // 2. Get current user if uploadedBy not provided
      let uploadedBy = options.uploadedBy
      if (!uploadedBy) {
        const { data: authUser } = await this.client.auth.getUser()
        const { data: userProfile } = await this.client
          .from('users')
          .select('id')
          .eq('auth_id', authUser.user?.id ?? '')
          .single()

        uploadedBy = userProfile?.id
      }

      // 3. Generate file path: {org_id}/{project_id}/{incident_id}/{uuid}.{ext}
      const fileExt = this.getFileExtension(options.file.name)
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const storagePath = `${options.organizationId}/${options.projectId}/${options.incidentId}/${fileName}`

      // 4. Upload to Supabase Storage
      const { data: uploadedFile, error: uploadError } = await this.client.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, options.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return {
          data: null,
          error: new ServiceError(
            `Storage upload failed: ${uploadError.message}`,
            'STORAGE_ERROR'
          ),
        }
      }

      // 5. Create photo record in database
      const photoData: TablesInsert<'photos'> = {
        organization_id: options.organizationId,
        incident_id: options.incidentId,
        storage_path: storagePath,
        uploaded_by: uploadedBy,
      }

      const { data: photo, error: dbError } = await this.client
        .from('photos')
        .insert([photoData])
        .select()
        .single()

      if (dbError) {
        // If DB insert fails, try to delete the uploaded file
        await this.client.storage.from(STORAGE_BUCKET).remove([storagePath])

        return {
          data: null,
          error: new ServiceError(
            `Failed to save photo metadata: ${dbError.message}`,
            'DB_ERROR'
          ),
        }
      }

      // 6. Generate signed URL for preview
      const { data: signedUrlData } = await this.client.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION)

      const photoWithUrl: UploadedPhoto = {
        ...photo,
        signedUrl: signedUrlData?.signedUrl,
      }

      return { data: photoWithUrl, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'Unexpected error during upload',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Download a photo from storage
   */
  async downloadPhoto(
    storagePath: string
  ): Promise<ServiceResult<Blob>> {
    try {
      const { data, error } = await this.client.storage
        .from(STORAGE_BUCKET)
        .download(storagePath)

      if (error) {
        return {
          data: null,
          error: new ServiceError(
            `Failed to download photo: ${error.message}`,
            'STORAGE_ERROR'
          ),
        }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'Unexpected error during download',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Get a signed URL for a photo (valid for 24 hours)
   */
  async getSignedUrl(
    storagePath: string,
    expirationSeconds?: number
  ): Promise<ServiceResult<string>> {
    try {
      const { data, error } = await this.client.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, expirationSeconds ?? SIGNED_URL_EXPIRATION)

      if (error) {
        return {
          data: null,
          error: new ServiceError(
            `Failed to generate signed URL: ${error.message}`,
            'STORAGE_ERROR'
          ),
        }
      }

      return { data: data.signedUrl, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'Unexpected error generating URL',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Get all photos for an incident
   */
  async getIncidentPhotos(
    incidentId: string
  ): Promise<ServiceResult<UploadedPhoto[]>> {
    try {
      const { data: photos, error } = await this.client
        .from('photos')
        .select('*')
        .eq('incident_id', incidentId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      // Generate signed URLs for all photos
      const photosWithUrls: UploadedPhoto[] = await Promise.all(
        (photos ?? []).map(async (photo) => {
          const { data: signedUrlData } = await this.client.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(photo.storage_path, SIGNED_URL_EXPIRATION)

          return {
            ...photo,
            signedUrl: signedUrlData?.signedUrl,
          }
        })
      )

      return { data: photosWithUrls, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'Unexpected error fetching photos',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string): Promise<ServiceResult<void>> {
    try {
      // 1. Get photo to retrieve storage path
      const { data: photo, error: selectError } = await this.client
        .from('photos')
        .select('storage_path')
        .eq('id', photoId)
        .single()

      if (selectError || !photo) {
        return {
          data: null,
          error: new ServiceError('Photo not found', 'NOT_FOUND'),
        }
      }

      // 2. Delete from storage
      const { error: deleteStorageError } = await this.client.storage
        .from(STORAGE_BUCKET)
        .remove([photo.storage_path])

      if (deleteStorageError) {
        return {
          data: null,
          error: new ServiceError(
            `Failed to delete from storage: ${deleteStorageError.message}`,
            'STORAGE_ERROR'
          ),
        }
      }

      // 3. Delete from database
      const { error: deleteDbError } = await this.client
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (deleteDbError) {
        return {
          data: null,
          error: new ServiceError(
            `Failed to delete photo record: ${deleteDbError.message}`,
            'DB_ERROR'
          ),
        }
      }

      return { data: undefined, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'Unexpected error deleting photo',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Upload a file to any bucket (generic method)
   * Used for avatars, documents, etc.
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ): Promise<
    ServiceResult<{
      url: string
      storagePath: string
    }>
  > {
    try {
      // 1. Validate file
      const validationError = this.validateFile(file)
      if (validationError) {
        return {
          data: null,
          error: new ServiceError(validationError, 'INVALID_FILE'),
        }
      }

      // 2. Upload to Supabase Storage
      const { data: uploadedFile, error: uploadError } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false,
        })

      if (uploadError) {
        return {
          data: null,
          error: new ServiceError(
            `Storage upload failed: ${uploadError.message}`,
            'STORAGE_ERROR'
          ),
        }
      }

      // 3. Generate public URL
      const {
        data: { publicUrl },
      } = this.client.storage.from(bucket).getPublicUrl(path)

      return {
        data: {
          url: publicUrl,
          storagePath: path,
        },
        error: null,
      }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'Unexpected error during upload',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Validate file before upload
   */
  private validateFile(file: File): string | null {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `File type must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`
    }

    // Check file extension
    const ext = this.getFileExtension(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File extension must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`
    }

    return null
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? ''
  }
}

/**
 * Factory function to create StorageService
 */
export function createStorageService(client: SupabaseClient): StorageService {
  return new StorageService(client)
}
