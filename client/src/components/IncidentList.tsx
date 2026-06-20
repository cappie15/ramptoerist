import type { Incident, GeoCoords } from '../types'
import { IncidentCard } from './IncidentCard'

interface Props {
  incidents: Incident[]
  loading: boolean
  error: string | null
  userCoords?: GeoCoords | null
  emptyMessage?: string
  onSelect?: (id: string) => void
  selectedId?: string | null
}

export function IncidentList({
  incidents,
  loading,
  error,
  userCoords,
  emptyMessage,
  onSelect,
  selectedId,
}: Props) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        Laden…
      </div>
    )
  }
  if (error) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: '#e53e3e',
          background: '#fff5f5',
          borderRadius: '12px',
          margin: '16px',
        }}
      >
        {error}
      </div>
    )
  }
  if (incidents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        {emptyMessage ?? 'Geen incidenten gevonden'}
      </div>
    )
  }
  return (
    <div style={{ padding: '8px 12px' }}>
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          userCoords={userCoords}
          onSelect={onSelect}
          selected={selectedId === incident.id}
        />
      ))}
    </div>
  )
}
