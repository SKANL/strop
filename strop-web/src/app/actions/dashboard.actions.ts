/**
 * Dashboard Server Actions
 * 
 * Server actions for dashboard data retrieval.
 */

'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createAuthService } from '@/lib/services/auth.service'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { geocodingService } from '@/lib/services/geocoding.service'
import type { MapData, GeoJSONFeature } from '@/features/map/types'

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface DashboardStats {
  activeProjects: number
  pausedProjects: number
  totalOpenIncidents: number
  criticalIncidents: number
  closedThisMonth: number
  teamMembers: number
}

interface RecentActivity {
  action: string
  project: string
  time: string
}

interface RecentProject {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStatsAction(): Promise<ActionResult<DashboardStats>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    // Get current user
    const { data: profile, error: profileError } = await authService.getUserProfile()

    if (profileError || !profile) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    if (!profile.current_organization_id) {
      return { success: false, error: 'No hay organización seleccionada' }
    }

    const organizationId = profile.current_organization_id

    // Get projects stats
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('status')
      .eq('organization_id', organizationId)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return { success: false, error: projectsError.message }
    }

    const activeProjects = projects?.filter((p) => p.status === 'ACTIVE').length || 0
    const pausedProjects = projects?.filter((p) => p.status === 'PAUSED').length || 0

    // Get open incidents
    const { data: openIncidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('priority')
      .eq('organization_id', organizationId)
      .in('status', ['OPEN', 'ASSIGNED'])

    if (incidentsError) {
      console.error('Error fetching incidents:', incidentsError)
      return { success: false, error: incidentsError.message }
    }

    const totalOpenIncidents = openIncidents?.length || 0
    const criticalIncidents = openIncidents?.filter((i) => i.priority === 'CRITICAL').length || 0

    // Get closed incidents this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: closedThisMonth, error: closedError } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'CLOSED')
      .gte('closed_at', startOfMonth.toISOString())

    if (closedError) {
      console.error('Error fetching closed incidents:', closedError)
      return { success: false, error: closedError.message }
    }

    // Get team members count
    const { count: teamMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return { success: false, error: membersError.message }
    }

    return {
      success: true,
      data: {
        activeProjects,
        pausedProjects,
        totalOpenIncidents,
        criticalIncidents,
        closedThisMonth: closedThisMonth || 0,
        teamMembers: teamMembers || 0,
      },
    }
  } catch (error) {
    console.error('Unexpected error in getDashboardStatsAction:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: `Error inesperado: ${message}` }
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivityAction(): Promise<ActionResult<RecentActivity[]>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    // Get current user
    const { data: profile, error: profileError } = await authService.getUserProfile()

    if (profileError || !profile) {
      return { success: false, error: 'Usuario no autenticado', data: [] }
    }

    if (!profile.current_organization_id) {
      return { success: false, error: 'No hay organización seleccionada', data: [] }
    }

    // Get recent incidents with project info
    const { data: recentIncidents, error } = await supabase
      .from('incidents')
      .select(
        `
        id,
        title,
        status,
        created_at,
        closed_at,
        projects (
          name
        )
      `
      )
      .eq('organization_id', profile.current_organization_id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      console.error('Error fetching recent activity:', error)
      return { success: false, error: error.message, data: [] }
    }

    const activity =
      recentIncidents?.map((incident) => {
        const isClosed = incident.status === 'CLOSED'
        const date = isClosed ? incident.closed_at : incident.created_at

        return {
          action: isClosed ? 'Incidencia cerrada' : 'Nueva incidencia reportada',
          project: (incident.projects as any)?.name || 'Proyecto',
          time: formatDistanceToNow(new Date(date!), {
            addSuffix: true,
            locale: es,
          }),
        }
      }) || []

    return { success: true, data: activity }
  } catch (error) {
    console.error('Unexpected error in getRecentActivityAction:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: `Error inesperado: ${message}`, data: [] }
  }
}

/**
 * Get recent projects
 */
export async function getRecentProjectsAction(): Promise<ActionResult<RecentProject[]>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    // Get current user
    const { data: profile, error: profileError } = await authService.getUserProfile()

    if (profileError || !profile) {
      return { success: false, error: 'Usuario no autenticado', data: [] }
    }

    if (!profile.current_organization_id) {
      return { success: false, error: 'No hay organización seleccionada', data: [] }
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('organization_id', profile.current_organization_id)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching recent projects:', error)
      return { success: false, error: error.message, data: [] }
    }

    return {
      success: true,
      data: (projects || []).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status as 'ACTIVE' | 'PAUSED' | 'COMPLETED',
      })),
    }
  } catch (error) {
    console.error('Unexpected error in getRecentProjectsAction:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: `Error inesperado: ${message}`, data: [] }
  }
}

