/**
 * Bitacora Service
 * 
 * Servicio para gestionar entradas de bitácora y cierres diarios.
 */

import { BaseService, ServiceResult, ServiceError } from './base.service'
import type { SupabaseClient } from '@/lib/supabase'
import type {
  BitacoraEntry,
  BitacoraDayClosure,
  TablesInsert,
  TablesUpdate,
  EventSource,
} from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface BitacoraEntryWithDetails extends BitacoraEntry {
  created_by_user: {
    id: string
    full_name: string
    profile_picture_url: string | null
  } | null
  incident: {
    id: string
    title: string
    type: string
  } | null
}

export interface BitacoraTimelineEntry {
  id: string
  title: string
  content: string
  source: EventSource
  event_date: string
  created_by: string
  project_id: string
  metadata: Record<string, unknown>
}

export interface BitacoraFilters {
  projectId: string
  source?: EventSource
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
}

// ============================================================================
// BITACORA SERVICE
// ============================================================================

export class BitacoraService extends BaseService<'bitacora_entries'> {
  constructor(client: SupabaseClient) {
    super(client, 'bitacora_entries')
  }

  /**
   * Get bitacora entries for a project
   */
  async getEntries(
    filters: BitacoraFilters
  ): Promise<ServiceResult<BitacoraEntry[]>> {
    try {
      let query = this.client
        .from('bitacora_entries')
        .select('*')
        .eq('project_id', filters.projectId)
        .order('created_at', { ascending: false })

      if (filters.source) {
        query = query.eq('source', filters.source)
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
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
   * Get bitacora timeline using the RPC function
   */
  async getTimeline(
    projectId: string,
    options?: {
      source?: EventSource
      startDate?: string
      endDate?: string
    }
  ): Promise<ServiceResult<BitacoraTimelineEntry[]>> {
    try {
      const { data, error } = await this.client.rpc('get_bitacora_timeline', {
        p_project_id: projectId,
        p_source: options?.source,
        p_start_date: options?.startDate,
        p_end_date: options?.endDate,
      })

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as BitacoraTimelineEntry[], error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Get a single entry with details
   */
  async getEntryWithDetails(
    entryId: string
  ): Promise<ServiceResult<BitacoraEntryWithDetails>> {
    try {
      const { data, error } = await this.client
        .from('bitacora_entries')
        .select(`
          *,
          created_by_user:users!bitacora_entries_created_by_fkey (
            id,
            full_name,
            profile_picture_url
          ),
          incident:incidents!bitacora_entries_incident_id_fkey (
            id,
            title,
            type
          )
        `)
        .eq('id', entryId)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data as BitacoraEntryWithDetails, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError('Unexpected error', 'UNKNOWN_ERROR', err),
      }
    }
  }

  /**
   * Create a new bitacora entry
   */
  async createEntry(
    entry: TablesInsert<'bitacora_entries'>
  ): Promise<ServiceResult<BitacoraEntry>> {
    return this.create<BitacoraEntry, TablesInsert<'bitacora_entries'>>(entry)
  }

  /**
   * Update a bitacora entry (only if not locked)
   */
  async updateEntry(
    entryId: string,
    updates: TablesUpdate<'bitacora_entries'>
  ): Promise<ServiceResult<BitacoraEntry>> {
    // First check if entry is locked
    const { data: existingEntry, error: checkError } = await this.client
      .from('bitacora_entries')
      .select('is_locked')
      .eq('id', entryId)
      .single()

    if (checkError) {
      return {
        data: null,
        error: new ServiceError(checkError.message, checkError.code),
      }
    }

    if (existingEntry.is_locked) {
      return {
        data: null,
        error: new ServiceError(
          'Cannot update a locked entry',
          'ENTRY_LOCKED'
        ),
      }
    }

    return this.update<BitacoraEntry, TablesUpdate<'bitacora_entries'>>(entryId, updates)
  }

  /**
   * Lock a bitacora entry (makes it immutable)
   */
  async lockEntry(
    entryId: string,
    lockedBy: string
  ): Promise<ServiceResult<BitacoraEntry>> {
    return this.update<BitacoraEntry, TablesUpdate<'bitacora_entries'>>(entryId, {
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: lockedBy,
    })
  }

  /**
   * Get day closures for a project
   */
  async getDayClosures(
    projectId: string,
    options?: {
      startDate?: string
      endDate?: string
    }
  ): Promise<ServiceResult<BitacoraDayClosure[]>> {
    try {
      let query = this.client
        .from('bitacora_day_closures')
        .select('*')
        .eq('project_id', projectId)
        .order('closure_date', { ascending: false })

      if (options?.startDate) {
        query = query.gte('closure_date', options.startDate)
      }

      if (options?.endDate) {
        query = query.lte('closure_date', options.endDate)
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
   * Close the day for a project
   */
  async closeDay(
    closure: TablesInsert<'bitacora_day_closures'>
  ): Promise<ServiceResult<BitacoraDayClosure>> {
    try {
      const { data, error } = await this.client
        .from('bitacora_day_closures')
        .insert(closure)
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
   * Check if a day is already closed
   */
  async isDayClosed(
    projectId: string,
    date: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await this.client
        .from('bitacora_day_closures')
        .select('id')
        .eq('project_id', projectId)
        .eq('closure_date', date)
        .maybeSingle()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code),
        }
      }

      return { data: data !== null, error: null }
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

export function createBitacoraService(
  client: SupabaseClient
): BitacoraService {
  return new BitacoraService(client)
}
