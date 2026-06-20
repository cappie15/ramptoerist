import type { Incident } from '../types/index'

export type TimeRange = '1h' | '2h' | '6h' | '24h' | 'all'

const RANGE_HOURS: Record<TimeRange, number | null> = {
  '1h': 1,
  '2h': 2,
  '6h': 6,
  '24h': 24,
  'all': null,
}

export function filterByTime(incidents: Incident[], range: TimeRange): Incident[] {
  const hours = RANGE_HOURS[range]
  if (hours === null) return incidents
  const cutoff = Date.now() - hours * 3_600_000
  return incidents.filter((i) => new Date(i.firstSeenAt).getTime() >= cutoff)
}

export function getIncidentStatus(incident: Incident): 'actief' | 'afgesloten' {
  const lastSeen = incident.lastSeenAt || incident.firstSeenAt
  return Date.now() - new Date(lastSeen).getTime() < 4 * 3_600_000 ? 'actief' : 'afgesloten'
}
