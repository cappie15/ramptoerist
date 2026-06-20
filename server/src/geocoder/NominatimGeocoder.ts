import { db } from '../db/database'
import { MockGeocoder, type Geocoder, type GeocoderResult } from './index'

const RATE_LIMIT_MS = 1100

export class NominatimGeocoder implements Geocoder {
  private readonly mock = new MockGeocoder()
  private cache = new Map<string, GeocoderResult | null>()
  private lastRequest = 0

  async geocode(locationText: string, city?: string): Promise<GeocoderResult | null> {
    const mockResult = await this.mock.geocode(locationText, city)
    if (mockResult) return mockResult

    const cacheKey = (city ?? locationText).toLowerCase().trim()
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) ?? null

    try {
      const now = Date.now()
      const wait = this.lastRequest + RATE_LIMIT_MS - now
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      this.lastRequest = Date.now()

      const query = city ? `${city}, Netherlands` : locationText
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=nl`

      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Ramptoerist/1.0 (p2000-incident-viewer)' },
      })

      if (!res.ok) {
        this.cache.set(cacheKey, null)
        return null
      }

      const data = (await res.json()) as { lat: string; lon: string }[]
      if (!data.length) {
        this.cache.set(cacheKey, null)
        return null
      }

      const result: GeocoderResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        confidence: 0.6,
        source: 'nominatim',
      }
      this.cache.set(cacheKey, result)

      // Backfill existing incidents in this city that have no coordinates
      if (city) {
        db.prepare('UPDATE incidents SET lat=?, lng=? WHERE city=? AND lat IS NULL').run(
          result.lat, result.lng, city
        )
      }

      return result
    } catch {
      this.cache.set(cacheKey, null)
      return null
    }
  }
}
