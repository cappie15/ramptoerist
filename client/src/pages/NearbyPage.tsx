import { useEffect, useState } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import { useGeolocation } from '../hooks/useGeolocation'
import { IncidentList } from '../components/IncidentList'
import { RadiusSlider } from '../components/RadiusSlider'
import { TimeFilter } from '../components/TimeFilter'
import { IncidentFilters } from '../components/IncidentFilters'
import { haversineDistance } from '../utils/distance'
import { filterByTime, filterByCategory, filterByPriority, type TimeRange, type CategoryFilter, type PriorityFilter } from '../utils/filters'

export function NearbyPage() {
  const { coords, loading: geoLoading, error: geoError, request } = useGeolocation()
  const { incidents, loading, error } = useIncidents()
  const [radiusKm, setRadiusKm] = useState(12)
  const [timeRange, setTimeRange] = useState<TimeRange>('2h')
  const [catFilter, setCatFilter] = useState<CategoryFilter>(new Set())
  const [prioFilter, setPrioFilter] = useState<PriorityFilter>(new Set())

  useEffect(() => { request() }, [request])

  const filtered = filterByPriority(filterByCategory(filterByTime(incidents, timeRange), catFilter), prioFilter)
  const nearby = coords
    ? filtered
        .filter((i) => i.lat !== null && i.lng !== null)
        .map((i) => ({ incident: i, dist: haversineDistance(coords, { lat: i.lat!, lng: i.lng! }) }))
        .filter((x) => x.dist <= radiusKm)
        .sort((a, b) => a.dist - b.dist)
        .map((x) => x.incident)
    : []

  if (geoLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--rt-text-muted)' }}>📍 Locatie ophalen…</div>
  }

  if (geoError) {
    return (
      <div style={{ padding: '20px', margin: '16px', background: 'var(--rt-error-bg)', borderRadius: '12px', color: 'var(--rt-error-text)', lineHeight: 1.6 }}>
        <strong>⚠️ Locatietoegang geweigerd</strong>
        <p style={{ margin: '8px 0 0' }}>{geoError}</p>
        <button onClick={request} style={{ marginTop: '12px', padding: '10px 20px', background: 'var(--rt-accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Opnieuw proberen
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <RadiusSlider value={radiusKm} onChange={setRadiusKm} />
      <TimeFilter value={timeRange} onChange={setTimeRange} />
      <IncidentFilters categories={catFilter} priorities={prioFilter} onCategoryChange={setCatFilter} onPriorityChange={setPrioFilter} />
      {coords && (
        <div style={{ padding: '8px 16px', background: 'var(--rt-info-bg)', fontSize: '0.8rem', color: 'var(--rt-info-text)' }}>
          📍 {nearby.length} incidenten binnen {radiusKm} km
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <IncidentList incidents={nearby} loading={loading} error={error} userCoords={coords} emptyMessage={`Geen incidenten binnen ${radiusKm} km van uw locatie`} />
      </div>
    </div>
  )
}
