export interface MapProperties {
  id: string
  type: 'project' | 'incident'
  name?: string
  title?: string
  status: string
  priority?: string
  location?: string
  projectId?: string
  [key: string]: any
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: MapProperties
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export interface MapData {
  projects: GeoJSONFeatureCollection
  incidents: GeoJSONFeatureCollection
}
