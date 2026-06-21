import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useBreakpoint } from './hooks/useBreakpoint'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { SplitLayout } from './layouts/SplitLayout'
import { ViewTabs } from './components/ViewTabs'
import { RecentPage } from './pages/RecentPage'
import { MapPage } from './pages/MapPage'
import { NearbyPage } from './pages/NearbyPage'
import { PhotosPage } from './pages/PhotosPage'
import { IncidentDetailPage } from './pages/IncidentDetailPage'

function MobileHeader() {
  const { theme, toggle } = useTheme()
  return (
    <header
      style={{
        background: 'var(--rt-header-bg)',
        color: 'var(--rt-header-text)',
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
        <div style={{ fontSize: '0.7rem', color: 'var(--rt-header-sub)', marginTop: '1px' }}>
          P2000 · 112 · Realtime incidenten
        </div>
      </div>
      <button
        onClick={toggle}
        aria-label="Schakel donker/licht thema"
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '4px',
          color: 'var(--rt-header-sub)',
          lineHeight: 1,
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}

function AppRoutes() {
  const { isMobile, isDesktop } = useBreakpoint()

  if (!isMobile) {
    return (
      <Routes>
        <Route path="/*" element={<SplitLayout isDesktop={isDesktop} />} />
      </Routes>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'var(--rt-bg)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <MobileHeader />
      <Routes>
        <Route path="/" element={<Navigate to="/nearby" replace />} />
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
          path="/recent"
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
          path="/photos"
          element={
            <>
              <ViewTabs />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <PhotosPage />
              </div>
            </>
          }
        />
        <Route
          path="/incident/:id"
          element={<div style={{ flex: 1, overflowY: 'auto' }}><IncidentDetailPage /></div>}
        />
        <Route path="*" element={<Navigate to="/nearby" replace />} />
      </Routes>
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}
