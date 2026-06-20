import { useNavigate } from 'react-router-dom'
import type { Incident } from '../types'
import { CategoryIcon } from './CategoryIcon'
import { DistanceBadge } from './DistanceBadge'
import { timeAgo } from '../utils/formatters'
import type { GeoCoords } from '../types'
import { haversineDistance } from '../utils/distance'

interface Props {
  incident: Incident
  userCoords?: GeoCoords | null
}

export function IncidentCard({ incident, userCoords }: Props) {
  const navigate = useNavigate()
  const distanceKm =
    userCoords && incident.lat && incident.lng
      ? haversineDistance(userCoords, { lat: incident.lat, lng: incident.lng })
      : null

  return (
    <div
      onClick={() => navigate(`/incident/${incident.id}`)}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        background: '#fff',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 3px 10px rgba(0,0,0,0.14)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 1px 4px rgba(0,0,0,0.08)')
      }
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
          }}
        >
          {incident.title}
        </div>
        <div
          style={{
            fontSize: '0.82rem',
            color: '#718096',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {incident.city}
          {incident.street ? ` · ${incident.street}` : ''}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
            {timeAgo(incident.firstSeenAt)}
          </span>
          <DistanceBadge distanceKm={distanceKm} />
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
      <div style={{ color: '#cbd5e0', alignSelf: 'center' }}>›</div>
    </div>
  )
}
