import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { useVehicles } from '../hooks/useVehicles'
import { useGeolocation } from '../hooks/useGeolocation'
import { useTheme } from '../contexts/ThemeContext'
import { IncidentList } from '../components/IncidentList'
import { IncidentMap } from '../components/IncidentMap'
import { IncidentDetail } from '../components/IncidentDetail'
import { SearchBar } from '../components/SearchBar'
import { TimeFilter } from '../components/TimeFilter'
import { RadiusSlider } from '../components/RadiusSlider'
import { haversineDistance } from '../utils/distance'
import { filterByTime, type TimeRange } from '../utils/filters'
import type { Incident } from '../types'

type LeftView = 'nearby' | 'recent'

interface Props {
  isDesktop: boolean
}

export function SplitLayout({ isDesktop }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useTheme()

  const urlMatch = location.pathname.match(/^\/incident\/(.+)$/)
  const selectedId = urlMatch ? urlMatch[1] : null

  const [activeView, setActiveView] = useState<LeftView>('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('2h')
  const [radiusKm, setRadiusKm] = useState(12)
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const effectiveQuery = activeView === 'recent' && searchQuery ? searchQuery : undefined
  const { incidents, loading, error } = useIncidents(effectiveQuery)
  const vehicles = useVehicles()
  const { coords, loading: geoLoading, error: geoError, request } = useGeolocation()

  useEffect(() => {
    if (activeView === 'nearby' && !coords) request()
  }, [activeView, coords, request])

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

  const timeFiltered = filterByTime(incidents, timeRange)

  const displayedIncidents =
    activeView === 'nearby' && coords
      ? timeFiltered
          .filter((i) => i.lat != null && i.lng != null)
          .map((i) => ({ i, d: haversineDistance(coords, { lat: i.lat!, lng: i.lng! }) }))
          .filter(({ d }) => d <= radiusKm)
          .sort((a, b) => a.d - b.d)
          .map(({ i }) => i)
      : timeFiltered

  const leftWidth = isDesktop ? '340px' : '42%'
  const showRightPanel = isDesktop && selectedId
  const showOverlay = !isDesktop && selectedId

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'var(--rt-bg)',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: 'var(--rt-header-bg)',
          color: 'var(--rt-header-text)',
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
          <div style={{ fontSize: '0.68rem', color: 'var(--rt-header-sub)' }}>
            P2000 · 112 · Realtime incidenten
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            color: 'var(--rt-header-sub)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <span>{incidents.length} incidenten</span>
          {vehicles.length > 0 && <span>{vehicles.length} voertuigen</span>}
          <button
            onClick={toggle}
            aria-label="Schakel donker/licht thema"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '2px 4px',
              color: 'var(--rt-header-sub)',
              lineHeight: 1,
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
            borderRight: '1px solid var(--rt-border)',
            background: 'var(--rt-surface)',
            overflow: 'hidden',
          }}
        >
          {/* 2-tab nav */}
          <nav style={{ display: 'flex', borderBottom: '1px solid var(--rt-border)', flexShrink: 0 }}>
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
                    borderBottom: active ? '3px solid var(--rt-accent)' : '3px solid transparent',
                    color: active ? 'var(--rt-accent)' : 'var(--rt-text-muted)',
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

          {/* Nearby controls */}
          {activeView === 'nearby' && (
            <>
              <RadiusSlider value={radiusKm} onChange={setRadiusKm} />
              <TimeFilter value={timeRange} onChange={setTimeRange} />
            </>
          )}

          {/* Recent controls */}
          {activeView === 'recent' && (
            <>
              <SearchBar onSearch={setSearchQuery} value={searchQuery} />
              <TimeFilter value={timeRange} onChange={setTimeRange} />
            </>
          )}

          {/* Nearby status messages */}
          {activeView === 'nearby' && geoLoading && (
            <div style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'var(--rt-text-muted)' }}>
              📍 Locatie ophalen…
            </div>
          )}
          {activeView === 'nearby' && geoError && (
            <div
              style={{
                margin: '8px',
                padding: '10px 12px',
                background: 'var(--rt-error-bg)',
                borderRadius: '8px',
                color: 'var(--rt-error-text)',
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
                  background: 'var(--rt-accent)',
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
                background: 'var(--rt-info-bg)',
                fontSize: '0.73rem',
                color: 'var(--rt-info-text)',
                flexShrink: 0,
              }}
            >
              📍 {displayedIncidents.length} incidenten binnen {radiusKm} km
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
              borderLeft: '1px solid var(--rt-border)',
              background: 'var(--rt-surface)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--rt-text-muted)' }}>
                Laden…
              </div>
            ) : detailIncident ? (
              <IncidentDetail incident={detailIncident} onClose={handleClose} />
            ) : null}
          </div>
        )}

        {/* ── Tablet detail overlay ── */}
        {showOverlay && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '58%',
              background: 'var(--rt-surface)',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
              overflowY: 'auto',
              zIndex: 100,
            }}
          >
            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--rt-text-muted)' }}>
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
