import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { useVehicles } from '../hooks/useVehicles'
import { useGeolocation } from '../hooks/useGeolocation'
import { IncidentList } from '../components/IncidentList'
import { IncidentMap } from '../components/IncidentMap'
import { IncidentDetail } from '../components/IncidentDetail'
import { SearchBar } from '../components/SearchBar'
import { haversineDistance } from '../utils/distance'
import type { Incident } from '../types'

type LeftView = 'nearby' | 'recent'

interface Props {
  isDesktop: boolean
}

const APP_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  background: '#f7fafc',
}

export function SplitLayout({ isDesktop }: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  // Derive selected incident id from URL
  const urlMatch = location.pathname.match(/^\/incident\/(.+)$/)
  const selectedId = urlMatch ? urlMatch[1] : null

  const [activeView, setActiveView] = useState<LeftView>('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const effectiveQuery = activeView === 'recent' && searchQuery ? searchQuery : undefined
  const { incidents, loading, error } = useIncidents(effectiveQuery)
  const vehicles = useVehicles()
  const { coords, loading: geoLoading, error: geoError, request } = useGeolocation()

  // Request geolocation when switching to nearby
  useEffect(() => {
    if (activeView === 'nearby' && !coords) request()
  }, [activeView, coords, request])

  // Fetch full incident detail when selected id changes
  useEffect(() => {
    if (!selectedId) {
      setDetailIncident(null)
      return
    }
    setDetailLoading(true)
    fetch(`/api/incidents/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetailIncident(data)
        setDetailLoading(false)
      })
      .catch(() => setDetailLoading(false))
  }, [selectedId])

  const handleSelect = (id: string) => navigate(`/incident/${id}`)
  const handleClose = () => navigate(-1)

  // Filter + sort for nearby view
  const displayedIncidents =
    activeView === 'nearby' && coords
      ? incidents
          .filter((i) => i.lat != null && i.lng != null)
          .map((i) => ({ i, d: haversineDistance(coords, { lat: i.lat!, lng: i.lng! }) }))
          .filter(({ d }) => d <= 50)
          .sort((a, b) => a.d - b.d)
          .map(({ i }) => i)
      : incidents

  const leftWidth = isDesktop ? '340px' : '42%'
  const showRightPanel = isDesktop && selectedId
  const showOverlay = !isDesktop && selectedId

  return (
    <div style={APP_STYLE}>
      {/* ── Header ── */}
      <header
        style={{
          background: '#1a202c',
          color: '#fff',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🚨</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.02em' }}>
            Ramptoerist
          </div>
          <div style={{ fontSize: '0.68rem', color: '#a0aec0' }}>
            P2000 · 112 · Realtime incidenten
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#718096', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span>{incidents.length} incidenten</span>
          {vehicles.length > 0 && <span>{vehicles.length} voertuigen</span>}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Left panel ── */}
        <div
          style={{
            width: leftWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #e2e8f0',
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* 2-tab nav */}
          <nav style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            {(['nearby', 'recent'] as LeftView[]).map((view) => {
              const active = activeView === view
              return (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  style={{
                    flex: 1,
                    padding: '11px 8px',
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? '3px solid #e53e3e' : '3px solid transparent',
                    color: active ? '#e53e3e' : '#718096',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: '1.05rem' }}>
                    {view === 'nearby' ? '📍' : '📋'}
                  </span>
                  {view === 'nearby' ? 'Dichtbij' : 'Recent'}
                </button>
              )
            })}
          </nav>

          {/* Search (recent only) */}
          {activeView === 'recent' && (
            <SearchBar onSearch={setSearchQuery} value={searchQuery} />
          )}

          {/* Nearby status messages */}
          {activeView === 'nearby' && geoLoading && (
            <div style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#718096' }}>
              📍 Locatie ophalen…
            </div>
          )}
          {activeView === 'nearby' && geoError && (
            <div
              style={{
                margin: '8px',
                padding: '10px 12px',
                background: '#fff5f5',
                borderRadius: '8px',
                color: '#e53e3e',
                fontSize: '0.8rem',
              }}
            >
              ⚠️ {geoError}
              <button
                onClick={request}
                style={{
                  display: 'block',
                  marginTop: '6px',
                  padding: '6px 12px',
                  background: '#e53e3e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}
          {activeView === 'nearby' && coords && (
            <div
              style={{
                padding: '5px 12px',
                background: '#ebf8ff',
                fontSize: '0.73rem',
                color: '#2b6cb0',
                flexShrink: 0,
              }}
            >
              📍 {displayedIncidents.length} incidenten binnen 50 km
            </div>
          )}

          {/* Incident list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <IncidentList
              incidents={displayedIncidents}
              loading={loading}
              error={error}
              userCoords={coords}
              selectedId={selectedId}
              onSelect={handleSelect}
              emptyMessage={
                activeView === 'nearby' && !coords
                  ? 'Sta locatietoegang toe om nabijgelegen incidenten te zien'
                  : searchQuery
                  ? `Geen resultaten voor "${searchQuery}"`
                  : 'Geen incidenten gevonden'
              }
            />
          </div>
        </div>

        {/* ── Map ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <IncidentMap
            incidents={incidents}
            vehicles={vehicles}
            userCoords={coords}
            onSelectIncident={handleSelect}
            height="100%"
          />
        </div>

        {/* ── Right detail panel (desktop only) ── */}
        {showRightPanel && (
          <div
            style={{
              width: '380px',
              flexShrink: 0,
              borderLeft: '1px solid #e2e8f0',
              background: '#fff',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
                Laden…
              </div>
            ) : detailIncident ? (
              <IncidentDetail incident={detailIncident} onClose={handleClose} />
            ) : null}
          </div>
        )}

        {/* ── Tablet detail overlay (slides over map) ── */}
        {showOverlay && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '58%',
              background: '#fff',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
              overflowY: 'auto',
              zIndex: 100,
            }}
          >
            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
                Laden…
              </div>
            ) : detailIncident ? (
              <IncidentDetail incident={detailIncident} onClose={handleClose} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
