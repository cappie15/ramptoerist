import { describe, it, expect } from 'vitest'

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    const p = { lat: 52.37, lng: 4.90 }
    expect(haversineDistance(p, p)).toBeCloseTo(0, 5)
  })

  it('Amsterdam to Rotterdam is approx 57 km', () => {
    const amsterdam = { lat: 52.3676, lng: 4.9041 }
    const rotterdam = { lat: 51.9225, lng: 4.4792 }
    const dist = haversineDistance(amsterdam, rotterdam)
    expect(dist).toBeGreaterThan(55)
    expect(dist).toBeLessThan(60)
  })

  it('Amsterdam to Maastricht is approx 177 km', () => {
    const amsterdam = { lat: 52.3676, lng: 4.9041 }
    const maastricht = { lat: 50.8514, lng: 5.6909 }
    const dist = haversineDistance(amsterdam, maastricht)
    expect(dist).toBeGreaterThan(170)
    expect(dist).toBeLessThan(185)
  })

  it('is commutative', () => {
    const a = { lat: 52.1601, lng: 4.4970 }
    const b = { lat: 51.9225, lng: 4.4792 }
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 5)
  })
})
