export type Category = 'fire' | 'ambulance' | 'police' | 'traumaheli' | 'rescue' | 'traffic' | 'other'
export type Priority = 'prio1' | 'prio2' | 'prio3'

export interface Incident {
  id: string
  title: string
  summary: string
  category: Category
  priority: Priority
  firstSeenAt: string
  lastSeenAt: string
  locationText: string
  city: string
  street: string
  lat: number | null
  lng: number | null
  sourceCount: number
  reportageUrl: string | null
  imageUrl: string | null
  sources?: IncidentSource[]
  createdAt: string
  updatedAt: string
}

export interface IncidentSource {
  id: string
  incidentId: string
  sourceName: string
  sourceUrl: string
  rawMessage: string
  receivedAt: string
}

export interface RawSourceMessage {
  id: string
  sourceName: string
  sourceUrl: string
  externalId: string
  rawTitle: string
  rawMessage: string
  receivedAt: string
  locationText: string
  category: Category
  priority: Priority
  metadata: Record<string, unknown>
}

export interface SearchResult {
  incidents: Incident[]
  total: number
}

export interface GeoCoords {
  lat: number
  lng: number
}

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
