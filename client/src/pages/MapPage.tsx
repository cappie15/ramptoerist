import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { IncidentMap } from '../components/IncidentMap'

export function MapPage() {
  const { incidents, loading } = useIncidents()
  const navigate = useNavigate()
  const [, setSelectedId] = useState<string | null>(null)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: '#fff',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          Laden…
        </div>
      )}
      <IncidentMap
        incidents={incidents}
        onSelectIncident={(id) => {
          setSelectedId(id)
          navigate(`/incident/${id}`)
        }}
        height="100%"
      />
    </div>
  )
}
