import { useNavigate } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { useVehicles } from '../hooks/useVehicles'
import { IncidentMap } from '../components/IncidentMap'

export function MapPage() {
  const { incidents, loading } = useIncidents()
  const vehicles = useVehicles()
  const navigate = useNavigate()

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
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 1000,
          background: '#1a365d',
          color: '#fff',
          borderRadius: '8px',
          padding: '5px 10px',
          fontSize: '0.72rem',
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      >
        🔥 incident &nbsp; 🚒 voertuig (Flitsmeister)
      </div>
      <IncidentMap
        incidents={incidents}
        vehicles={vehicles}
        onSelectIncident={(id) => navigate(`/incident/${id}`)}
        height="100%"
      />
    </div>
  )
}
