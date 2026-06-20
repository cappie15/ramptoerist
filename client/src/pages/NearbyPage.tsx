import { useEffect } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import { useGeolocation } from '../hooks/useGeolocation'
import { IncidentList } from '../components/IncidentList'
import { haversineDistance } from '../utils/distance'

export function NearbyPage() {
  const { coords, loading: geoLoading, error: geoError, request } = useGeolocation()
  const { incidents, loading, error } = useIncidents()

  useEffect(() => {
    request()
  }, [request])

  const nearby = coords
    ? incidents
        .filter((i) => i.lat !== null && i.lng !== null)
        .map((i) => ({
          incident: i,
          dist: haversineDistance(coords, { lat: i.lat!, lng: i.lng! }),
        }))
        .filter((x) => x.dist <= 50)
        .sort((a, b) => a.dist - b.dist)
        .map((x) => x.incident)
    : []

  if (geoLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        📍 Locatie ophalen…
      </div>
    )
  }

  if (geoError) {
    return (
      <div
        style={{
          padding: '20px',
          margin: '16px',
          background: '#fff5f5',
          borderRadius: '12px',
          color: '#e53e3e',
          lineHeight: 1.6,
        }}
      >
        <strong>⚠️ Locatietoegang geweigerd</strong>
        <p style={{ margin: '8px 0 0' }}>{geoError}</p>
        <button
          onClick={request}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            background: '#e53e3e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Opnieuw proberen
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {coords && (
        <div
          style={{
            padding: '8px 16px',
            background: '#ebf8ff',
            fontSize: '0.8rem',
            color: '#2b6cb0',
          }}
        >
          📍 Incidenten binnen 50 km van uw locatie ({nearby.length} gevonden)
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <IncidentList
          incidents={nearby}
          loading={loading}
          error={error}
          userCoords={coords}
          emptyMessage="Geen incidenten binnen 50 km van uw locatie"
        />
      </div>
    </div>
  )
}
