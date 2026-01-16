'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createAuthService } from '@/lib/services/auth.service'
import type { BitacoraEntry, BitacoraDayClosure } from '@/types/supabase'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getBitacoraSummaryAction(): Promise<
  ActionResult<
    {
      id: string
      name: string
      location: string | null
      status: string
      openDays: number
      closedDays: number
      totalEntries: number
      lastEntry: string | null
    }[]
  >
> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado', data: [] }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada', data: [] }

    // Get projects in organization
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, location, status')
      .eq('organization_id', profile.current_organization_id)

    if (error) {
      console.error('Error fetching projects for bitacora summary:', error)
      return { success: false, error: error.message, data: [] }
    }

    const summaries = await Promise.all(
      (projects || []).map(async (project: any) => {
        const [{ data: entries }, { data: closures }] = await Promise.all([
          supabase
            .from('bitacora_entries')
            .select('created_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('bitacora_day_closures')
            .select('closure_date')
            .eq('project_id', project.id),
        ])

        const closuresArr = (closures ?? []).map((c: any) => c.closure_date)
        const closedDatesArr = closuresArr.filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)

        const uniqueDatesArr: string[] = []
        ;(entries ?? []).forEach((e: any) => {
          if (e.created_at) {
            const d = e.created_at.split('T')[0]
            if (!uniqueDatesArr.includes(d)) uniqueDatesArr.push(d)
          }
        })

        const openDays = uniqueDatesArr.filter(d => !closedDatesArr.includes(d)).length
        const closedDays = closedDatesArr.length
        const totalEntries = (entries ?? []).length
        const lastEntry = (entries && entries.length > 0) ? (entries[0].created_at?.split('T')[0] ?? null) : null

        return {
          id: project.id,
          name: project.name,
          location: project.location ?? null,
          status: project.status,
          openDays,
          closedDays,
          totalEntries,
          lastEntry,
        }
      })
    )

    return { success: true, data: summaries }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getBitacoraSummaryAction error:', err)
    return { success: false, error: message, data: [] }
  }
}

export async function getBitacoraProjectAction(projectId: string): Promise<
  ActionResult<{
    project: { id: string; name: string; location: string | null }
    days: { date: string; isClosed: boolean; entriesCount: number }[]
  }>
> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, location')
      .eq('id', projectId)
      .eq('organization_id', profile.current_organization_id)
      .single()

    if (error || !project) return { success: false, error: 'Proyecto no encontrado' }

    const { data: entries } = await supabase
      .from('bitacora_entries')
      .select('created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    const { data: closures } = await supabase
      .from('bitacora_day_closures')
      .select('closure_date')
      .eq('project_id', projectId)

    const closuresArr = (closures ?? []).map((c: any) => c.closure_date)
    const closedDatesArr = closuresArr.filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)

    const dateMap = new Map<string, number>()
    ;(entries ?? []).forEach((entry: any) => {
      if (entry.created_at) {
        const date = entry.created_at.split('T')[0]
        dateMap.set(date, (dateMap.get(date) ?? 0) + 1)
      }
    })

    const daysWithCounts = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, isClosed: closedDatesArr.includes(date), entriesCount: count }))
      .sort((a, b) => b.date.localeCompare(a.date))

    return { success: true, data: { project: { id: project.id, name: project.name, location: project.location ?? null }, days: daysWithCounts } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getBitacoraProjectAction error:', err)
    return { success: false, error: message }
  }
}

/**
 * Get entries for a specific project and date
 */
export async function getBitacoraEntriesAction(projectId: string, dateParam: string): Promise<
  ActionResult<{
    project: { id: string; name: string; location: string }
    isClosed: boolean
    entries: {
      id: string
      source: string
      title: string | null
      content: string
      created_at: string
      created_by: string
      user: { id: string; name: string }
      photos: number
    }[]
  }>
> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    // Ensure project belongs to organization
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, location, organization_id')
      .eq('id', projectId)
      .single()

    if (error || !project) return { success: false, error: 'Proyecto no encontrado' }
    if (project.organization_id !== profile.current_organization_id) return { success: false, error: 'Acceso denegado' }

    // Check closure
    const { data: dayData } = await supabase
      .from('bitacora_day_closures')
      .select('id')
      .eq('project_id', projectId)
      .eq('closure_date', dateParam)
      .single()

    const isClosed = !!dayData

    // Fetch entries for the date range
    const startOfDay = `${dateParam}T00:00:00`
    const endOfDay = `${dateParam}T23:59:59`

    const { data: entriesData, error: entriesError } = await supabase
      .from('bitacora_entries')
      .select(`
        id,
        source,
        title,
        content,
        created_at,
        created_by,
        users:created_by (id, full_name)
      `)
      .eq('project_id', projectId)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false })

    if (entriesError) {
      console.error('Error fetching bitacora entries:', entriesError)
      return { success: false, error: entriesError.message }
    }

    const entries = (entriesData ?? []).map((entry: any) => ({
      id: entry.id,
      source: entry.source,
      title: entry.title ?? null,
      content: entry.content ?? '',
      created_at: entry.created_at || new Date().toISOString(),
      created_by: entry.created_by,
      user: {
        id: entry.users?.id ?? entry.created_by ?? 'unknown',
        name: entry.users?.full_name ?? 'Usuario',
      },
      photos: 0,
    }))

    return {
      success: true,
      data: {
        project: { id: project.id, name: project.name, location: project.location ?? '' },
        isClosed,
        entries,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('getBitacoraEntriesAction error:', err)
    return { success: false, error: message }
  }
}

/**
 * Create a manual bitacora entry for a specific project and date
 */
export async function createManualEntryAction(
  projectId: string,
  dateParam: string,
  title: string | null,
  content: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)
    const bitacoraService = (await import('@/lib/services/bitacora.service')).createBitacoraService

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    // Ensure project belongs to organization
    const { data: project, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', profile.current_organization_id)
      .single()

    if (error || !project) return { success: false, error: 'Proyecto no encontrado o acceso denegado' }

    const entryData: any = {
      organization_id: profile.current_organization_id,
      project_id: projectId,
      source: 'MANUAL',
      title: title ?? null,
      content,
      created_by: profile.id,
      created_at: `${dateParam}T12:00:00`,
    }

    const { data: created, error: createError } = await (async () => {
      const { createBitacoraService } = await import('@/lib/services/bitacora.service')
      const svc = createBitacoraService(supabase)
      return svc.createEntry(entryData)
    })()

    if (createError || !created) return { success: false, error: createError?.message || 'Error creando entrada' }

    // Revalidate bitacora day page
    try {
      const path = `/bitacora/${projectId}/${dateParam}`
      ;(await import('next/cache')).revalidatePath(path)
    } catch (e) {
      // ignore revalidation errors
    }

    return { success: true, data: { id: created.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('createManualEntryAction error:', err)
    return { success: false, error: message }
  }
}

/**
 * Close a day officially with BESOP content
 */
export async function closeDayAction(
  projectId: string,
  dateParam: string,
  officialContent: string,
  pin?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()
    if (profileError || !profile) return { success: false, error: 'Usuario no autenticado' }
    if (!profile.current_organization_id) return { success: false, error: 'No hay organización seleccionada' }

    // Ensure project belongs to organization
    const { data: project, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', profile.current_organization_id)
      .single()

    if (error || !project) return { success: false, error: 'Proyecto no encontrado o acceso denegado' }

    // Check if day is already closed
    const { createBitacoraService } = await import('@/lib/services/bitacora.service')
    const bitacoraService = createBitacoraService(supabase)
    
    const { data: isClosed, error: checkError } = await bitacoraService.isDayClosed(projectId, dateParam)
    if (checkError) return { success: false, error: checkError.message }
    if (isClosed) return { success: false, error: 'El día ya está cerrado' }

    // Hash PIN if provided
    let pinHash: string | null = null
    if (pin) {
      // Simple hash for demo - in production use bcrypt or similar
      const crypto = await import('crypto')
      pinHash = crypto.createHash('sha256').update(pin).digest('hex')
    }

    // Create day closure
    const closureData: any = {
      organization_id: profile.current_organization_id,
      project_id: projectId,
      closure_date: dateParam,
      official_content: officialContent,
      pin_hash: pinHash,
      closed_by: profile.id,
      closed_at: new Date().toISOString(),
    }

    const { data: created, error: createError } = await bitacoraService.closeDay(closureData)
    if (createError || !created) return { success: false, error: createError?.message || 'Error cerrando día' }

    // Lock all entries for this day
    const startOfDay = `${dateParam}T00:00:00`
    const endOfDay = `${dateParam}T23:59:59`

    const { data: entries } = await supabase
      .from('bitacora_entries')
      .select('id')
      .eq('project_id', projectId)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)

    if (entries && entries.length > 0) {
      // Lock all entries
      await Promise.all(
        entries.map((entry: any) => bitacoraService.lockEntry(entry.id, profile.id))
      )
    }

    // Revalidate pages
    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath(`/bitacora/${projectId}`)
      revalidatePath(`/bitacora/${projectId}/${dateParam}`)
    } catch (e) {
      // ignore revalidation errors
    }

    return { success: true, data: { id: created.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('closeDayAction error:', err)
    return { success: false, error: message }
  }
}
