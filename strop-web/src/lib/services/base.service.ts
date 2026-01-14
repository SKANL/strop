/**
 * Base Service for Supabase Operations
 * 
 * Proporciona una clase base abstracta con operaciones CRUD genéricas
 * y manejo de errores consistente para todos los servicios.
 */

import type { SupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export type TableName = keyof Database['public']['Tables']

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export interface ServiceResult<T> {
  data: T | null
  error: ServiceError | null
}

// ============================================================================
// BASE SERVICE
// ============================================================================

/**
 * Abstract base service that provides common CRUD operations.
 * Uses type assertions for Supabase client methods due to complex generic constraints.
 */
export abstract class BaseService<T extends TableName> {
  protected tableName: T
  protected client: SupabaseClient

  constructor(client: SupabaseClient, tableName: T) {
    this.client = client
    this.tableName = tableName
  }

  /**
   * Get all records with optional filtering
   */
  protected async getAll<TRow>(
    options?: {
      select?: string
      filter?: Record<string, unknown>
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
    }
  ): Promise<ServiceResult<TRow[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (this.client.from(this.tableName) as any)
        .select(options?.select ?? '*')

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit ?? 10) - 1
        )
      }

      const { data, error } = await query

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code, error.details),
        }
      }

      return { data: data as TRow[], error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Get a single record by ID
   */
  protected async getById<TRow>(
    id: string,
    options?: { select?: string }
  ): Promise<ServiceResult<TRow>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.client.from(this.tableName) as any)
        .select(options?.select ?? '*')
        .eq('id', id)
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code, error.details),
        }
      }

      return { data: data as TRow, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Insert a new record
   */
  protected async create<TRow, TInsert extends Record<string, unknown>>(
    data: TInsert
  ): Promise<ServiceResult<TRow>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (this.client.from(this.tableName) as any)
        .insert(data)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code, error.details),
        }
      }

      return { data: result as TRow, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Update an existing record
   */
  protected async update<TRow, TUpdate extends Record<string, unknown>>(
    id: string,
    data: TUpdate
  ): Promise<ServiceResult<TRow>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (this.client.from(this.tableName) as any)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code, error.details),
        }
      }

      return { data: result as TRow, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }

  /**
   * Delete a record
   */
  protected async deleteById(id: string): Promise<ServiceResult<void>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.client.from(this.tableName) as any)
        .delete()
        .eq('id', id)

      if (error) {
        return {
          data: null,
          error: new ServiceError(error.message, error.code, error.details),
        }
      }

      return { data: undefined, error: null }
    } catch (err) {
      return {
        data: null,
        error: new ServiceError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          err
        ),
      }
    }
  }
}
