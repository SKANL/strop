'use client'

import { Map, useMap, MapControls, MapPopup } from '@/components/ui/map'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Building2, MapPin, ArrowRight, Activity, Calendar } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, useMemo } from 'react'
import MapLibreGL from 'maplibre-gl'
import type { MapData, GeoJSONFeature } from '../types'

interface DashboardMapProps {
  data: MapData
}

function MapLayers({ data }: DashboardMapProps) {
  const { map, isLoaded } = useMap()
  const { resolvedTheme } = useTheme()
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null)

  // Memoize data to prevent re-processing
  const projectsData = useMemo(() => data.projects, [data.projects])
  const incidentsData = useMemo(() => data.incidents, [data.incidents])

  // Center map on data
  useEffect(() => {
    if (!map || !isLoaded) return

    const bounds = new MapLibreGL.LngLatBounds()
    let hasPoints = false

    projectsData.features.forEach((f) => {
      bounds.extend(f.geometry.coordinates as [number, number])
      hasPoints = true
    })
    incidentsData.features.forEach((f) => {
      bounds.extend(f.geometry.coordinates as [number, number])
      hasPoints = true
    })

    if (hasPoints) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
      })
    } else {
        // No points: Try to locate user, otherwise default to Merida view
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                map.flyTo({
                    center: [pos.coords.longitude, pos.coords.latitude],
                    zoom: 12
                })
            })
        }
        map.setZoom(12)
    }
  }, [map, isLoaded, projectsData, incidentsData])

  // Layer Management
  useEffect(() => {
    if (!map || !isLoaded) return

    // Add Sources
    if (!map.getSource('projects')) {
      map.addSource('projects', {
        type: 'geojson',
        data: projectsData as any,
      })
    } else {
        (map.getSource('projects') as MapLibreGL.GeoJSONSource).setData(projectsData as any)
    }

    if (!map.getSource('incidents')) {
      map.addSource('incidents', {
        type: 'geojson',
        data: incidentsData as any,
      })
    } else {
        (map.getSource('incidents') as MapLibreGL.GeoJSONSource).setData(incidentsData as any)
    }

    // Add Layers
    // Projects Layer (Blue Circles)
    if (!map.getLayer('projects-layer')) {
      map.addLayer({
        id: 'projects-layer',
        type: 'circle',
        source: 'projects',
        paint: {
          'circle-radius': 8,
          'circle-color': '#22c55e', // green-500
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    }

    // Incidents Layer (Red Circles with specific styling based on priority? Keeping simple for now)
    if (!map.getLayer('incidents-layer')) {
      map.addLayer({
        id: 'incidents-layer',
        type: 'circle',
        source: 'incidents',
        paint: {
          'circle-radius': 6,
          'circle-color': '#ef4444', // red-500
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      })
    }

    // Interactions
    const onClick = (e: MapLibreGL.MapMouseEvent) => {
      // Check projects first
      const projectFeatures = map.queryRenderedFeatures(e.point, { layers: ['projects-layer'] })
      if (projectFeatures.length > 0) {
        const feature = projectFeatures[0]
        // Cast props back to our type
        const props = feature.properties as GeoJSONFeature['properties']
        // Geometry comes back as a simple object, need to ensure we get coords
        const geometry = feature.geometry as any // GeoJSON.Geometry
        
        setSelectedFeature({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: geometry.coordinates },
          properties: { ...props, type: 'project' }
        })
        return
      }

      // Check incidents
      const incidentFeatures = map.queryRenderedFeatures(e.point, { layers: ['incidents-layer'] })
      if (incidentFeatures.length > 0) {
        const feature = incidentFeatures[0]
        const props = feature.properties as GeoJSONFeature['properties']
        const geometry = feature.geometry as any

        setSelectedFeature({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: geometry.coordinates },
            properties: { ...props, type: 'incident' }
        })
        return
      }

      // Clicked on empty space
      setSelectedFeature(null)
    }

    // Change cursor on hover
    const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer')
    const onMouseLeave = () => (map.getCanvas().style.cursor = '')

    map.on('click', onClick)
    map.on('mouseenter', 'projects-layer', onMouseEnter)
    map.on('mouseleave', 'projects-layer', onMouseLeave)
    map.on('mouseenter', 'incidents-layer', onMouseEnter)
    map.on('mouseleave', 'incidents-layer', onMouseLeave)

    return () => {
      map.off('click', onClick)
      map.off('mouseenter', 'projects-layer', onMouseEnter)
      map.off('mouseleave', 'projects-layer', onMouseLeave)
      map.off('mouseenter', 'incidents-layer', onMouseEnter)
      map.off('mouseleave', 'incidents-layer', onMouseLeave)
    }
  }, [map, isLoaded, projectsData, incidentsData, resolvedTheme])

    // User Location Tracking
    useEffect(() => {
        if (!map || !isLoaded) return

        // Add native GeolocateControl for the "blue dot" experience
        // We position it 'bottom-right' but we can hide the button with CSS if we want to use our custom one,
        // OR we just use this one since it's robust.
        // Let's use the native one for "Functionality" as requested.
        const geolocate = new MapLibreGL.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        })
        
        map.addControl(geolocate, 'bottom-right')
        
        // Auto-trigger
        setTimeout(() => {
            geolocate.trigger()
        }, 1000)

    }, [map, isLoaded])

    return (
     <>
      <MapControls showZoom showFullscreen position="top-right" />
      
      {selectedFeature && (
        <MapPopup
          longitude={selectedFeature.geometry.coordinates[0]}
          latitude={selectedFeature.geometry.coordinates[1]}
          onClose={() => setSelectedFeature(null)}
          className="p-0 min-w-[300px] bg-transparent border-none shadow-none"
        >
          <Card className="border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                   <Badge variant={selectedFeature.properties.type === 'project' ? 'default' : 'destructive'} className="mb-2">
                        {selectedFeature.properties.type === 'project' ? 'Proyecto' : 'Incidencia'}
                   </Badge>
                   <CardTitle className="text-base font-bold">
                        {selectedFeature.properties.name || selectedFeature.properties.title}
                   </CardTitle>
                </div>
              </div>
              <CardDescription className="flex items-center gap-1 mt-1">
                 <MapPin className="size-3.5" />
                 <span className="truncate max-w-[200px]">{selectedFeature.properties.location}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3 text-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge variant="outline" className="capitalize">{selectedFeature.properties.status.toLowerCase()}</Badge>
                    </div>
                    {selectedFeature.properties.type === 'incident' && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Prioridad:</span>
                            <span className={selectedFeature.properties.priority === 'CRITICAL' ? 'text-red-500 font-bold' : ''}>
                                {selectedFeature.properties.priority}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Button size="sm" className="w-full">
                    Ver Detalles <ArrowRight className="size-4 ml-2" />
                </Button>
            </CardFooter>
          </Card>
        </MapPopup>
      )}
    </>
  )
}

export function DashboardMap({ data }: DashboardMapProps) {
  const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
  /* 
   * Geoapify Styles
   * light: osm-bright (More detailed streets)
   * dark: dark-matter-dark-grey (Better contrast)
   */
  const mapStyles = geoapifyKey ? {
    light: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${geoapifyKey}`,
    dark: `https://maps.geoapify.com/v1/styles/dark-matter-dark-grey/style.json?apiKey=${geoapifyKey}`
  } : undefined

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border bg-muted/20">
      <Map
        center={[-89.62, 20.97]} // Merida Default
        zoom={12}
        styles={mapStyles}
      >
        <MapLayers data={data} />
      </Map>
    </div>
  )
}
