import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/nearby', label: 'Dichtbij', icon: '📍' },
  { path: '/map', label: 'Kaart', icon: '🗺️' },
  { path: '/recent', label: 'Recent', icon: '📋' },
]

export function ViewTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      style={{
        display: 'flex',
        background: 'var(--rt-surface)',
        borderBottom: '1px solid var(--rt-border)',
      }}
    >
      {TABS.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              borderBottom: active ? '3px solid var(--rt-accent)' : '3px solid transparent',
              color: active ? 'var(--rt-accent)' : 'var(--rt-text-muted)',
              fontWeight: active ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
