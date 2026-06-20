import { useNavigate } from 'react-router-dom'
import type { Incident, GeoCoords } from '../types'
import { CategoryIcon } from './CategoryIcon'
import { DistanceBadge } from './DistanceBadge'
import { timeAgo } from '../utils/formatters'
import { haversineDistance } from '../utils/distance'
import { getIncidentStatus } from '../utils/filters'

interface Props {
  incident: Incident
  userCoords?: GeoCoords | null
  onSelect?: (id: string) => void
  selected?: boolean
}

export function IncidentCard({ incident, userCoords, onSelect, selected }: Props) {
  const navigate = useNavigate()
  const distanceKm =
    userCoords && incident.lat && incident.lng
      ? haversineDistance(userCoords, { lat: incident.lat, lng: incident.lng })
      : null

  const handleClick = () => (onSelect ? onSelect(incident.id) : navigate(`/incident/${incident.id}`))
  const status = getIncidentStatus(incident)

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        background: selected ? 'var(--rt-selected-bg)' : 'var(--rt-surface)',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '8px',
        boxShadow: selected ? `0 0 0 2px var(--rt-selected-ring)` : 'var(--rt-card-shadow)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, background 0.15s',
        WebkitTapHighlightColor: 'transparent',
        borderLeft: selected ? '3px solid var(--rt-accent)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--rt-card-hover-shadow)'
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--rt-card-shadow)'
      }}
    >
      <div style={{ paddingTop: '2px' }}>
        <CategoryIcon category={incident.category} size="md" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.95rem',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--rt-text)',
          }}
        >
          {incident.title}
        </div>
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--rt-text-muted)',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {incident.city}
          {incident.street ? ` · ${incident.street}` : ''}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--rt-text-faint)' }}>
            {timeAgo(incident.firstSeenAt)}
          </span>
          <DistanceBadge distanceKm={distanceKm} />
          <span
            style={{
              fontSize: '0.72rem',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontWeight: 600,
              background: status === 'actief' ? '#f0fff4' : 'var(--rt-bg)',
              color: status === 'actief' ? '#276749' : 'var(--rt-text-muted)',
              border: `1px solid ${status === 'actief' ? '#9ae6b4' : 'var(--rt-border)'}`,
            }}
          >
            {status}
          </span>
          {incident.sourceCount > 1 && (
            <span
              style={{
                fontSize: '0.75rem',
                background: '#faf5ff',
                color: '#805ad5',
                borderRadius: '9999px',
                padding: '2px 8px',
                fontWeight: 600,
              }}
            >
              {incident.sourceCount} bronnen
            </span>
          )}
        </div>
      </div>
      <div style={{ color: 'var(--rt-border)', alignSelf: 'center' }}>›</div>
    </div>
  )
}
