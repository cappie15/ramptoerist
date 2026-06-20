import { useNavigate } from 'react-router-dom'
import type { Incident } from '../types'
import { CategoryIcon } from './CategoryIcon'
import { IncidentMap } from './IncidentMap'
import { formatDateTime } from '../utils/formatters'

interface Props {
  incident: Incident
  onClose?: () => void
}

export function IncidentDetail({ incident, onClose }: Props) {
  const navigate = useNavigate()
  const handleBack = () => (onClose ? onClose() : navigate(-1))

  const mapsUrl =
    incident.lat && incident.lng
      ? `https://www.google.com/maps/search/?api=1&query=${incident.lat},${incident.lng}`
      : null

  return (
    <div style={{ paddingBottom: '40px' }}>
      <button
        onClick={handleBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#718096',
          cursor: 'pointer',
          fontSize: '0.9rem',
          padding: '14px 16px 6px',
        }}
      >
        ← Terug
      </button>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <CategoryIcon category={incident.category} size="lg" />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.3 }}>
            {incident.title}
          </h1>
        </div>

        <p style={{ color: '#4a5568', marginBottom: '16px', lineHeight: 1.5, fontSize: '0.9rem' }}>
          {incident.summary}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <InfoBox label="Tijdstip" value={formatDateTime(incident.firstSeenAt)} />
          <InfoBox label="Locatie" value={`${incident.city}${incident.street ? `, ${incident.street}` : ''}`} />
          <InfoBox label="Categorie" value={incident.category} />
          <InfoBox label="Prioriteit" value={incident.priority} />
        </div>

        {incident.lat && incident.lng && (
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '14px',
              height: '200px',
              border: '1px solid #e2e8f0',
            }}
          >
            <IncidentMap incidents={[incident]} height="200px" />
          </div>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '13px',
              background: '#4285f4',
              color: '#fff',
              borderRadius: '10px',
              textAlign: 'center',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.95rem',
              marginBottom: '18px',
            }}
          >
            🗺️ Navigeer met Google Maps
          </a>
        )}

        {incident.sources && incident.sources.length > 0 && (
          <section style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
              Bronmeldingen ({incident.sources.length})
            </h2>
            {incident.sources.map((source) => (
              <div
                key={source.id}
                style={{
                  background: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#4a5568' }}>
                    {source.sourceName}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#a0aec0' }}>
                    {formatDateTime(source.receivedAt)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#718096' }}>
                  {source.rawMessage}
                </p>
                {source.sourceUrl && (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.72rem', color: '#3182ce' }}
                  >
                    Bekijk bron ↗
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {incident.reportageUrl && (
          <section>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>
              Fotoreportage
            </h2>
            <a
              href={incident.reportageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '12px',
                background: '#fffaf0',
                border: '1px solid #fbd38d',
                borderRadius: '8px',
                color: '#dd6b20',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              📸 Bekijk fotoreportage ↗
            </a>
          </section>
        )}
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '9px 11px' }}>
      <div style={{ fontSize: '0.67rem', color: '#a0aec0', textTransform: 'uppercase', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2d3748' }}>{value}</div>
    </div>
  )
}
