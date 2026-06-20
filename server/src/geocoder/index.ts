import type { NormalizedMessage } from '../types'

export interface GeoCoords {
  lat: number
  lng: number
}

export interface GeocoderResult {
  lat: number
  lng: number
  confidence: number
  source: string
}

export interface Geocoder {
  geocode(locationText: string, city?: string): Promise<GeocoderResult | null>
}

export class MockGeocoder implements Geocoder {
  private readonly cityCoords: Record<string, GeoCoords> = {
    'Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Rotterdam': { lat: 51.9225, lng: 4.4792 },
    'Utrecht': { lat: 52.0907, lng: 5.1214 },
    'Leiden': { lat: 52.1601, lng: 4.4970 },
    'Arnhem': { lat: 51.9851, lng: 5.8987 },
    'Eindhoven': { lat: 51.4416, lng: 5.4697 },
    'Groningen': { lat: 53.2194, lng: 6.5665 },
    'Enschede': { lat: 52.2215, lng: 6.8937 },
    'Maastricht': { lat: 50.8514, lng: 5.6909 },
    'Noordwijk': { lat: 52.2437, lng: 4.4475 },
    'Tilburg': { lat: 51.5555, lng: 5.0913 },
    'Almelo': { lat: 52.3520, lng: 6.6650 },
    'Hellevoetsluis': { lat: 51.8320, lng: 4.1290 },
  }

  async geocode(locationText: string, city?: string): Promise<GeocoderResult | null> {
    const searchCity = city ?? this.extractCity(locationText)
    if (searchCity && this.cityCoords[searchCity]) {
      const coords = this.cityCoords[searchCity]
      return { lat: coords.lat, lng: coords.lng, confidence: 0.7, source: 'mock' }
    }
    return null
  }

  private extractCity(locationText: string): string {
    const parts = locationText.split(',')
    return parts[parts.length - 1].trim()
  }
}

export function enrichWithGeocoderFallback(msg: NormalizedMessage, geocoder: Geocoder): Promise<NormalizedMessage> {
  if (msg.lat !== null && msg.lng !== null) return Promise.resolve(msg)
  return geocoder.geocode(msg.locationText, msg.city).then((result) => {
    if (!result) return msg
    return { ...msg, lat: result.lat, lng: result.lng }
  })
}
