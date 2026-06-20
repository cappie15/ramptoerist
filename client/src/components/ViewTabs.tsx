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
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
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
              borderBottom: active ? '3px solid #e53e3e' : '3px solid transparent',
              color: active ? '#e53e3e' : '#718096',
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