/**
 * Get map data (projects and incidents) with geocoding
 */
export async function getMapDataAction(): Promise<ActionResult<MapData>> {
  try {
    const supabase = await createServerActionClient()
    const authService = createAuthService(supabase)

    const { data: profile, error: profileError } = await authService.getUserProfile()

    if (profileError || !profile) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    if (!profile.current_organization_id) {
      return { success: false, error: 'No hay organización seleccionada' }
    }

    const organizationId = profile.current_organization_id

    // 1. Fetch Projects & Incidents in parallel
    // We cast to any here because local Supabase types are out of date vs the real DB
    // preventing us from selecting 'latitude' and 'longitude' without errors.
    const [projectsResponse, incidentsResponse] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, status, location, latitude, longitude, start_date, end_date' as any)
        .eq('organization_id', organizationId)
        .in('status', ['ACTIVE', 'PAUSED']),
      supabase
        .from('incidents')
        .select('id, title, status, priority, location, latitude, longitude, created_at, project_id' as any)
        .eq('organization_id', organizationId)
        .in('status', ['OPEN', 'ASSIGNED']),
    ])

    if (projectsResponse.error) throw new Error(projectsResponse.error.message)
    if (incidentsResponse.error) throw new Error(incidentsResponse.error.message)

    // Define types locally for transformation
    type ProjectRow = {
      id: string
      name: string
      status: string
      location: string | null
      latitude: number | null
      longitude: number | null
    }

    type IncidentRow = {
      id: string
      title: string
      status: string
      priority: string
      location: string | null
      project_id: string
      latitude: number | null
      longitude: number | null
    }

    const projects = (projectsResponse.data || []) as unknown as ProjectRow[]
    const incidents = (incidentsResponse.data || []) as unknown as IncidentRow[]

    // 2. Process Projects (Geocode if needed)
    const processedProjects = await Promise.all(
      projects.map(async (project) => {
        // Only geocode if coordinates are missing
        if ((!project.latitude || !project.longitude) && project.location) {
          const coords = await geocodingService.geocodeAndCache(
            'projects',
            project.id,
            project.location,
            supabase
          )
          if (coords) {
            return { ...project, latitude: coords.lat, longitude: coords.lng }
          }
        }
        return project
      })
    )

    // 3. Process Incidents (Geocode if needed)
    const processedIncidents = await Promise.all(
      incidents.map(async (incident) => {
        if ((!incident.latitude || !incident.longitude) && incident.location) {
          const coords = await geocodingService.geocodeAndCache(
            'incidents',
            incident.id,
            incident.location,
            supabase
          )
          if (coords) {
            return { ...incident, latitude: coords.lat, longitude: coords.lng }
          }
        }
        return incident
      })
    )

    // 4. Transform to GeoJSON
    const projectFeatures: GeoJSONFeature[] = processedProjects
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.longitude!, p.latitude!], // GeoJSON is [lng, lat]
        },
        properties: {
          id: p.id,
          type: 'project',
          name: p.name,
          status: p.status,
          location: p.location || undefined,
        },
      }))

    const incidentFeatures: GeoJSONFeature[] = processedIncidents
      .filter((i) => i.latitude && i.longitude)
      .map((i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [i.longitude!, i.latitude!],
        },
        properties: {
          id: i.id,
          type: 'incident',
          title: i.title,
          status: i.status,
          priority: i.priority,
          location: i.location || undefined,
          projectId: i.project_id,
        },
      }))

    return {
      success: true,
      data: {
        projects: {
          type: 'FeatureCollection',
          features: projectFeatures,
        },
        incidents: {
          type: 'FeatureCollection',
          features: incidentFeatures,
        },
      },
    }
  } catch (error) {
    console.error('Unexpected error in getMapDataAction:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
