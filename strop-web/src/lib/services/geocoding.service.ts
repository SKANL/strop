import { type SupabaseClient } from '@supabase/supabase-js'

interface GeocodeResult {
  lat: number
  lng: number
}

interface GeoapifyFeature {
  properties: {
    lat: number
    lon: number
  }
}

interface GeoapifyResponse {
  features: GeoapifyFeature[]
}

/**
 * Service to handle geocoding of entities (projects, incidents)
 * Caches results in the database to avoid repeated API calls.
 */
export const geocodingService = {
  /**
   * Geocodes an entity's address.
   * If the entity already has coordinates in the DB (checked via passed object or separate query),
   * this function might not need to be called if the caller checks first.
   * But here we assume we want to geocode and SAVE if missing.
   *
   * @param table The table name ('projects' or 'incidents')
   * @param id The UUID of the entity
   * @param address The address string to geocode
   * @param supabase The Supabase client instance
   * @returns The coordinates { lat, lng } or null if failed/not found
   */
  async geocodeAndCache(
    table: 'projects' | 'incidents',
    id: string,
    address: string,
    supabase: SupabaseClient
  ): Promise<GeocodeResult | null> {
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

    if (!apiKey) {
      console.warn('Geocoding skipped: NEXT_PUBLIC_GEOAPIFY_API_KEY is missing.')
      return null
    }

    if (!address) return null

    try {
      // 1. Fetch from Geoapify
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        address
      )}&apiKey=${apiKey}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error(`Geoapify API error: ${response.statusText}`)
        return null
      }

      const data: GeoapifyResponse = await response.json()

      if (!data.features || data.features.length === 0) {
        console.warn(`No geocoding results found for address: ${address}`)
        return null
      }

      const { lat, lon: lng } = data.features[0].properties

      // 2. Cache in Database
      const { error } = await supabase
        .from(table)
        .update({ latitude: lat, longitude: lng })
        .eq('id', id)

      if (error) {
        console.error(`Error caching coordinates for ${table} ${id}:`, error)
        // We still return the coords even if save failed
      }

      return { lat, lng }
    } catch (error) {
      console.error('Unexpected error in geocoding service:', error)
      return null
    }
  },
}
