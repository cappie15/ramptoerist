import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { TimeFilter } from '../components/TimeFilter'
import { CategoryIcon } from '../components/CategoryIcon'
import { timeAgo } from '../utils/formatters'
import { filterByTime, type TimeRange } from '../utils/filters'

export function PhotosPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('2h')
  const { incidents, loading, error } = useIncidents()
  const navigate = useNavigate()

  const withPhotos = filterByTime(incidents, timeRange).filter((i) => i.imageUrl)

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--rt-text-muted)' }}>Laden…</div>
  }

  if (error) {
    return (
      <div style={{ padding: '20px', margin: '16px', background: 'var(--rt-error-bg)', borderRadius: '12px', color: 'var(--rt-error-text)' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TimeFilter value={timeRange} onChange={setTimeRange} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {withPhotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--rt-text-muted)' }}>
            Geen foto's beschikbaar in dit tijdvenster
          </div>
        ) : (
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {withPhotos.map((incident) => (
              <div
                key={incident.id}
                onClick={() => navigate(`/incident/${incident.id}`)}
                style={{
                  background: 'var(--rt-surface)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'var(--rt-card-shadow)',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <img
                  src={incident.imageUrl!}
                  alt=""
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '160px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ paddingTop: '2px' }}>
                    <CategoryIcon category={incident.category} size="md" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {incident.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--rt-text-muted)' }}>
                      {incident.city}{incident.street ? ` · ${incident.street}` : ''} · {timeAgo(incident.firstSeenAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
