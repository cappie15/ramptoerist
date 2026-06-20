import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ViewTabs } from './components/ViewTabs'
import { RecentPage } from './pages/RecentPage'
import { MapPage } from './pages/MapPage'
import { NearbyPage } from './pages/NearbyPage'
import { IncidentDetailPage } from './pages/IncidentDetailPage'

export function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#f7fafc',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <header
          style={{
            background: '#1a202c',
            color: '#fff',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>
              Ramptoerist
            </div>
            <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: '1px' }}>
              P2000 · 112 · Realtime incidenten
            </div>
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <>
                <ViewTabs />
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <RecentPage />
                </div>
              </>
            }
          />
          <Route
            path="/map"
            element={
              <>
                <ViewTabs />
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <MapPage />
                </div>
              </>
            }
          />
          <Route
            path="/nearby"
            element={
              <>
                <ViewTabs />
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <NearbyPage />
                </div>
              </>
            }
          />
          <Route path="/incident/:id" element={<div style={{ flex: 1, overflowY: 'auto' }}><IncidentDetailPage /></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
