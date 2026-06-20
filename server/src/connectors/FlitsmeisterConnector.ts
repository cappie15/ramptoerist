import { v4 as uuid } from 'uuid'

export type VehicleType = 'brandweer' | 'ambulance' | 'politie' | 'traumaheli' | 'knrm' | 'other'

export interface EmergencyVehicle {
  id: string
  type: VehicleType
  callSign: string
  lat: number
  lng: number
  speed: number
  heading: number
  lastSeenAt: string
  source: 'flitsmeister'
  linkedIncidentId: string | null
}

const CATEGORY_TO_VEHICLE: Record<string, VehicleType> = {
  fire: 'brandweer',
  ambulance: 'ambulance',
  police: 'politie',
  traumaheli: 'traumaheli',
  rescue: 'knrm',
  traffic: 'ambulance',
  other: 'other',
}

const CALLSIGNS: Record<VehicleType, string[]> = {
  brandweer: ['B01-1', 'B01-2', 'B02-1', 'HV-01', 'TS-01', 'B03-1', 'HV-02'],
  ambulance: ['A101', 'A102', 'A103', 'A201', 'A202', 'A301', 'A103'],
  politie: ['P10-1', 'P10-2', 'P11-1', 'P12-3', 'P20-1', 'P21-2'],
  traumaheli: ['LLN-1', 'MHN-1', 'MMT-1'],
  knrm: ['RB12', 'RB14', 'RB21'],
  other: ['OV-01', 'OV-02'],
}

export class FlitsmeisterConnector {
  generateVehiclesForIncidents(
    incidents: Array<{
      id: string
      category: string
      lat: number | null
      lng: number | null
      firstSeenAt: string
    }>
  ): EmergencyVehicle[] {
    const vehicles: EmergencyVehicle[] = []

    // Use a seeded-like approach per incident so the same incident always
    // produces the same vehicles (stable between refreshes within a session)
    for (const incident of incidents) {
      if (incident.lat === null || incident.lng === null) continue

      const type = CATEGORY_TO_VEHICLE[incident.category] ?? 'other'
      const signs = CALLSIGNS[type]

      // 1 vehicle per incident, 2 for prio1-looking categories
      const count = ['fire', 'traumaheli', 'rescue'].includes(incident.category) ? 2 : 1

      for (let i = 0; i < count; i++) {
        // Deterministic offset based on incident id hash so it's stable
        const hash = incident.id.charCodeAt(i * 4 + 0) + incident.id.charCodeAt(i * 4 + 1)
        const offsetLat = ((hash % 40) - 20) * 0.001  // ±0.02°  ≈ ±2 km
        const offsetLng = ((hash % 50) - 25) * 0.001

        vehicles.push({
          id: uuid(),
          type,
          callSign: signs[hash % signs.length],
          lat: incident.lat + offsetLat,
          lng: incident.lng + offsetLng,
          speed: (hash % 6) * 10,  // 0, 10, 20, 30, 40, 50 km/h
          heading: (hash * 37) % 360,
          lastSeenAt: new Date(
            new Date(incident.firstSeenAt).getTime() + (hash % 5) * 60_000
          ).toISOString(),
          source: 'flitsmeister',
          linkedIncidentId: incident.id,
        })
      }
    }

    return vehicles
  }
}
